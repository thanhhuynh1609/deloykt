#!/bin/bash

# Comprehensive Deployment Testing Script
# Tests all components before going live

set -e

# Configuration
PROJECT_DIR="/var/www/ecommerce"
DOMAIN=${1:-"localhost"}
TEST_RESULTS_DIR="/tmp/deployment_tests"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNINGS=0

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    ((TESTS_FAILED++))
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
    ((TESTS_PASSED++))
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
    ((TESTS_WARNINGS++))
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Create test results directory
mkdir -p $TEST_RESULTS_DIR

# Show test banner
show_banner() {
    echo -e "${BLUE}${BOLD}"
    echo "=================================================="
    echo "    DEPLOYMENT TESTING SUITE"
    echo "=================================================="
    echo -e "${NC}"
    echo "Testing domain: $DOMAIN"
    echo "Test results: $TEST_RESULTS_DIR"
    echo ""
}

# Test 1: System Services
test_system_services() {
    log "Testing system services..."
    
    local services=("mysql" "redis-server" "nginx" "ecommerce")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet $service; then
            success "$service service is running"
        else
            error "$service service is not running"
            failed_services+=($service)
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        echo "✅ All system services are running" >> $TEST_RESULTS_DIR/services.txt
    else
        echo "❌ Failed services: ${failed_services[*]}" >> $TEST_RESULTS_DIR/services.txt
    fi
}

# Test 2: Database Connectivity
test_database() {
    log "Testing database connectivity..."
    
    # Load environment
    if [ -f "$PROJECT_DIR/.env.production" ]; then
        source "$PROJECT_DIR/.env.production"
    fi
    
    # Test MySQL connection
    if mysql -u "${DB_USER:-ecommerce_user}" -p"${DB_PASSWORD}" -e "USE ${DB_NAME:-ecommerce_prod}; SELECT 1;" &> /dev/null; then
        success "Database connection successful"
        
        # Test basic queries
        local table_count=$(mysql -u "${DB_USER:-ecommerce_user}" -p"${DB_PASSWORD}" -e "USE ${DB_NAME:-ecommerce_prod}; SHOW TABLES;" | wc -l)
        if [ $table_count -gt 1 ]; then
            success "Database has $((table_count-1)) tables"
        else
            warning "Database appears to be empty"
        fi
        
        echo "✅ Database connectivity: OK" >> $TEST_RESULTS_DIR/database.txt
    else
        error "Database connection failed"
        echo "❌ Database connectivity: FAILED" >> $TEST_RESULTS_DIR/database.txt
    fi
}

# Test 3: Redis Connectivity
test_redis() {
    log "Testing Redis connectivity..."
    
    if redis-cli ping &> /dev/null; then
        success "Redis connection successful"
        
        # Test basic operations
        redis-cli set test_key "test_value" ex 60 &> /dev/null
        local test_value=$(redis-cli get test_key 2>/dev/null)
        
        if [ "$test_value" = "test_value" ]; then
            success "Redis read/write operations working"
            redis-cli del test_key &> /dev/null
        else
            warning "Redis read/write operations may have issues"
        fi
        
        echo "✅ Redis connectivity: OK" >> $TEST_RESULTS_DIR/redis.txt
    else
        error "Redis connection failed"
        echo "❌ Redis connectivity: FAILED" >> $TEST_RESULTS_DIR/redis.txt
    fi
}

# Test 4: Web Application
test_web_application() {
    log "Testing web application..."
    
    local base_url="http://localhost:8000"
    if [ "$DOMAIN" != "localhost" ]; then
        base_url="https://$DOMAIN"
    fi
    
    # Test health endpoint
    if curl -f -s "$base_url/api/health/" > /dev/null; then
        success "Health endpoint responding"
    else
        error "Health endpoint not responding"
    fi
    
    # Test main page
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/")
    if [ "$status_code" = "200" ]; then
        success "Main page loading (status: $status_code)"
    else
        error "Main page not loading (status: $status_code)"
    fi
    
    # Test API endpoints
    local api_endpoints=("/api/products/" "/api/auth/users/me/" "/api/orders/")
    for endpoint in "${api_endpoints[@]}"; do
        local api_status=$(curl -s -o /dev/null -w "%{http_code}" "$base_url$endpoint")
        if [ "$api_status" = "200" ] || [ "$api_status" = "401" ]; then
            success "API endpoint $endpoint responding (status: $api_status)"
        else
            warning "API endpoint $endpoint may have issues (status: $api_status)"
        fi
    done
    
    echo "Web application test completed" >> $TEST_RESULTS_DIR/webapp.txt
}

# Test 5: Static Files
test_static_files() {
    log "Testing static files..."
    
    local static_dir="$PROJECT_DIR/staticfiles"
    
    if [ -d "$static_dir" ]; then
        local file_count=$(find "$static_dir" -type f | wc -l)
        if [ $file_count -gt 0 ]; then
            success "Static files directory contains $file_count files"
        else
            warning "Static files directory is empty"
        fi
        
        # Test if static files are accessible via web
        local base_url="http://localhost:8000"
        if [ "$DOMAIN" != "localhost" ]; then
            base_url="https://$DOMAIN"
        fi
        
        local static_status=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/static/admin/css/base.css")
        if [ "$static_status" = "200" ]; then
            success "Static files accessible via web"
        else
            warning "Static files may not be accessible via web (status: $static_status)"
        fi
    else
        error "Static files directory not found"
    fi
    
    echo "Static files test completed" >> $TEST_RESULTS_DIR/static.txt
}

# Test 6: SSL Certificate (if applicable)
test_ssl_certificate() {
    if [ "$DOMAIN" = "localhost" ]; then
        info "Skipping SSL test for localhost"
        return
    fi
    
    log "Testing SSL certificate..."
    
    # Test SSL connection
    if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" -verify_return_error < /dev/null &> /dev/null; then
        success "SSL certificate is valid"
        
        # Get certificate expiry
        local expiry_date=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
        info "Certificate expires: $expiry_date"
        
        echo "✅ SSL certificate: Valid" >> $TEST_RESULTS_DIR/ssl.txt
    else
        error "SSL certificate validation failed"
        echo "❌ SSL certificate: Invalid" >> $TEST_RESULTS_DIR/ssl.txt
    fi
}

# Test 7: WebSocket Connection
test_websocket() {
    log "Testing WebSocket connection..."
    
    # Create a simple WebSocket test
    cat > $TEST_RESULTS_DIR/websocket_test.js <<'EOF'
const WebSocket = require('ws');

const wsUrl = process.argv[2] || 'ws://localhost:8000/ws/chat/test/';
const ws = new WebSocket(wsUrl);

let testPassed = false;

ws.on('open', function open() {
    console.log('WebSocket connection opened');
    ws.send(JSON.stringify({message: 'test'}));
    
    setTimeout(() => {
        if (!testPassed) {
            console.log('WebSocket test timeout');
            process.exit(1);
        }
    }, 5000);
});

ws.on('message', function message(data) {
    console.log('WebSocket message received:', data.toString());
    testPassed = true;
    ws.close();
    process.exit(0);
});

ws.on('error', function error(err) {
    console.log('WebSocket error:', err.message);
    process.exit(1);
});

ws.on('close', function close() {
    console.log('WebSocket connection closed');
    if (testPassed) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});
EOF
    
    # Run WebSocket test if Node.js is available
    if command -v node &> /dev/null; then
        cd $TEST_RESULTS_DIR
        npm init -y &> /dev/null
        npm install ws &> /dev/null
        
        local ws_url="ws://localhost:8000/ws/chat/test/"
        if [ "$DOMAIN" != "localhost" ]; then
            ws_url="wss://$DOMAIN/ws/chat/test/"
        fi
        
        if timeout 10 node websocket_test.js "$ws_url" &> websocket_output.txt; then
            success "WebSocket connection test passed"
        else
            warning "WebSocket connection test failed or timed out"
        fi
    else
        warning "Node.js not available, skipping WebSocket test"
    fi
}

# Test 8: Performance Test
test_performance() {
    log "Running basic performance tests..."
    
    local base_url="http://localhost:8000"
    if [ "$DOMAIN" != "localhost" ]; then
        base_url="https://$DOMAIN"
    fi
    
    # Test response times
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$base_url/")
    local response_time_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        success "Main page response time: ${response_time_ms}ms (Good)"
    elif (( $(echo "$response_time < 5.0" | bc -l) )); then
        warning "Main page response time: ${response_time_ms}ms (Acceptable)"
    else
        error "Main page response time: ${response_time_ms}ms (Too slow)"
    fi
    
    # Test concurrent requests (if ab is available)
    if command -v ab &> /dev/null; then
        info "Running Apache Bench test (10 concurrent requests)..."
        ab -n 10 -c 2 "$base_url/" > $TEST_RESULTS_DIR/performance.txt 2>&1
        
        local requests_per_second=$(grep "Requests per second" $TEST_RESULTS_DIR/performance.txt | awk '{print $4}')
        if [ -n "$requests_per_second" ]; then
            info "Requests per second: $requests_per_second"
        fi
    else
        info "Apache Bench not available, skipping concurrent request test"
    fi
}

# Test 9: Security Headers
test_security_headers() {
    log "Testing security headers..."
    
    local base_url="http://localhost:8000"
    if [ "$DOMAIN" != "localhost" ]; then
        base_url="https://$DOMAIN"
    fi
    
    # Check security headers
    local headers=$(curl -I -s "$base_url/")
    
    local security_headers=("X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection")
    local missing_headers=()
    
    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -i "$header" > /dev/null; then
            success "Security header $header present"
        else
            warning "Security header $header missing"
            missing_headers+=($header)
        fi
    done
    
    if [ ${#missing_headers[@]} -eq 0 ]; then
        echo "✅ All security headers present" >> $TEST_RESULTS_DIR/security.txt
    else
        echo "⚠️ Missing headers: ${missing_headers[*]}" >> $TEST_RESULTS_DIR/security.txt
    fi
}

# Test 10: File Permissions
test_file_permissions() {
    log "Testing file permissions..."
    
    local critical_files=(
        "$PROJECT_DIR/.env.production:600"
        "$PROJECT_DIR/media:755"
        "$PROJECT_DIR/staticfiles:755"
        "$PROJECT_DIR/logs:755"
    )
    
    local permission_issues=()
    
    for file_perm in "${critical_files[@]}"; do
        local file_path="${file_perm%:*}"
        local expected_perm="${file_perm#*:}"
        
        if [ -e "$file_path" ]; then
            local actual_perm=$(stat -c "%a" "$file_path")
            if [ "$actual_perm" = "$expected_perm" ]; then
                success "File permissions correct for $file_path ($actual_perm)"
            else
                warning "File permissions incorrect for $file_path (expected: $expected_perm, actual: $actual_perm)"
                permission_issues+=("$file_path")
            fi
        else
            warning "File/directory not found: $file_path"
            permission_issues+=("$file_path")
        fi
    done
    
    echo "File permissions test completed" >> $TEST_RESULTS_DIR/permissions.txt
}

# Generate test report
generate_report() {
    log "Generating test report..."
    
    local report_file="$TEST_RESULTS_DIR/deployment_test_report.txt"
    
    cat > "$report_file" <<EOF
DEPLOYMENT TEST REPORT
=====================
Date: $(date)
Domain: $DOMAIN
Test Results Directory: $TEST_RESULTS_DIR

SUMMARY:
- Tests Passed: $TESTS_PASSED
- Tests Failed: $TESTS_FAILED  
- Warnings: $TESTS_WARNINGS

DETAILED RESULTS:
EOF
    
    # Append individual test results
    for result_file in $TEST_RESULTS_DIR/*.txt; do
        if [ -f "$result_file" ] && [ "$(basename "$result_file")" != "deployment_test_report.txt" ]; then
            echo "" >> "$report_file"
            echo "$(basename "$result_file" .txt | tr '[:lower:]' '[:upper:]'):" >> "$report_file"
            cat "$result_file" >> "$report_file"
        fi
    done
    
    info "Test report generated: $report_file"
}

# Show final results
show_results() {
    echo ""
    echo -e "${BOLD}=================================================="
    echo "    DEPLOYMENT TEST RESULTS"
    echo -e "==================================================${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ DEPLOYMENT READY FOR PRODUCTION${NC}"
        echo -e "${GREEN}All critical tests passed successfully${NC}"
    else
        echo -e "${RED}❌ DEPLOYMENT NOT READY${NC}"
        echo -e "${RED}$TESTS_FAILED critical tests failed${NC}"
    fi
    
    echo ""
    echo "Test Summary:"
    echo "- ✅ Passed: $TESTS_PASSED"
    echo "- ❌ Failed: $TESTS_FAILED"
    echo "- ⚠️  Warnings: $TESTS_WARNINGS"
    echo ""
    
    if [ $TESTS_WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Please review warnings before going live${NC}"
    fi
    
    echo "Detailed results: $TEST_RESULTS_DIR/deployment_test_report.txt"
    echo "=================================================="
}

# Main testing function
main() {
    show_banner
    
    # Run all tests
    test_system_services
    test_database
    test_redis
    test_web_application
    test_static_files
    test_ssl_certificate
    test_websocket
    test_performance
    test_security_headers
    test_file_permissions
    
    # Generate report and show results
    generate_report
    show_results
    
    # Exit with appropriate code
    if [ $TESTS_FAILED -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Show usage
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [domain]"
    echo ""
    echo "Comprehensive deployment testing script"
    echo ""
    echo "Arguments:"
    echo "  domain    Domain to test (default: localhost)"
    echo ""
    echo "Example:"
    echo "  $0 mystore.com"
    echo ""
    exit 0
fi

# Run main function
main
