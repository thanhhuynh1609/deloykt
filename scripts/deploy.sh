#!/bin/bash

# E-commerce Deployment Script
# Usage: ./scripts/deploy.sh [production|staging]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_DIR="/var/www/ecommerce"
BACKUP_DIR="/var/backups/ecommerce"
LOG_FILE="/var/log/deploy.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a $LOG_FILE
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required commands exist
    local commands=("git" "python3" "npm" "mysql" "redis-cli" "nginx")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            error "$cmd is not installed"
        fi
    done
    
    # Check if services are running
    if ! systemctl is-active --quiet mysql; then
        error "MySQL service is not running"
    fi
    
    if ! systemctl is-active --quiet redis-server; then
        error "Redis service is not running"
    fi
    
    log "Prerequisites check passed"
}

# Backup database
backup_database() {
    log "Creating database backup..."
    
    mkdir -p $BACKUP_DIR
    local backup_file="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $backup_file
    
    if [ $? -eq 0 ]; then
        log "Database backup created: $backup_file"
    else
        error "Database backup failed"
    fi
}

# Backup media files
backup_media() {
    log "Creating media files backup..."
    
    local media_backup="$BACKUP_DIR/media_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf $media_backup -C $PROJECT_DIR media/
    
    if [ $? -eq 0 ]; then
        log "Media backup created: $media_backup"
    else
        warning "Media backup failed"
    fi
}

# Pull latest code
update_code() {
    log "Updating code from repository..."
    
    cd $PROJECT_DIR
    
    # Stash any local changes
    git stash
    
    # Pull latest changes
    git pull origin main
    
    if [ $? -eq 0 ]; then
        log "Code updated successfully"
    else
        error "Failed to update code"
    fi
}

# Update Python dependencies
update_backend_deps() {
    log "Updating backend dependencies..."
    
    cd $PROJECT_DIR
    source venv/bin/activate
    
    pip install -r requirements.txt --upgrade
    
    if [ $? -eq 0 ]; then
        log "Backend dependencies updated"
    else
        error "Failed to update backend dependencies"
    fi
}

# Update frontend dependencies and build
update_frontend() {
    log "Building frontend..."
    
    cd $PROJECT_DIR/frontend
    
    # Install dependencies
    npm ci --only=production
    
    # Build for production
    npm run build
    
    if [ $? -eq 0 ]; then
        log "Frontend built successfully"
    else
        error "Frontend build failed"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd $PROJECT_DIR
    source venv/bin/activate
    
    export DJANGO_SETTINGS_MODULE=backend.settings_production
    
    python manage.py makemigrations
    python manage.py migrate
    
    if [ $? -eq 0 ]; then
        log "Migrations completed successfully"
    else
        error "Migrations failed"
    fi
}

# Collect static files
collect_static() {
    log "Collecting static files..."
    
    cd $PROJECT_DIR
    source venv/bin/activate
    
    export DJANGO_SETTINGS_MODULE=backend.settings_production
    
    python manage.py collectstatic --noinput
    
    if [ $? -eq 0 ]; then
        log "Static files collected"
    else
        error "Failed to collect static files"
    fi
}

# Restart services
restart_services() {
    log "Restarting services..."
    
    # Restart application
    sudo systemctl restart ecommerce
    
    # Restart nginx
    sudo systemctl reload nginx
    
    # Check if services are running
    sleep 5
    
    if systemctl is-active --quiet ecommerce; then
        log "Application service restarted successfully"
    else
        error "Application service failed to start"
    fi
    
    if systemctl is-active --quiet nginx; then
        log "Nginx restarted successfully"
    else
        error "Nginx failed to start"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:8000/api/health/ > /dev/null; then
            log "Health check passed"
            return 0
        fi
        
        info "Health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Cleanup old backups (keep last 7 days)
cleanup_backups() {
    log "Cleaning up old backups..."
    
    find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
    find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
    
    log "Old backups cleaned up"
}

# Main deployment function
deploy() {
    log "Starting deployment for $ENVIRONMENT environment..."
    
    # Load environment variables
    if [ -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]; then
        source "$PROJECT_DIR/.env.$ENVIRONMENT"
    else
        error "Environment file .env.$ENVIRONMENT not found"
    fi
    
    check_root
    check_prerequisites
    backup_database
    backup_media
    update_code
    update_backend_deps
    update_frontend
    run_migrations
    collect_static
    restart_services
    health_check
    cleanup_backups
    
    log "Deployment completed successfully!"
    info "Application is running at: https://$(hostname -f)"
}

# Rollback function
rollback() {
    log "Starting rollback..."
    
    # This is a simplified rollback - in production you might want more sophisticated rollback
    cd $PROJECT_DIR
    git reset --hard HEAD~1
    
    restart_services
    health_check
    
    log "Rollback completed"
}

# Main script logic
case "${2:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    *)
        echo "Usage: $0 [production|staging] [deploy|rollback]"
        exit 1
        ;;
esac
