#!/bin/bash

# Comprehensive Backup Script for E-commerce Application
# Backs up database, media files, and configuration

set -e

# Configuration
BACKUP_BASE_DIR="/var/backups/ecommerce"
PROJECT_DIR="/var/www/ecommerce"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

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

# Load environment variables
load_env() {
    if [ -f "$PROJECT_DIR/.env.production" ]; then
        source "$PROJECT_DIR/.env.production"
        log "Environment variables loaded"
    else
        error "Environment file not found: $PROJECT_DIR/.env.production"
    fi
}

# Create backup directories
create_backup_dirs() {
    mkdir -p "$BACKUP_BASE_DIR/database"
    mkdir -p "$BACKUP_BASE_DIR/media"
    mkdir -p "$BACKUP_BASE_DIR/config"
    mkdir -p "$BACKUP_BASE_DIR/logs"
    log "Backup directories created"
}

# Backup database
backup_database() {
    log "Starting database backup..."
    
    local db_backup_file="$BACKUP_BASE_DIR/database/db_backup_$DATE.sql"
    
    if [ -n "$DB_NAME" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ]; then
        # Detect database type
        if command -v mysql &> /dev/null && mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null; then
            log "Backing up MySQL database..."
            mysqldump -u "$DB_USER" -p"$DB_PASSWORD" \
                --single-transaction \
                --routines \
                --triggers \
                --events \
                --hex-blob \
                "$DB_NAME" > "$db_backup_file"
        elif command -v pg_dump &> /dev/null; then
            log "Backing up PostgreSQL database..."
            PGPASSWORD="$DB_PASSWORD" pg_dump -h "${DB_HOST:-localhost}" -U "$DB_USER" "$DB_NAME" > "$db_backup_file"
        else
            error "No supported database found or connection failed"
        fi
        
        # Compress the backup
        gzip "$db_backup_file"
        log "Database backup completed: $(basename $db_backup_file.gz)"
    else
        warning "Database credentials not found, skipping database backup"
    fi
}

# Backup media files
backup_media() {
    log "Starting media files backup..."
    
    local media_backup_file="$BACKUP_BASE_DIR/media/media_backup_$DATE.tar.gz"
    
    if [ -d "$PROJECT_DIR/media" ]; then
        tar -czf "$media_backup_file" -C "$PROJECT_DIR" media/
        log "Media backup completed: $(basename $media_backup_file)"
    else
        warning "Media directory not found, skipping media backup"
    fi
}

# Backup static files (if needed)
backup_static() {
    log "Starting static files backup..."
    
    local static_backup_file="$BACKUP_BASE_DIR/media/static_backup_$DATE.tar.gz"
    
    if [ -d "$PROJECT_DIR/staticfiles" ]; then
        tar -czf "$static_backup_file" -C "$PROJECT_DIR" staticfiles/
        log "Static files backup completed: $(basename $static_backup_file)"
    else
        warning "Static files directory not found, skipping static backup"
    fi
}

# Backup configuration files
backup_config() {
    log "Starting configuration backup..."
    
    local config_backup_file="$BACKUP_BASE_DIR/config/config_backup_$DATE.tar.gz"
    
    # Create temporary directory for config files
    local temp_config_dir="/tmp/ecommerce_config_$DATE"
    mkdir -p "$temp_config_dir"
    
    # Copy important configuration files
    if [ -f "$PROJECT_DIR/.env.production" ]; then
        cp "$PROJECT_DIR/.env.production" "$temp_config_dir/"
    fi
    
    if [ -f "$PROJECT_DIR/gunicorn.conf.py" ]; then
        cp "$PROJECT_DIR/gunicorn.conf.py" "$temp_config_dir/"
    fi
    
    if [ -f "$PROJECT_DIR/nginx.conf" ]; then
        cp "$PROJECT_DIR/nginx.conf" "$temp_config_dir/"
    fi
    
    # Copy systemd service files
    if [ -f "/etc/systemd/system/ecommerce.service" ]; then
        sudo cp "/etc/systemd/system/ecommerce.service" "$temp_config_dir/"
    fi
    
    # Copy nginx site configuration
    if [ -f "/etc/nginx/sites-available/ecommerce" ]; then
        sudo cp "/etc/nginx/sites-available/ecommerce" "$temp_config_dir/"
    fi
    
    # Create archive
    tar -czf "$config_backup_file" -C "/tmp" "ecommerce_config_$DATE"
    
    # Cleanup
    rm -rf "$temp_config_dir"
    
    log "Configuration backup completed: $(basename $config_backup_file)"
}

# Backup application logs
backup_logs() {
    log "Starting logs backup..."
    
    local logs_backup_file="$BACKUP_BASE_DIR/logs/logs_backup_$DATE.tar.gz"
    
    # Create temporary directory for logs
    local temp_logs_dir="/tmp/ecommerce_logs_$DATE"
    mkdir -p "$temp_logs_dir"
    
    # Copy Django logs
    if [ -d "$PROJECT_DIR/logs" ]; then
        cp -r "$PROJECT_DIR/logs" "$temp_logs_dir/django_logs"
    fi
    
    # Copy system logs
    if [ -f "/var/log/gunicorn/access.log" ]; then
        sudo cp "/var/log/gunicorn/access.log" "$temp_logs_dir/"
    fi
    
    if [ -f "/var/log/gunicorn/error.log" ]; then
        sudo cp "/var/log/gunicorn/error.log" "$temp_logs_dir/"
    fi
    
    if [ -f "/var/log/nginx/access.log" ]; then
        sudo cp "/var/log/nginx/access.log" "$temp_logs_dir/"
    fi
    
    if [ -f "/var/log/nginx/error.log" ]; then
        sudo cp "/var/log/nginx/error.log" "$temp_logs_dir/"
    fi
    
    # Create archive
    tar -czf "$logs_backup_file" -C "/tmp" "ecommerce_logs_$DATE"
    
    # Cleanup
    rm -rf "$temp_logs_dir"
    
    log "Logs backup completed: $(basename $logs_backup_file)"
}

# Create backup manifest
create_manifest() {
    log "Creating backup manifest..."
    
    local manifest_file="$BACKUP_BASE_DIR/backup_manifest_$DATE.txt"
    
    cat > "$manifest_file" <<EOF
E-commerce Application Backup Manifest
======================================
Backup Date: $(date)
Backup ID: $DATE

Files included in this backup:
EOF
    
    # List all backup files
    find "$BACKUP_BASE_DIR" -name "*$DATE*" -type f >> "$manifest_file"
    
    # Add system information
    cat >> "$manifest_file" <<EOF

System Information:
==================
Hostname: $(hostname)
OS: $(lsb_release -d | cut -f2)
Kernel: $(uname -r)
Python Version: $(python3 --version)
Django Version: $(cd $PROJECT_DIR && source venv/bin/activate && python -c "import django; print(django.get_version())" 2>/dev/null || echo "Unknown")

Database Information:
====================
Database Name: ${DB_NAME:-Unknown}
Database User: ${DB_USER:-Unknown}
Database Host: ${DB_HOST:-localhost}

Backup Statistics:
==================
EOF
    
    # Add file sizes
    find "$BACKUP_BASE_DIR" -name "*$DATE*" -type f -exec ls -lh {} \; | awk '{print $5 " " $9}' >> "$manifest_file"
    
    log "Backup manifest created: $(basename $manifest_file)"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    # Remove old database backups
    find "$BACKUP_BASE_DIR/database" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Remove old media backups
    find "$BACKUP_BASE_DIR/media" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    # Remove old config backups
    find "$BACKUP_BASE_DIR/config" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    # Remove old log backups
    find "$BACKUP_BASE_DIR/logs" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    # Remove old manifests
    find "$BACKUP_BASE_DIR" -name "backup_manifest_*.txt" -mtime +$RETENTION_DAYS -delete
    
    log "Old backups cleaned up"
}

# Send notification (optional)
send_notification() {
    local status=$1
    local message=$2
    
    # Email notification (if configured)
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "E-commerce Backup $status" "$NOTIFICATION_EMAIL"
    fi
    
    # Slack notification (if webhook configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"E-commerce Backup $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
}

# Main backup function
main() {
    local start_time=$(date +%s)
    
    log "Starting comprehensive backup..."
    
    load_env
    create_backup_dirs
    
    # Perform backups
    backup_database
    backup_media
    backup_static
    backup_config
    backup_logs
    create_manifest
    cleanup_old_backups
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "Backup completed successfully in ${duration} seconds"
    
    # Calculate total backup size
    local total_size=$(du -sh "$BACKUP_BASE_DIR" | cut -f1)
    info "Total backup size: $total_size"
    
    # Send success notification
    send_notification "SUCCESS" "Backup completed successfully. Total size: $total_size, Duration: ${duration}s"
}

# Error handling
trap 'error "Backup failed at line $LINENO"' ERR

# Run main function
main "$@"
