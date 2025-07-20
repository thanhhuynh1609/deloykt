#!/bin/bash

# Database Setup Script for E-commerce Application
# Supports both MySQL and PostgreSQL

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DB_TYPE=${1:-mysql}  # mysql or postgresql
DB_NAME=${2:-ecommerce_prod}
DB_USER=${3:-ecommerce_user}
DB_PASSWORD=${4:-$(openssl rand -base64 32)}
DB_ROOT_PASSWORD=${5:-$(openssl rand -base64 32)}

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

# MySQL Setup
setup_mysql() {
    log "Setting up MySQL database..."
    
    # Check if MySQL is installed
    if ! command -v mysql &> /dev/null; then
        log "Installing MySQL..."
        sudo apt update
        sudo apt install -y mysql-server mysql-client
    fi
    
    # Start MySQL service
    sudo systemctl start mysql
    sudo systemctl enable mysql
    
    # Secure MySQL installation
    log "Securing MySQL installation..."
    sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_ROOT_PASSWORD}';"
    
    # Create database and user
    log "Creating database and user..."
    mysql -u root -p${DB_ROOT_PASSWORD} <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    # Configure MySQL for production
    log "Configuring MySQL for production..."
    sudo tee /etc/mysql/mysql.conf.d/ecommerce.cnf > /dev/null <<EOF
[mysqld]
# Performance tuning
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connection settings
max_connections = 200
wait_timeout = 28800
interactive_timeout = 28800

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Binary logging
log-bin = mysql-bin
binlog_format = ROW
expire_logs_days = 7

# Slow query log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Error log
log-error = /var/log/mysql/error.log
EOF
    
    sudo systemctl restart mysql
    
    log "MySQL setup completed"
    info "Database: ${DB_NAME}"
    info "User: ${DB_USER}"
    info "Password: ${DB_PASSWORD}"
    info "Root Password: ${DB_ROOT_PASSWORD}"
}

# PostgreSQL Setup
setup_postgresql() {
    log "Setting up PostgreSQL database..."
    
    # Check if PostgreSQL is installed
    if ! command -v psql &> /dev/null; then
        log "Installing PostgreSQL..."
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib
    fi
    
    # Start PostgreSQL service
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Create database and user
    log "Creating database and user..."
    sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER USER ${DB_USER} CREATEDB;
EOF
    
    # Configure PostgreSQL for production
    log "Configuring PostgreSQL for production..."
    
    # Get PostgreSQL version and config path
    PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+\.\d+' | head -1)
    PG_CONFIG_DIR="/etc/postgresql/${PG_VERSION}/main"
    
    # Backup original configs
    sudo cp ${PG_CONFIG_DIR}/postgresql.conf ${PG_CONFIG_DIR}/postgresql.conf.backup
    sudo cp ${PG_CONFIG_DIR}/pg_hba.conf ${PG_CONFIG_DIR}/pg_hba.conf.backup
    
    # Configure postgresql.conf
    sudo tee -a ${PG_CONFIG_DIR}/postgresql.conf > /dev/null <<EOF

# E-commerce Production Settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
max_connections = 200
EOF
    
    # Configure pg_hba.conf for local connections
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" ${PG_CONFIG_DIR}/postgresql.conf
    
    sudo systemctl restart postgresql
    
    log "PostgreSQL setup completed"
    info "Database: ${DB_NAME}"
    info "User: ${DB_USER}"
    info "Password: ${DB_PASSWORD}"
}

# Create backup script
create_backup_script() {
    log "Creating backup script..."
    
    mkdir -p /var/backups/ecommerce
    
    if [ "$DB_TYPE" = "mysql" ]; then
        sudo tee /usr/local/bin/backup_ecommerce_db.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ecommerce"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"

# Create backup
mysqldump -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Compress backup
gzip \$BACKUP_DIR/db_backup_\$DATE.sql

# Remove backups older than 7 days
find \$BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Database backup completed: db_backup_\$DATE.sql.gz"
EOF
    else
        sudo tee /usr/local/bin/backup_ecommerce_db.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ecommerce"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"

# Create backup
PGPASSWORD="${DB_PASSWORD}" pg_dump -h localhost -U \$DB_USER \$DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Compress backup
gzip \$BACKUP_DIR/db_backup_\$DATE.sql

# Remove backups older than 7 days
find \$BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Database backup completed: db_backup_\$DATE.sql.gz"
EOF
    fi
    
    sudo chmod +x /usr/local/bin/backup_ecommerce_db.sh
    
    # Add to crontab for daily backups at 2 AM
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup_ecommerce_db.sh") | crontab -
    
    log "Backup script created and scheduled"
}

# Create restore script
create_restore_script() {
    log "Creating restore script..."
    
    if [ "$DB_TYPE" = "mysql" ]; then
        sudo tee /usr/local/bin/restore_ecommerce_db.sh > /dev/null <<EOF
#!/bin/bash
BACKUP_FILE=\$1
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"

if [ -z "\$BACKUP_FILE" ]; then
    echo "Usage: \$0 <backup_file.sql.gz>"
    exit 1
fi

if [ ! -f "\$BACKUP_FILE" ]; then
    echo "Backup file not found: \$BACKUP_FILE"
    exit 1
fi

echo "Restoring database from \$BACKUP_FILE..."

# Extract if compressed
if [[ \$BACKUP_FILE == *.gz ]]; then
    gunzip -c \$BACKUP_FILE | mysql -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME
else
    mysql -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME < \$BACKUP_FILE
fi

echo "Database restore completed"
EOF
    else
        sudo tee /usr/local/bin/restore_ecommerce_db.sh > /dev/null <<EOF
#!/bin/bash
BACKUP_FILE=\$1
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"

if [ -z "\$BACKUP_FILE" ]; then
    echo "Usage: \$0 <backup_file.sql.gz>"
    exit 1
fi

if [ ! -f "\$BACKUP_FILE" ]; then
    echo "Backup file not found: \$BACKUP_FILE"
    exit 1
fi

echo "Restoring database from \$BACKUP_FILE..."

# Extract if compressed
if [[ \$BACKUP_FILE == *.gz ]]; then
    gunzip -c \$BACKUP_FILE | PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U \$DB_USER \$DB_NAME
else
    PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U \$DB_USER \$DB_NAME < \$BACKUP_FILE
fi

echo "Database restore completed"
EOF
    fi
    
    sudo chmod +x /usr/local/bin/restore_ecommerce_db.sh
    
    log "Restore script created"
}

# Test database connection
test_connection() {
    log "Testing database connection..."
    
    if [ "$DB_TYPE" = "mysql" ]; then
        if mysql -u ${DB_USER} -p${DB_PASSWORD} -e "USE ${DB_NAME}; SELECT 1;" &> /dev/null; then
            log "MySQL connection test successful"
        else
            error "MySQL connection test failed"
        fi
    else
        if PGPASSWORD=${DB_PASSWORD} psql -h localhost -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1;" &> /dev/null; then
            log "PostgreSQL connection test successful"
        else
            error "PostgreSQL connection test failed"
        fi
    fi
}

# Save credentials
save_credentials() {
    log "Saving database credentials..."
    
    cat > /tmp/db_credentials.txt <<EOF
Database Type: ${DB_TYPE}
Database Name: ${DB_NAME}
Database User: ${DB_USER}
Database Password: ${DB_PASSWORD}
EOF
    
    if [ "$DB_TYPE" = "mysql" ]; then
        echo "Root Password: ${DB_ROOT_PASSWORD}" >> /tmp/db_credentials.txt
    fi
    
    chmod 600 /tmp/db_credentials.txt
    
    warning "Database credentials saved to /tmp/db_credentials.txt"
    warning "Please save these credentials securely and delete the file!"
}

# Main execution
main() {
    log "Starting database setup for ${DB_TYPE}..."
    
    case $DB_TYPE in
        "mysql")
            setup_mysql
            ;;
        "postgresql"|"postgres")
            setup_postgresql
            ;;
        *)
            error "Unsupported database type: ${DB_TYPE}. Use 'mysql' or 'postgresql'"
            ;;
    esac
    
    create_backup_script
    create_restore_script
    test_connection
    save_credentials
    
    log "Database setup completed successfully!"
    info "Next steps:"
    info "1. Update your .env.production file with the database credentials"
    info "2. Run Django migrations: python manage.py migrate"
    info "3. Create a superuser: python manage.py createsuperuser"
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <db_type> [db_name] [db_user] [db_password] [root_password]"
    echo "Example: $0 mysql ecommerce_prod ecommerce_user"
    echo "Example: $0 postgresql ecommerce_prod ecommerce_user"
    exit 1
fi

main
