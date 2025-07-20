#!/bin/bash

# Make all deployment scripts executable
# Run this script to set proper permissions for all deployment scripts

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "Making deployment scripts executable..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# List of scripts to make executable
SCRIPTS=(
    "backup.sh"
    "build_frontend.sh"
    "deploy.sh"
    "health_check.py"
    "make_executable.sh"
    "quick_deploy.sh"
    "setup_database.sh"
    "setup_monitoring.sh"
    "setup_services.sh"
    "setup_ssl.sh"
    "test_deployment.sh"
)

# Make scripts executable
for script in "${SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        chmod +x "$SCRIPT_DIR/$script"
        info "Made $script executable"
    else
        echo "Warning: $script not found"
    fi
done

# Make Python health check executable
if [ -f "$SCRIPT_DIR/health_check.py" ]; then
    chmod +x "$SCRIPT_DIR/health_check.py"
    info "Made health_check.py executable"
fi

log "All deployment scripts are now executable!"

info "Available scripts:"
info "  ./scripts/quick_deploy.sh domain.com email@domain.com  # One-command deploy"
info "  ./scripts/setup_database.sh mysql                      # Setup database"
info "  ./scripts/build_frontend.sh                            # Build React app"
info "  ./scripts/setup_services.sh                            # Setup systemd services"
info "  ./scripts/setup_ssl.sh domain.com email@domain.com     # Setup SSL certificate"
info "  ./scripts/setup_monitoring.sh                          # Setup monitoring"
info "  ./scripts/test_deployment.sh domain.com                # Test deployment"
info "  ./scripts/deploy.sh production                         # Deploy updates"
info "  ./scripts/backup.sh                                    # Create backup"
info "  ./scripts/health_check.py                              # Health check"
