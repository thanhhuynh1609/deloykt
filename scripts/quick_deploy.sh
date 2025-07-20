#!/bin/bash

# Quick Deploy Script - One-command deployment
# Usage: ./scripts/quick_deploy.sh [domain] [email]

set -e

# Configuration
DOMAIN=${1:-""}
EMAIL=${2:-""}
PROJECT_DIR="/var/www/ecommerce"
REPO_URL="https://github.com/your-username/your-repo.git"  # Update this

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

# Show banner
show_banner() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    E-COMMERCE QUICK DEPLOYMENT SCRIPT"
    echo "=================================================="
    echo -e "${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Please run as a regular user with sudo privileges."
    fi
    
    # Check sudo access
    if ! sudo -n true 2>/dev/null; then
        error "This script requires sudo privileges. Please run: sudo -v"
    fi
}

# Get user input
get_user_input() {
    if [ -z "$DOMAIN" ]; then
        read -p "Enter your domain name (e.g., example.com): " DOMAIN
        if [ -z "$DOMAIN" ]; then
            error "Domain name is required"
        fi
    fi
    
    if [ -z "$EMAIL" ]; then
        read -p "Enter your email for SSL certificate: " EMAIL
        if [ -z "$EMAIL" ]; then
            EMAIL="admin@$DOMAIN"
        fi
    fi
    
    echo
    info "Domain: $DOMAIN"
    info "Email: $EMAIL"
    echo
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
}

# Update system
update_system() {
    log "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
}

# Install dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    sudo apt install -y \
        python3 \
        python3-pip \
        python3-venv \
        python3-dev \
        nginx \
        mysql-server \
        redis-server \
        nodejs \
        npm \
        git \
        curl \
        wget \
        unzip \
        supervisor \
        certbot \
        python3-certbot-nginx \
        build-essential \
        libmysqlclient-dev \
        pkg-config
    
    log "Dependencies installed"
}

# Setup project directory
setup_project() {
    log "Setting up project directory..."
    
    # Create project directory
    sudo mkdir -p $PROJECT_DIR
    sudo chown -R $USER:$USER $PROJECT_DIR
    
    # Clone repository
    if [ ! -d "$PROJECT_DIR/.git" ]; then
        git clone $REPO_URL $PROJECT_DIR
    else
        cd $PROJECT_DIR
        git pull origin main
    fi
    
    cd $PROJECT_DIR
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Install Python dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    pip install gunicorn mysqlclient
    
    log "Project setup completed"
}

# Setup database
setup_database() {
    log "Setting up database..."
    
    # Generate random passwords
    DB_PASSWORD=$(openssl rand -base64 32)
    DB_ROOT_PASSWORD=$(openssl rand -base64 32)
    
    # Start MySQL
    sudo systemctl start mysql
    sudo systemctl enable mysql
    
    # Secure MySQL and create database
    sudo mysql <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DB_ROOT_PASSWORD';
CREATE DATABASE IF NOT EXISTS ecommerce_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'ecommerce_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON ecommerce_prod.* TO 'ecommerce_user'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    # Save credentials
    cat > $PROJECT_DIR/.env.production <<EOF
SECRET_KEY=$(openssl rand -base64 50)
DEBUG=False
DJANGO_SETTINGS_MODULE=backend.settings_production
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN

DB_NAME=ecommerce_prod
DB_USER=ecommerce_user
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=3306

REDIS_URL=redis://localhost:6379/0

# Add your Stripe keys here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EOF
    
    chmod 600 $PROJECT_DIR/.env.production
    
    log "Database setup completed"
    warning "Database credentials saved to .env.production"
}

# Run Django setup
setup_django() {
    log "Setting up Django..."
    
    cd $PROJECT_DIR
    source venv/bin/activate
    
    # Load environment
    source .env.production
    
    # Run migrations
    python manage.py makemigrations
    python manage.py migrate
    
    # Collect static files
    python manage.py collectstatic --noinput
    
    # Create superuser (interactive)
    echo "Creating Django superuser..."
    python manage.py createsuperuser
    
    log "Django setup completed"
}

# Build frontend
build_frontend() {
    log "Building frontend..."
    
    cd $PROJECT_DIR/frontend
    
    # Install dependencies
    npm install
    
    # Build for production
    npm run build
    
    log "Frontend build completed"
}

# Setup services
setup_services() {
    log "Setting up system services..."
    
    # Make scripts executable
    chmod +x $PROJECT_DIR/scripts/*.sh
    
    # Run service setup script
    sudo $PROJECT_DIR/scripts/setup_services.sh
    
    log "Services setup completed"
}

# Setup SSL
setup_ssl() {
    log "Setting up SSL certificate..."
    
    # Make SSL script executable and run it
    chmod +x $PROJECT_DIR/scripts/setup_ssl.sh
    sudo $PROJECT_DIR/scripts/setup_ssl.sh $DOMAIN $EMAIL
    
    log "SSL setup completed"
}

# Final checks
final_checks() {
    log "Performing final checks..."
    
    # Check if services are running
    local services=("mysql" "redis-server" "nginx" "ecommerce")
    for service in "${services[@]}"; do
        if sudo systemctl is-active --quiet $service; then
            info "✓ $service is running"
        else
            warning "✗ $service is not running"
        fi
    done
    
    # Test HTTPS connection
    sleep 10
    if curl -f -s https://$DOMAIN > /dev/null; then
        info "✓ HTTPS connection successful"
    else
        warning "✗ HTTPS connection failed"
    fi
    
    log "Final checks completed"
}

# Show completion message
show_completion() {
    echo
    echo -e "${GREEN}=================================================="
    echo "    DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "==================================================${NC}"
    echo
    info "Your e-commerce application is now live at:"
    info "  🌐 https://$DOMAIN"
    info "  🔐 https://$DOMAIN/admin"
    echo
    info "Important files:"
    info "  📄 Environment: $PROJECT_DIR/.env.production"
    info "  📋 Logs: /var/log/ecommerce/"
    info "  🔧 Config: /etc/nginx/sites-available/ecommerce-ssl"
    echo
    info "Useful commands:"
    info "  🔄 Restart app: sudo systemctl restart ecommerce"
    info "  📊 Check status: sudo systemctl status ecommerce"
    info "  📝 View logs: sudo journalctl -u ecommerce -f"
    info "  💾 Manual backup: $PROJECT_DIR/scripts/backup.sh"
    echo
    warning "Next steps:"
    warning "1. Update Stripe API keys in .env.production"
    warning "2. Configure email settings if needed"
    warning "3. Test all functionality"
    warning "4. Set up monitoring and alerts"
    echo
}

# Error handling
handle_error() {
    error "Deployment failed at line $1"
    warning "Check the logs above for details"
    warning "You can re-run this script to continue from where it left off"
}

trap 'handle_error $LINENO' ERR

# Main deployment function
main() {
    show_banner
    check_root
    get_user_input
    
    log "Starting deployment process..."
    
    update_system
    install_dependencies
    setup_project
    setup_database
    setup_django
    build_frontend
    setup_services
    setup_ssl
    final_checks
    show_completion
    
    log "Deployment completed successfully!"
}

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [domain] [email]"
    echo
    echo "Quick deployment script for e-commerce application"
    echo
    echo "Arguments:"
    echo "  domain    Your domain name (e.g., example.com)"
    echo "  email     Email for SSL certificate (optional)"
    echo
    echo "Example:"
    echo "  $0 mystore.com admin@mystore.com"
    echo
    echo "The script will:"
    echo "  1. Install all required dependencies"
    echo "  2. Setup database and Redis"
    echo "  3. Configure Django application"
    echo "  4. Build React frontend"
    echo "  5. Setup Nginx with SSL"
    echo "  6. Create systemd services"
    echo "  7. Configure automatic backups"
    echo
    exit 0
fi

# Run main function
main
