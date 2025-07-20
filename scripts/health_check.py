#!/usr/bin/env python3
"""
Comprehensive Health Check Script for E-commerce Application
Checks all critical components and services
"""

import os
import sys
import json
import time
import requests
import subprocess
import mysql.connector
import redis
from datetime import datetime
from pathlib import Path

# Configuration
PROJECT_DIR = "/var/www/ecommerce"
HEALTH_CHECK_URL = "http://localhost:8000/api/health/"
REDIS_URL = "redis://localhost:6379/0"

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.GREEN):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"{color}[{timestamp}] {message}{Colors.ENDC}")

def error(message):
    log(f"❌ {message}", Colors.RED)

def success(message):
    log(f"✅ {message}", Colors.GREEN)

def warning(message):
    log(f"⚠️  {message}", Colors.YELLOW)

def info(message):
    log(f"ℹ️  {message}", Colors.BLUE)

class HealthChecker:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'healthy',
            'checks': {}
        }
        self.load_environment()
    
    def load_environment(self):
        """Load environment variables from .env.production"""
        env_file = Path(PROJECT_DIR) / '.env.production'
        if env_file.exists():
            with open(env_file) as f:
                for line in f:
                    if '=' in line and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
    
    def check_system_resources(self):
        """Check system resources (CPU, Memory, Disk)"""
        info("Checking system resources...")
        
        try:
            # Check disk space
            result = subprocess.run(['df', '-h', '/'], capture_output=True, text=True)
            disk_usage = result.stdout.split('\n')[1].split()[4].replace('%', '')
            
            # Check memory usage
            result = subprocess.run(['free'], capture_output=True, text=True)
            memory_lines = result.stdout.split('\n')[1].split()
            memory_usage = int((int(memory_lines[2]) / int(memory_lines[1])) * 100)
            
            # Check load average
            with open('/proc/loadavg') as f:
                load_avg = float(f.read().split()[0])
            
            status = 'healthy'
            issues = []
            
            if int(disk_usage) > 80:
                issues.append(f"High disk usage: {disk_usage}%")
                status = 'warning'
            
            if memory_usage > 80:
                issues.append(f"High memory usage: {memory_usage}%")
                status = 'warning'
            
            if load_avg > 2.0:
                issues.append(f"High load average: {load_avg}")
                status = 'warning'
            
            self.results['checks']['system_resources'] = {
                'status': status,
                'disk_usage': f"{disk_usage}%",
                'memory_usage': f"{memory_usage}%",
                'load_average': load_avg,
                'issues': issues
            }
            
            if status == 'healthy':
                success("System resources OK")
            else:
                warning(f"System resources issues: {', '.join(issues)}")
                
        except Exception as e:
            error(f"Failed to check system resources: {e}")
            self.results['checks']['system_resources'] = {
                'status': 'error',
                'error': str(e)
            }
    
    def check_services(self):
        """Check systemd services"""
        info("Checking systemd services...")
        
        services = ['ecommerce', 'nginx', 'mysql', 'redis-server']
        service_status = {}
        
        for service in services:
            try:
                result = subprocess.run(
                    ['systemctl', 'is-active', service],
                    capture_output=True,
                    text=True
                )
                
                is_active = result.stdout.strip() == 'active'
                service_status[service] = {
                    'status': 'healthy' if is_active else 'error',
                    'active': is_active
                }
                
                if is_active:
                    success(f"{service} service is running")
                else:
                    error(f"{service} service is not running")
                    
            except Exception as e:
                error(f"Failed to check {service} service: {e}")
                service_status[service] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        self.results['checks']['services'] = service_status
    
    def check_database(self):
        """Check database connectivity and basic queries"""
        info("Checking database connection...")
        
        try:
            db_config = {
                'host': os.getenv('DB_HOST', 'localhost'),
                'user': os.getenv('DB_USER', 'ecommerce_user'),
                'password': os.getenv('DB_PASSWORD'),
                'database': os.getenv('DB_NAME', 'ecommerce_prod'),
                'port': int(os.getenv('DB_PORT', '3306'))
            }
            
            conn = mysql.connector.connect(**db_config)
            cursor = conn.cursor()
            
            # Test basic query
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            
            # Check table count
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            table_count = len(tables)
            
            # Check recent activity (if applicable)
            try:
                cursor.execute("SELECT COUNT(*) FROM auth_user")
                user_count = cursor.fetchone()[0]
            except:
                user_count = 0
            
            cursor.close()
            conn.close()
            
            self.results['checks']['database'] = {
                'status': 'healthy',
                'connected': True,
                'table_count': table_count,
                'user_count': user_count
            }
            
            success(f"Database connection OK ({table_count} tables, {user_count} users)")
            
        except Exception as e:
            error(f"Database connection failed: {e}")
            self.results['checks']['database'] = {
                'status': 'error',
                'connected': False,
                'error': str(e)
            }
    
    def check_redis(self):
        """Check Redis connectivity"""
        info("Checking Redis connection...")
        
        try:
            r = redis.from_url(REDIS_URL)
            
            # Test basic operations
            r.ping()
            r.set('health_check', 'test', ex=60)
            value = r.get('health_check')
            r.delete('health_check')
            
            # Get Redis info
            redis_info = r.info()
            
            self.results['checks']['redis'] = {
                'status': 'healthy',
                'connected': True,
                'version': redis_info.get('redis_version'),
                'memory_usage': redis_info.get('used_memory_human'),
                'connected_clients': redis_info.get('connected_clients')
            }
            
            success("Redis connection OK")
            
        except Exception as e:
            error(f"Redis connection failed: {e}")
            self.results['checks']['redis'] = {
                'status': 'error',
                'connected': False,
                'error': str(e)
            }
    
    def check_web_application(self):
        """Check web application health endpoint"""
        info("Checking web application...")
        
        try:
            response = requests.get(HEALTH_CHECK_URL, timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.results['checks']['web_application'] = {
                        'status': 'healthy',
                        'response_time': response.elapsed.total_seconds(),
                        'status_code': response.status_code,
                        'response_data': data
                    }
                    success(f"Web application OK (response time: {response.elapsed.total_seconds():.2f}s)")
                except:
                    self.results['checks']['web_application'] = {
                        'status': 'warning',
                        'response_time': response.elapsed.total_seconds(),
                        'status_code': response.status_code,
                        'note': 'Non-JSON response'
                    }
                    warning("Web application responding but not returning JSON")
            else:
                error(f"Web application returned status {response.status_code}")
                self.results['checks']['web_application'] = {
                    'status': 'error',
                    'status_code': response.status_code,
                    'response_time': response.elapsed.total_seconds()
                }
                
        except requests.exceptions.RequestException as e:
            error(f"Web application check failed: {e}")
            self.results['checks']['web_application'] = {
                'status': 'error',
                'error': str(e)
            }
    
    def check_ssl_certificate(self):
        """Check SSL certificate validity"""
        info("Checking SSL certificate...")
        
        domain = os.getenv('ALLOWED_HOSTS', '').split(',')[0]
        if not domain:
            warning("No domain configured, skipping SSL check")
            return
        
        try:
            result = subprocess.run([
                'openssl', 's_client', '-connect', f'{domain}:443',
                '-servername', domain, '-verify_return_error'
            ], input='', capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                # Extract certificate expiry
                cert_result = subprocess.run([
                    'openssl', 's_client', '-connect', f'{domain}:443',
                    '-servername', domain
                ], input='', capture_output=True, text=True, timeout=10)
                
                # Parse certificate info (simplified)
                self.results['checks']['ssl_certificate'] = {
                    'status': 'healthy',
                    'domain': domain,
                    'valid': True
                }
                success(f"SSL certificate valid for {domain}")
            else:
                error(f"SSL certificate invalid for {domain}")
                self.results['checks']['ssl_certificate'] = {
                    'status': 'error',
                    'domain': domain,
                    'valid': False,
                    'error': result.stderr
                }
                
        except Exception as e:
            warning(f"SSL certificate check failed: {e}")
            self.results['checks']['ssl_certificate'] = {
                'status': 'warning',
                'error': str(e)
            }
    
    def check_file_permissions(self):
        """Check critical file permissions"""
        info("Checking file permissions...")
        
        critical_paths = [
            (f"{PROJECT_DIR}/media", "755"),
            (f"{PROJECT_DIR}/staticfiles", "755"),
            (f"{PROJECT_DIR}/logs", "755"),
            (f"{PROJECT_DIR}/.env.production", "600")
        ]
        
        issues = []
        
        for path, expected_perm in critical_paths:
            if os.path.exists(path):
                stat_info = os.stat(path)
                actual_perm = oct(stat_info.st_mode)[-3:]
                
                if actual_perm != expected_perm:
                    issues.append(f"{path}: {actual_perm} (expected {expected_perm})")
            else:
                issues.append(f"{path}: does not exist")
        
        self.results['checks']['file_permissions'] = {
            'status': 'healthy' if not issues else 'warning',
            'issues': issues
        }
        
        if not issues:
            success("File permissions OK")
        else:
            warning(f"File permission issues: {', '.join(issues)}")
    
    def run_all_checks(self):
        """Run all health checks"""
        log("Starting comprehensive health check...", Colors.BOLD)
        
        self.check_system_resources()
        self.check_services()
        self.check_database()
        self.check_redis()
        self.check_web_application()
        self.check_ssl_certificate()
        self.check_file_permissions()
        
        # Determine overall status
        error_count = sum(1 for check in self.results['checks'].values() 
                         if check.get('status') == 'error')
        warning_count = sum(1 for check in self.results['checks'].values() 
                           if check.get('status') == 'warning')
        
        if error_count > 0:
            self.results['overall_status'] = 'error'
        elif warning_count > 0:
            self.results['overall_status'] = 'warning'
        else:
            self.results['overall_status'] = 'healthy'
        
        return self.results
    
    def print_summary(self):
        """Print health check summary"""
        print("\n" + "="*50)
        print("HEALTH CHECK SUMMARY")
        print("="*50)
        
        status_color = Colors.GREEN
        if self.results['overall_status'] == 'warning':
            status_color = Colors.YELLOW
        elif self.results['overall_status'] == 'error':
            status_color = Colors.RED
        
        print(f"Overall Status: {status_color}{self.results['overall_status'].upper()}{Colors.ENDC}")
        print(f"Timestamp: {self.results['timestamp']}")
        print()
        
        for check_name, check_result in self.results['checks'].items():
            status = check_result.get('status', 'unknown')
            status_icon = "✅" if status == 'healthy' else "⚠️" if status == 'warning' else "❌"
            print(f"{status_icon} {check_name.replace('_', ' ').title()}: {status}")
        
        print("="*50)

def main():
    """Main function"""
    checker = HealthChecker()
    results = checker.run_all_checks()
    checker.print_summary()
    
    # Save results to file
    results_file = f"{PROJECT_DIR}/logs/health_check_{int(time.time())}.json"
    os.makedirs(os.path.dirname(results_file), exist_ok=True)
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    info(f"Results saved to: {results_file}")
    
    # Exit with appropriate code
    if results['overall_status'] == 'error':
        sys.exit(1)
    elif results['overall_status'] == 'warning':
        sys.exit(2)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
