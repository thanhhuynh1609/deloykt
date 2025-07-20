#!/bin/bash

# Frontend Build and Optimization Script
# Builds React app for production with optimizations

set -e

# Configuration
PROJECT_DIR="/var/www/ecommerce"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BUILD_DIR="$FRONTEND_DIR/build"
STATIC_DIR="$PROJECT_DIR/staticfiles"

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
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check if frontend directory exists
    if [ ! -d "$FRONTEND_DIR" ]; then
        error "Frontend directory not found: $FRONTEND_DIR"
    fi
    
    # Check if package.json exists
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        error "package.json not found in frontend directory"
    fi
    
    log "Prerequisites check passed"
    info "Node.js version: $(node --version)"
    info "npm version: $(npm --version)"
}

# Clean previous builds
clean_build() {
    log "Cleaning previous builds..."
    
    # Remove build directory
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        log "Removed previous build directory"
    fi
    
    # Remove node_modules if requested
    if [ "$1" = "--clean-deps" ]; then
        if [ -d "$FRONTEND_DIR/node_modules" ]; then
            rm -rf "$FRONTEND_DIR/node_modules"
            log "Removed node_modules directory"
        fi
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing frontend dependencies..."
    
    cd "$FRONTEND_DIR"
    
    # Use npm ci for production builds (faster and more reliable)
    if [ -f "package-lock.json" ]; then
        npm ci --only=production
    else
        npm install --only=production
    fi
    
    log "Dependencies installed successfully"
}

# Optimize package.json for production
optimize_package_json() {
    log "Optimizing package.json for production..."
    
    cd "$FRONTEND_DIR"
    
    # Create backup
    cp package.json package.json.backup
    
    # Update build script with optimizations
    npm pkg set scripts.build="react-scripts build && npm run optimize"
    npm pkg set scripts.optimize="npm run compress && npm run analyze"
    npm pkg set scripts.compress="gzip -k build/static/js/*.js && gzip -k build/static/css/*.css"
    npm pkg set scripts.analyze="npx webpack-bundle-analyzer build/static/js/*.js --mode server --port 8888"
    
    log "Package.json optimized"
}

# Set environment variables for production build
set_build_env() {
    log "Setting build environment variables..."
    
    export NODE_ENV=production
    export GENERATE_SOURCEMAP=false
    export INLINE_RUNTIME_CHUNK=false
    export IMAGE_INLINE_SIZE_LIMIT=0
    
    # React optimizations
    export REACT_APP_NODE_ENV=production
    
    log "Build environment configured"
}

# Build React application
build_react_app() {
    log "Building React application..."
    
    cd "$FRONTEND_DIR"
    
    # Run build
    npm run build
    
    if [ $? -eq 0 ]; then
        log "React build completed successfully"
    else
        error "React build failed"
    fi
}

# Optimize built assets
optimize_assets() {
    log "Optimizing built assets..."
    
    cd "$BUILD_DIR"
    
    # Compress JavaScript files
    if command -v gzip &> /dev/null; then
        find static/js -name "*.js" -exec gzip -k {} \;
        log "JavaScript files compressed"
    fi
    
    # Compress CSS files
    if command -v gzip &> /dev/null; then
        find static/css -name "*.css" -exec gzip -k {} \;
        log "CSS files compressed"
    fi
    
    # Optimize images (if imagemin is available)
    if command -v imagemin &> /dev/null; then
        find static/media -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs imagemin --out-dir=static/media/
        log "Images optimized"
    fi
}

# Create service worker for caching
create_service_worker() {
    log "Creating service worker..."
    
    cat > "$BUILD_DIR/sw.js" <<'EOF'
const CACHE_NAME = 'ecommerce-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
EOF
    
    log "Service worker created"
}

# Update manifest.json for PWA
update_manifest() {
    log "Updating manifest.json..."
    
    if [ -f "$BUILD_DIR/manifest.json" ]; then
        # Update manifest with production settings
        cat > "$BUILD_DIR/manifest.json" <<EOF
{
  "short_name": "E-commerce",
  "name": "E-commerce Application",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
EOF
        log "Manifest.json updated"
    fi
}

# Copy build to static directory
copy_to_static() {
    log "Copying build files to static directory..."
    
    # Create static directory if it doesn't exist
    mkdir -p "$STATIC_DIR"
    
    # Copy build files
    cp -r "$BUILD_DIR"/* "$STATIC_DIR/"
    
    # Set proper permissions
    chmod -R 755 "$STATIC_DIR"
    
    log "Build files copied to static directory"
}

# Generate build report
generate_build_report() {
    log "Generating build report..."
    
    local report_file="$PROJECT_DIR/build_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" <<EOF
Frontend Build Report
====================
Build Date: $(date)
Node.js Version: $(node --version)
npm Version: $(npm --version)

Build Statistics:
================
EOF
    
    # Add file sizes
    if [ -d "$BUILD_DIR" ]; then
        echo "Build Directory Size:" >> "$report_file"
        du -sh "$BUILD_DIR" >> "$report_file"
        echo "" >> "$report_file"
        
        echo "JavaScript Files:" >> "$report_file"
        find "$BUILD_DIR/static/js" -name "*.js" -exec ls -lh {} \; | awk '{print $5 " " $9}' >> "$report_file"
        echo "" >> "$report_file"
        
        echo "CSS Files:" >> "$report_file"
        find "$BUILD_DIR/static/css" -name "*.css" -exec ls -lh {} \; | awk '{print $5 " " $9}' >> "$report_file"
        echo "" >> "$report_file"
        
        echo "Asset Files:" >> "$report_file"
        find "$BUILD_DIR/static/media" -type f -exec ls -lh {} \; | awk '{print $5 " " $9}' >> "$report_file"
    fi
    
    log "Build report generated: $(basename $report_file)"
}

# Validate build
validate_build() {
    log "Validating build..."
    
    # Check if index.html exists
    if [ ! -f "$BUILD_DIR/index.html" ]; then
        error "index.html not found in build directory"
    fi
    
    # Check if static assets exist
    if [ ! -d "$BUILD_DIR/static" ]; then
        error "Static assets directory not found"
    fi
    
    # Check if JavaScript bundle exists
    if ! find "$BUILD_DIR/static/js" -name "*.js" | grep -q .; then
        error "No JavaScript files found in build"
    fi
    
    # Check if CSS files exist
    if ! find "$BUILD_DIR/static/css" -name "*.css" | grep -q .; then
        warning "No CSS files found in build"
    fi
    
    log "Build validation passed"
}

# Main build function
main() {
    local start_time=$(date +%s)
    
    log "Starting frontend build process..."
    
    # Parse command line arguments
    local clean_deps=false
    for arg in "$@"; do
        case $arg in
            --clean-deps)
                clean_deps=true
                ;;
            --help)
                echo "Usage: $0 [--clean-deps] [--help]"
                echo "  --clean-deps  Remove node_modules before build"
                echo "  --help        Show this help message"
                exit 0
                ;;
        esac
    done
    
    check_prerequisites
    
    if [ "$clean_deps" = true ]; then
        clean_build --clean-deps
    else
        clean_build
    fi
    
    install_dependencies
    set_build_env
    build_react_app
    optimize_assets
    create_service_worker
    update_manifest
    validate_build
    copy_to_static
    generate_build_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "Frontend build completed successfully in ${duration} seconds"
    
    # Show build statistics
    if [ -d "$BUILD_DIR" ]; then
        local build_size=$(du -sh "$BUILD_DIR" | cut -f1)
        info "Build size: $build_size"
    fi
    
    info "Build files are ready in: $BUILD_DIR"
    info "Static files copied to: $STATIC_DIR"
}

# Error handling
trap 'error "Frontend build failed at line $LINENO"' ERR

# Run main function
main "$@"
