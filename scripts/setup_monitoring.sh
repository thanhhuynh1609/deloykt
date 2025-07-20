#!/bin/bash

# Monitoring and Logging Setup Script
# Sets up comprehensive monitoring, logging, and alerting

set -e

# Configuration
PROJECT_DIR="/var/www/ecommerce"
LOG_DIR="/var/log/ecommerce"
MONITORING_DIR="/opt/monitoring"

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

# Create monitoring directories
create_directories() {
    log "Creating monitoring directories..."
    
    mkdir -p $LOG_DIR
    mkdir -p $MONITORING_DIR
    mkdir -p /var/log/monitoring
    mkdir -p /etc/logrotate.d
    
    chown -R www-data:www-data $LOG_DIR
    
    log "Directories created"
}

# Setup advanced logging
setup_logging() {
    log "Setting up advanced logging..."
    
    # Create rsyslog configuration for application
    cat > /etc/rsyslog.d/50-ecommerce.conf <<EOF
# E-commerce application logging
\$template EcommerceFormat,"%timegenerated% %HOSTNAME% %syslogtag% %msg%\n"

# Application logs
local0.*    $LOG_DIR/application.log;EcommerceFormat
local1.*    $LOG_DIR/security.log;EcommerceFormat
local2.*    $LOG_DIR/performance.log;EcommerceFormat
local3.*    $LOG_DIR/error.log;EcommerceFormat

# Stop processing after writing to files
local0.*    stop
local1.*    stop
local2.*    stop
local3.*    stop
EOF
    
    # Restart rsyslog
    systemctl restart rsyslog
    
    # Create logrotate configuration
    cat > /etc/logrotate.d/ecommerce <<EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload rsyslog
        systemctl reload ecommerce
    endscript
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}

/var/log/mysql/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 mysql mysql
    postrotate
        systemctl reload mysql
    endscript
}
EOF
    
    log "Advanced logging configured"
}

# Install monitoring tools
install_monitoring_tools() {
    log "Installing monitoring tools..."
    
    # Update package list
    apt update
    
    # Install basic monitoring tools
    apt install -y \
        htop \
        iotop \
        nethogs \
        nload \
        ncdu \
        tree \
        jq \
        curl \
        wget \
        fail2ban \
        logwatch \
        sysstat \
        prometheus-node-exporter
    
    # Enable and start node exporter
    systemctl enable prometheus-node-exporter
    systemctl start prometheus-node-exporter
    
    log "Monitoring tools installed"
}

# Setup Fail2Ban for security
setup_fail2ban() {
    log "Setting up Fail2Ban..."
    
    # Create custom jail for Django
    cat > /etc/fail2ban/jail.d/ecommerce.conf <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[django-auth]
enabled = true
port = http,https
logpath = $LOG_DIR/security.log
maxretry = 5
findtime = 300
bantime = 1800
filter = django-auth

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF
    
    # Create Django auth filter
    cat > /etc/fail2ban/filter.d/django-auth.conf <<EOF
[Definition]
failregex = ^.* SECURITY WARNING: Authentication failed for user .* from <HOST>
            ^.* SECURITY WARNING: Multiple failed login attempts from <HOST>
            ^.* SECURITY WARNING: Suspicious activity from <HOST>

ignoreregex =
EOF
    
    # Restart fail2ban
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    log "Fail2Ban configured"
}

# Create monitoring scripts
create_monitoring_scripts() {
    log "Creating monitoring scripts..."
    
    # System monitor script
    cat > $MONITORING_DIR/system_monitor.sh <<'EOF'
#!/bin/bash

LOG_FILE="/var/log/monitoring/system.log"
ALERT_EMAIL="admin@example.com"  # Update this

log_alert() {
    echo "[$(date)] ALERT: $1" >> $LOG_FILE
    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "$1" | mail -s "System Alert - $(hostname)" $ALERT_EMAIL
    fi
}

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    log_alert "High disk usage: ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 85 ]; then
    log_alert "High memory usage: ${MEMORY_USAGE}%"
fi

# Check load average
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
if (( $(echo "$LOAD_AVG > 2.0" | bc -l) )); then
    log_alert "High load average: $LOAD_AVG"
fi

# Check service status
SERVICES=("ecommerce" "nginx" "mysql" "redis-server")
for service in "${SERVICES[@]}"; do
    if ! systemctl is-active --quiet $service; then
        log_alert "Service $service is not running"
        systemctl restart $service
    fi
done

# Check application health
if ! curl -f -s http://localhost:8000/api/health/ > /dev/null; then
    log_alert "Application health check failed"
fi
EOF
    
    chmod +x $MONITORING_DIR/system_monitor.sh
    
    # Performance monitor script
    cat > $MONITORING_DIR/performance_monitor.sh <<'EOF'
#!/bin/bash

LOG_FILE="/var/log/monitoring/performance.log"

# Log system metrics
echo "[$(date)] CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')" >> $LOG_FILE
echo "[$(date)] Memory: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')" >> $LOG_FILE
echo "[$(date)] Disk: $(df -h / | awk 'NR==2{print $5}')" >> $LOG_FILE
echo "[$(date)] Load: $(uptime | awk -F'load average:' '{print $2}')" >> $LOG_FILE

# Log database connections
if command -v mysql &> /dev/null; then
    DB_CONNECTIONS=$(mysql -u root -e "SHOW STATUS LIKE 'Threads_connected';" 2>/dev/null | awk 'NR==2{print $2}')
    echo "[$(date)] DB Connections: $DB_CONNECTIONS" >> $LOG_FILE
fi

# Log nginx connections
if command -v nginx &> /dev/null; then
    NGINX_CONNECTIONS=$(ss -tuln | grep :80 | wc -l)
    echo "[$(date)] Nginx Connections: $NGINX_CONNECTIONS" >> $LOG_FILE
fi
EOF
    
    chmod +x $MONITORING_DIR/performance_monitor.sh
    
    # Security monitor script
    cat > $MONITORING_DIR/security_monitor.sh <<'EOF'
#!/bin/bash

LOG_FILE="/var/log/monitoring/security.log"
ALERT_EMAIL="admin@example.com"  # Update this

log_security_alert() {
    echo "[$(date)] SECURITY ALERT: $1" >> $LOG_FILE
    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "$1" | mail -s "Security Alert - $(hostname)" $ALERT_EMAIL
    fi
}

# Check for failed login attempts
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | grep "$(date '+%b %d')" | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
    log_security_alert "High number of failed login attempts: $FAILED_LOGINS"
fi

# Check for suspicious network connections
SUSPICIOUS_CONNECTIONS=$(ss -tuln | grep -E ':(22|80|443|3306|6379)' | wc -l)
if [ $SUSPICIOUS_CONNECTIONS -gt 100 ]; then
    log_security_alert "High number of network connections: $SUSPICIOUS_CONNECTIONS"
fi

# Check for file system changes in critical directories
if command -v find &> /dev/null; then
    RECENT_CHANGES=$(find /etc /var/www/ecommerce -type f -mtime -1 | wc -l)
    if [ $RECENT_CHANGES -gt 50 ]; then
        log_security_alert "Many recent file changes detected: $RECENT_CHANGES"
    fi
fi
EOF
    
    chmod +x $MONITORING_DIR/security_monitor.sh
    
    log "Monitoring scripts created"
}

# Setup cron jobs for monitoring
setup_cron_jobs() {
    log "Setting up monitoring cron jobs..."
    
    # Create cron jobs
    cat > /etc/cron.d/ecommerce-monitoring <<EOF
# E-commerce monitoring cron jobs

# System monitoring every 5 minutes
*/5 * * * * root $MONITORING_DIR/system_monitor.sh

# Performance monitoring every minute
* * * * * root $MONITORING_DIR/performance_monitor.sh

# Security monitoring every 10 minutes
*/10 * * * * root $MONITORING_DIR/security_monitor.sh

# Health check every minute
* * * * * root python3 $PROJECT_DIR/scripts/health_check.py > /dev/null 2>&1

# Daily log analysis
0 6 * * * root logwatch --output mail --mailto admin@example.com --detail high
EOF
    
    log "Cron jobs configured"
}

# Setup log analysis
setup_log_analysis() {
    log "Setting up log analysis..."
    
    # Create log analysis script
    cat > $MONITORING_DIR/analyze_logs.sh <<'EOF'
#!/bin/bash

LOG_DIR="/var/log/ecommerce"
REPORT_FILE="/var/log/monitoring/daily_report_$(date +%Y%m%d).txt"

echo "Daily Log Analysis Report - $(date)" > $REPORT_FILE
echo "=================================" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Analyze application logs
if [ -f "$LOG_DIR/application.log" ]; then
    echo "Application Log Summary:" >> $REPORT_FILE
    echo "- Total entries: $(wc -l < $LOG_DIR/application.log)" >> $REPORT_FILE
    echo "- Error entries: $(grep -i error $LOG_DIR/application.log | wc -l)" >> $REPORT_FILE
    echo "- Warning entries: $(grep -i warning $LOG_DIR/application.log | wc -l)" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
fi

# Analyze nginx logs
if [ -f "/var/log/nginx/access.log" ]; then
    echo "Nginx Access Log Summary:" >> $REPORT_FILE
    echo "- Total requests: $(wc -l < /var/log/nginx/access.log)" >> $REPORT_FILE
    echo "- 404 errors: $(grep ' 404 ' /var/log/nginx/access.log | wc -l)" >> $REPORT_FILE
    echo "- 500 errors: $(grep ' 500 ' /var/log/nginx/access.log | wc -l)" >> $REPORT_FILE
    echo "- Top IPs:" >> $REPORT_FILE
    awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10 >> $REPORT_FILE
    echo "" >> $REPORT_FILE
fi

# Analyze security logs
if [ -f "$LOG_DIR/security.log" ]; then
    echo "Security Log Summary:" >> $REPORT_FILE
    echo "- Security events: $(wc -l < $LOG_DIR/security.log)" >> $REPORT_FILE
    echo "- Failed logins: $(grep -i 'failed' $LOG_DIR/security.log | wc -l)" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
fi

echo "Report generated: $REPORT_FILE"
EOF
    
    chmod +x $MONITORING_DIR/analyze_logs.sh
    
    log "Log analysis configured"
}

# Create dashboard script
create_dashboard() {
    log "Creating monitoring dashboard..."
    
    cat > $MONITORING_DIR/dashboard.sh <<'EOF'
#!/bin/bash

# Simple monitoring dashboard
clear
echo "==============================================="
echo "    E-COMMERCE MONITORING DASHBOARD"
echo "==============================================="
echo "Last updated: $(date)"
echo ""

# System status
echo "SYSTEM STATUS:"
echo "- Uptime: $(uptime -p)"
echo "- Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "- Memory: $(free -h | awk 'NR==2{printf "Used: %s/%s (%.1f%%)", $3,$2,$3*100/$2}')"
echo "- Disk: $(df -h / | awk 'NR==2{printf "Used: %s/%s (%s)", $3,$2,$5}')"
echo ""

# Service status
echo "SERVICE STATUS:"
services=("ecommerce" "nginx" "mysql" "redis-server")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo "- $service: ✅ Running"
    else
        echo "- $service: ❌ Stopped"
    fi
done
echo ""

# Application health
echo "APPLICATION HEALTH:"
if curl -f -s http://localhost:8000/api/health/ > /dev/null; then
    echo "- Web Application: ✅ Healthy"
else
    echo "- Web Application: ❌ Unhealthy"
fi

# Database connection
if mysql -u root -e "SELECT 1;" &> /dev/null; then
    echo "- Database: ✅ Connected"
else
    echo "- Database: ❌ Connection Failed"
fi

# Redis connection
if redis-cli ping &> /dev/null; then
    echo "- Redis: ✅ Connected"
else
    echo "- Redis: ❌ Connection Failed"
fi

echo ""
echo "Recent alerts:"
if [ -f "/var/log/monitoring/system.log" ]; then
    tail -5 /var/log/monitoring/system.log | grep ALERT || echo "No recent alerts"
fi

echo ""
echo "==============================================="
EOF
    
    chmod +x $MONITORING_DIR/dashboard.sh
    
    # Create alias for easy access
    echo "alias monitor='$MONITORING_DIR/dashboard.sh'" >> /root/.bashrc
    
    log "Dashboard created (use 'monitor' command)"
}

# Setup email notifications
setup_email_notifications() {
    log "Setting up email notifications..."
    
    # Install mail utilities
    apt install -y mailutils postfix
    
    # Configure postfix for local delivery
    debconf-set-selections <<< "postfix postfix/mailname string $(hostname -f)"
    debconf-set-selections <<< "postfix postfix/main_mailer_type string 'Internet Site'"
    
    # Create notification script
    cat > $MONITORING_DIR/send_notification.sh <<'EOF'
#!/bin/bash

RECIPIENT="admin@example.com"  # Update this
SUBJECT="$1"
MESSAGE="$2"

if [ -z "$SUBJECT" ] || [ -z "$MESSAGE" ]; then
    echo "Usage: $0 <subject> <message>"
    exit 1
fi

# Send email
echo "$MESSAGE" | mail -s "$SUBJECT" "$RECIPIENT"

# Log notification
echo "[$(date)] Notification sent: $SUBJECT" >> /var/log/monitoring/notifications.log
EOF
    
    chmod +x $MONITORING_DIR/send_notification.sh
    
    log "Email notifications configured"
}

# Main function
main() {
    log "Setting up monitoring and logging..."
    
    check_root
    create_directories
    setup_logging
    install_monitoring_tools
    setup_fail2ban
    create_monitoring_scripts
    setup_cron_jobs
    setup_log_analysis
    create_dashboard
    setup_email_notifications
    
    log "Monitoring and logging setup completed!"
    
    info "Monitoring features installed:"
    info "  - System resource monitoring"
    info "  - Service health checks"
    info "  - Security monitoring with Fail2Ban"
    info "  - Log rotation and analysis"
    info "  - Email notifications"
    info "  - Performance metrics collection"
    info "  - Daily reports"
    
    info "Useful commands:"
    info "  - monitor                    # Show dashboard"
    info "  - systemctl status fail2ban  # Check security status"
    info "  - tail -f $LOG_DIR/application.log  # View app logs"
    info "  - $MONITORING_DIR/analyze_logs.sh    # Generate log report"
    
    warning "Don't forget to:"
    warning "1. Update email addresses in monitoring scripts"
    warning "2. Configure SMTP settings if needed"
    warning "3. Test alert notifications"
    warning "4. Review and adjust monitoring thresholds"
}

# Run main function
main
