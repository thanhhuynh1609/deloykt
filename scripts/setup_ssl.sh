#!/bin/bash

# SSL Setup Script with Let's Encrypt
# Automatically configures SSL certificates for the domain

set -e

# Configuration
DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"admin@$DOMAIN"}
WEBROOT="/var/www/certbot"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
    
    # Check if nginx is installed
    if ! command -v nginx &> /dev/null; then
        error "Nginx is not installed"
    fi
    
    # Check if domain is provided
    if [ "$DOMAIN" = "your-domain.com" ]; then
        error "Please provide a valid domain name"
    fi
    
    # Check if domain resolves to this server
    local server_ip=$(curl -s ifconfig.me)
    local domain_ip=$(dig +short $DOMAIN)
    
    if [ "$server_ip" != "$domain_ip" ]; then
        warning "Domain $DOMAIN does not resolve to this server IP ($server_ip)"
        warning "Current domain IP: $domain_ip"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log "Prerequisites check passed"
}

# Install Certbot
install_certbot() {
    log "Installing Certbot..."
    
    # Update package list
    apt update
    
    # Install snapd if not present
    if ! command -v snap &> /dev/null; then
        apt install -y snapd
        systemctl enable --now snapd.socket
        ln -sf /var/lib/snapd/snap /snap
    fi
    
    # Install certbot via snap
    snap install core; snap refresh core
    snap install --classic certbot
    
    # Create symlink
    ln -sf /snap/bin/certbot /usr/bin/certbot
    
    log "Certbot installed successfully"
}

# Create webroot directory
create_webroot() {
    log "Creating webroot directory..."
    
    mkdir -p $WEBROOT
    chown -R www-data:www-data $WEBROOT
    chmod -R 755 $WEBROOT
    
    log "Webroot directory created: $WEBROOT"
}

# Configure Nginx for HTTP challenge
configure_nginx_http() {
    log "Configuring Nginx for HTTP challenge..."
    
    # Create temporary nginx config for challenge
    cat > /etc/nginx/sites-available/temp-ssl-setup <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
    
    # Enable the temporary config
    ln -sf /etc/nginx/sites-available/temp-ssl-setup /etc/nginx/sites-enabled/
    
    # Test nginx config
    nginx -t
    
    # Reload nginx
    systemctl reload nginx
    
    log "Nginx configured for HTTP challenge"
}

# Obtain SSL certificate
obtain_certificate() {
    log "Obtaining SSL certificate from Let's Encrypt..."
    
    # Run certbot
    certbot certonly \
        --webroot \
        --webroot-path=$WEBROOT \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN,www.$DOMAIN \
        --non-interactive
    
    if [ $? -eq 0 ]; then
        log "SSL certificate obtained successfully"
    else
        error "Failed to obtain SSL certificate"
    fi
}

# Configure Nginx with SSL
configure_nginx_ssl() {
    log "Configuring Nginx with SSL..."
    
    # Remove temporary config
    rm -f /etc/nginx/sites-enabled/temp-ssl-setup
    
    # Create SSL-enabled nginx config
    cat > /etc/nginx/sites-available/ecommerce-ssl <<EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

# Upstream for Django
upstream django {
    server 127.0.0.1:8000;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # File upload size
    client_max_body_size 100M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;
    
    # Static files
    location /static/ {
        alias /var/www/ecommerce/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /var/www/ecommerce/media/;
        expires 7d;
        add_header Cache-Control "public";
    }
    
    # WebSocket connections
    location /ws/ {
        proxy_pass http://django;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
    
    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://django;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Auth endpoints with stricter rate limiting
    location ~ ^/(auth|api/auth)/ {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://django;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Main application
    location / {
        proxy_pass http://django;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # Enable the SSL config
    ln -sf /etc/nginx/sites-available/ecommerce-ssl /etc/nginx/sites-enabled/
    
    # Remove default nginx site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx config
    nginx -t
    
    # Reload nginx
    systemctl reload nginx
    
    log "Nginx configured with SSL"
}

# Setup auto-renewal
setup_auto_renewal() {
    log "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /usr/local/bin/renew-ssl.sh <<EOF
#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx"
EOF
    
    chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/renew-ssl.sh") | crontab -
    
    log "Auto-renewal configured"
}

# Test SSL configuration
test_ssl() {
    log "Testing SSL configuration..."
    
    # Wait a moment for nginx to fully reload
    sleep 5
    
    # Test HTTPS connection
    if curl -f -s https://$DOMAIN > /dev/null; then
        log "HTTPS connection test successful"
    else
        warning "HTTPS connection test failed"
    fi
    
    # Test HTTP to HTTPS redirect
    local redirect_status=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN)
    if [ "$redirect_status" = "301" ]; then
        log "HTTP to HTTPS redirect working correctly"
    else
        warning "HTTP to HTTPS redirect not working (status: $redirect_status)"
    fi
}

# Display SSL information
display_ssl_info() {
    log "SSL setup completed successfully!"
    
    info "Certificate details:"
    certbot certificates
    
    info "Your website is now accessible at:"
    info "  https://$DOMAIN"
    info "  https://www.$DOMAIN"
    
    info "Certificate will auto-renew via cron job"
    info "Next renewal check: $(date -d '+60 days')"
}

# Main function
main() {
    log "Starting SSL setup for domain: $DOMAIN"
    
    check_prerequisites
    install_certbot
    create_webroot
    configure_nginx_http
    obtain_certificate
    configure_nginx_ssl
    setup_auto_renewal
    test_ssl
    display_ssl_info
    
    log "SSL setup completed successfully!"
}

# Show usage if no domain provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <domain> [email]"
    echo "Example: $0 example.com admin@example.com"
    exit 1
fi

# Run main function
main
