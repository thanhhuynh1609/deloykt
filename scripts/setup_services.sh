#!/bin/bash

# System Services Setup Script
# Creates systemd services for Django, Redis, and other components

set -e

# Configuration
PROJECT_DIR="/var/www/ecommerce"
SERVICE_USER="www-data"
SERVICE_GROUP="www-data"

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

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Create log directories
create_log_dirs() {
    log "Creating log directories..."
    
    mkdir -p /var/log/gunicorn
    mkdir -p /var/log/ecommerce
    mkdir -p /var/run/gunicorn
    
    chown -R $SERVICE_USER:$SERVICE_GROUP /var/log/gunicorn
    chown -R $SERVICE_USER:$SERVICE_GROUP /var/log/ecommerce
    chown -R $SERVICE_USER:$SERVICE_GROUP /var/run/gunicorn
    
    log "Log directories created"
}

# Create Django systemd service
create_django_service() {
    log "Creating Django systemd service..."
    
    cat > /etc/systemd/system/ecommerce.service <<EOF
[Unit]
Description=E-commerce Django Application
After=network.target mysql.service redis.service
Wants=mysql.service redis.service

[Service]
Type=notify
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$PROJECT_DIR
Environment=DJANGO_SETTINGS_MODULE=backend.settings_production
Environment=PATH=$PROJECT_DIR/venv/bin
ExecStart=$PROJECT_DIR/venv/bin/gunicorn --config $PROJECT_DIR/gunicorn.conf.py backend.asgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PROJECT_DIR/media $PROJECT_DIR/logs /var/log/gunicorn /var/run/gunicorn
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

[Install]
WantedBy=multi-user.target
EOF
    
    log "Django service created"
}

# Create Redis service override (if needed)
create_redis_service() {
    log "Configuring Redis service..."
    
    # Create Redis configuration directory
    mkdir -p /etc/systemd/system/redis.service.d
    
    # Create override configuration
    cat > /etc/systemd/system/redis.service.d/override.conf <<EOF
[Service]
# Increase memory limit
LimitNOFILE=65535
# Custom configuration
ExecStart=
ExecStart=/usr/bin/redis-server /etc/redis/redis.conf --supervised systemd
EOF
    
    # Configure Redis for production
    if [ -f /etc/redis/redis.conf ]; then
        cp /etc/redis/redis.conf /etc/redis/redis.conf.backup
        
        # Update Redis configuration
        sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
        sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
        sed -i 's/^save 900 1/# save 900 1/' /etc/redis/redis.conf
        sed -i 's/^save 300 10/# save 300 10/' /etc/redis/redis.conf
        sed -i 's/^save 60 10000/save 60 1000/' /etc/redis/redis.conf
        
        log "Redis configured for production"
    fi
}

# Create Celery service (if using Celery for background tasks)
create_celery_service() {
    log "Creating Celery service..."
    
    cat > /etc/systemd/system/ecommerce-celery.service <<EOF
[Unit]
Description=E-commerce Celery Worker
After=network.target redis.service mysql.service
Wants=redis.service mysql.service

[Service]
Type=forking
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$PROJECT_DIR
Environment=DJANGO_SETTINGS_MODULE=backend.settings_production
Environment=PATH=$PROJECT_DIR/venv/bin
ExecStart=$PROJECT_DIR/venv/bin/celery -A backend worker --loglevel=info --pidfile=/var/run/celery/worker.pid
ExecStop=/bin/kill -s TERM \$MAINPID
ExecReload=/bin/kill -s HUP \$MAINPID
PIDFile=/var/run/celery/worker.pid
Restart=always
RestartSec=10

# Create PID directory
RuntimeDirectory=celery
RuntimeDirectoryMode=755

[Install]
WantedBy=multi-user.target
EOF
    
    # Create Celery Beat service for scheduled tasks
    cat > /etc/systemd/system/ecommerce-celerybeat.service <<EOF
[Unit]
Description=E-commerce Celery Beat Scheduler
After=network.target redis.service mysql.service
Wants=redis.service mysql.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$PROJECT_DIR
Environment=DJANGO_SETTINGS_MODULE=backend.settings_production
Environment=PATH=$PROJECT_DIR/venv/bin
ExecStart=$PROJECT_DIR/venv/bin/celery -A backend beat --loglevel=info --pidfile=/var/run/celery/beat.pid
Restart=always
RestartSec=10

# Create PID directory
RuntimeDirectory=celery
RuntimeDirectoryMode=755

[Install]
WantedBy=multi-user.target
EOF
    
    log "Celery services created"
}

# Create monitoring service
create_monitoring_service() {
    log "Creating monitoring service..."
    
    cat > /etc/systemd/system/ecommerce-monitor.service <<EOF
[Unit]
Description=E-commerce Application Monitor
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/local/bin/monitor_ecommerce.sh
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF
    
    # Create monitoring script
    cat > /usr/local/bin/monitor_ecommerce.sh <<'EOF'
#!/bin/bash

# Simple monitoring script
LOG_FILE="/var/log/ecommerce/monitor.log"
CHECK_INTERVAL=60

log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

check_service() {
    local service_name=$1
    if systemctl is-active --quiet $service_name; then
        return 0
    else
        log_message "WARNING: $service_name is not running"
        systemctl restart $service_name
        return 1
    fi
}

check_url() {
    local url=$1
    if curl -f -s $url > /dev/null; then
        return 0
    else
        log_message "WARNING: $url is not responding"
        return 1
    fi
}

while true; do
    # Check services
    check_service "ecommerce"
    check_service "redis"
    check_service "mysql"
    check_service "nginx"
    
    # Check application health
    check_url "http://localhost:8000/api/health/"
    
    # Check disk space
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        log_message "WARNING: Disk usage is ${DISK_USAGE}%"
    fi
    
    # Check memory usage
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEMORY_USAGE -gt 80 ]; then
        log_message "WARNING: Memory usage is ${MEMORY_USAGE}%"
    fi
    
    sleep $CHECK_INTERVAL
done
EOF
    
    chmod +x /usr/local/bin/monitor_ecommerce.sh
    
    log "Monitoring service created"
}

# Create backup service
create_backup_service() {
    log "Creating backup service..."
    
    cat > /etc/systemd/system/ecommerce-backup.service <<EOF
[Unit]
Description=E-commerce Backup Service
After=network.target mysql.service

[Service]
Type=oneshot
User=root
ExecStart=$PROJECT_DIR/scripts/backup.sh
EOF
    
    # Create backup timer
    cat > /etc/systemd/system/ecommerce-backup.timer <<EOF
[Unit]
Description=Run E-commerce backup daily
Requires=ecommerce-backup.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF
    
    log "Backup service and timer created"
}

# Create logrotate configuration
create_logrotate_config() {
    log "Creating logrotate configuration..."
    
    cat > /etc/logrotate.d/ecommerce <<EOF
/var/log/ecommerce/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_GROUP
    postrotate
        systemctl reload ecommerce
    endscript
}

/var/log/gunicorn/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_GROUP
    postrotate
        systemctl reload ecommerce
    endscript
}
EOF
    
    log "Logrotate configuration created"
}

# Enable and start services
enable_services() {
    log "Enabling and starting services..."
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable services
    systemctl enable ecommerce
    systemctl enable redis
    systemctl enable mysql
    systemctl enable nginx
    systemctl enable ecommerce-backup.timer
    
    # Start services
    systemctl start redis
    systemctl start mysql
    
    # Wait a moment for dependencies
    sleep 5
    
    systemctl start ecommerce
    systemctl start nginx
    systemctl start ecommerce-backup.timer
    
    log "Services enabled and started"
}

# Check service status
check_services() {
    log "Checking service status..."
    
    local services=("mysql" "redis" "ecommerce" "nginx")
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet $service; then
            info "✓ $service is running"
        else
            warning "✗ $service is not running"
            systemctl status $service --no-pager -l
        fi
    done
}

# Create health check endpoint
create_health_check() {
    log "Creating health check endpoint..."
    
    # Add health check view to Django
    cat >> $PROJECT_DIR/api/urls.py <<'EOF'

# Health check endpoint
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat()
    })

urlpatterns += [
    path('health/', health_check, name='health_check'),
]
EOF
    
    log "Health check endpoint created"
}

# Main function
main() {
    log "Setting up system services..."
    
    check_root
    create_log_dirs
    create_django_service
    create_redis_service
    create_celery_service
    create_monitoring_service
    create_backup_service
    create_logrotate_config
    enable_services
    check_services
    
    log "System services setup completed!"
    
    info "Services created:"
    info "  - ecommerce.service (Django application)"
    info "  - ecommerce-celery.service (Background tasks)"
    info "  - ecommerce-celerybeat.service (Scheduled tasks)"
    info "  - ecommerce-monitor.service (Application monitoring)"
    info "  - ecommerce-backup.timer (Daily backups)"
    
    info "Useful commands:"
    info "  - systemctl status ecommerce"
    info "  - systemctl restart ecommerce"
    info "  - journalctl -u ecommerce -f"
    info "  - systemctl list-timers"
}

# Run main function
main
