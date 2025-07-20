# E-commerce Application với AI Chatbot

Ứng dụng e-commerce đầy đủ tính năng với Django backend, React frontend, AI chatbot, và WebSocket real-time chat.

## 🚀 Tính năng chính

- ✅ **E-commerce hoàn chỉnh**: Sản phẩm với variants (màu sắc, kích thước), giỏ hàng, đặt hàng
- ✅ **Admin Dashboard**: Quản lý sản phẩm, đơn hàng, người dùng với giao diện tùy chỉnh
- ✅ **Payment Integration**: Tích hợp Stripe và E-wallet (Paybox)
- ✅ **AI Chatbot**: Tìm kiếm sản phẩm thông minh, gợi ý kích thước
- ✅ **Real-time Chat**: WebSocket chat với Redis
- ✅ **User Authentication**: Đăng ký, đăng nhập, quản lý profile
- ✅ **Inventory Management**: Theo dõi tồn kho theo từng variant
- ✅ **Responsive Design**: Tối ưu cho mobile và desktop

## 📋 Yêu cầu hệ thống

### Development
- Python 3.8+
- Node.js 16+
- MySQL 8.0+ hoặc PostgreSQL 13+
- Redis 6+

### Production
- Ubuntu 20.04+ / Debian 11+
- 2GB+ RAM (khuyến nghị 4GB+)
- 20GB+ SSD storage
- Domain name với SSL certificate

## 🏃‍♂️ Quick Start

### Development Setup
```bash
# 1. Clone repository
git clone <your-repo-url>
cd <project-directory>

# 2. Backend setup
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Database setup (MySQL)
mysql -u root -p
CREATE DATABASE ecommerce_db;
CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'ecommerce_user'@'localhost';

# 4. Environment variables
cp .env.production.example .env
# Chỉnh sửa .env với thông tin database và Stripe keys

# 5. Django setup
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic

# 6. Frontend setup
cd frontend
npm install
npm start

# 7. Start Redis server
redis-server

# 8. Start Django with ASGI (for WebSocket)
cd ..
uvicorn backend.asgi:application --host 0.0.0.0 --port 8000
```

### Production Deployment

#### 🚀 One-Command Deploy (Khuyến nghị)
```bash
# Make scripts executable
chmod +x scripts/make_executable.sh
./scripts/make_executable.sh

# Deploy everything automatically
./scripts/quick_deploy.sh your-domain.com admin@your-domain.com
```

#### 📖 Manual Deploy
Xem hướng dẫn chi tiết trong [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)

## 🔧 Cấu hình

### Environment Variables (.env)
```env
SECRET_KEY=your_secret_key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database
DB_NAME=ecommerce_prod
DB_USER=ecommerce_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

# Redis
REDIS_URL=redis://localhost:6379/0

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Database Configuration
Ứng dụng hỗ trợ cả MySQL và PostgreSQL:

**MySQL (Khuyến nghị cho production):**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'ecommerce_prod',
        'USER': 'ecommerce_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

**PostgreSQL:**
```python
DATABASES = {
    'default': dj_database_url.config(
        default='postgresql://user:password@localhost:5432/ecommerce'
    )
}
```

## 🛠️ Development

### Chạy ở chế độ development
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Django backend
source venv/bin/activate
uvicorn backend.asgi:application --reload

# Terminal 3: React frontend
cd frontend
npm start
```

### Chạy tests
```bash
# Django tests
python manage.py test

# Frontend tests
cd frontend
npm test

# Deployment tests
./scripts/test_deployment.sh localhost
```

## 📁 Cấu trúc dự án

```
├── backend/                 # Django settings
├── api/                     # Django REST API
├── user/                    # User management
├── chat/                    # WebSocket chat
├── ai_chat/                 # AI chatbot logic
├── frontend/                # React application
├── scripts/                 # Deployment scripts
├── static/                  # Static files
├── media/                   # User uploads
├── requirements.txt         # Python dependencies
├── .env.production.example  # Environment template
├── DEPLOYMENT_GUIDE.md      # Deployment guide
└── PRODUCTION_DEPLOYMENT.md # Production guide
```

## 🤖 AI Chatbot

AI Chatbot hỗ trợ:
- Tìm kiếm sản phẩm bằng ngôn ngữ tự nhiên
- Gợi ý kích thước dựa trên mô tả
- Trả lời câu hỏi về sản phẩm
- Hỗ trợ đặt hàng

### Cấu hình AI
```python
# settings.py
AI_CACHE_DIR = os.path.join(BASE_DIR, 'ai_cache')
```

## 💳 Payment Integration

### Stripe Setup
1. Tạo tài khoản Stripe
2. Lấy API keys từ dashboard
3. Cập nhật environment variables
4. Test với Stripe test cards

### E-wallet (Paybox)
- Nạp tiền qua Stripe
- Thanh toán bằng số dư ví
- Lịch sử giao dịch

## 🔒 Security Features

- CSRF protection
- SQL injection prevention
- XSS protection
- Rate limiting
- Fail2Ban integration
- SSL/TLS encryption
- Secure headers

## 📊 Monitoring

### Health Checks
```bash
# Manual health check
./scripts/health_check.py

# Monitoring dashboard
monitor  # (after running setup_monitoring.sh)
```

### Logs
- Application logs: `/var/log/ecommerce/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`

## 🔄 Backup & Recovery

### Automatic Backups
```bash
# Setup automatic backups
./scripts/setup_monitoring.sh

# Manual backup
./scripts/backup.sh

# Restore from backup
sudo /usr/local/bin/restore_ecommerce_db.sh backup_file.sql.gz
```

## 🚀 Deployment Options

1. **VPS/Dedicated Server** (Khuyến nghị)
   - Full control
   - Best performance
   - Custom configuration

2. **Docker Deployment**
   - Easy scaling
   - Consistent environment
   - Container orchestration

3. **Cloud Platforms**
   - Railway
   - Heroku
   - DigitalOcean App Platform

## 📞 Support & Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Check MySQL service
sudo systemctl status mysql
sudo systemctl restart mysql
```

**Static Files Not Loading:**
```bash
# Collect static files
python manage.py collectstatic --noinput
sudo chown -R www-data:www-data /var/www/ecommerce/staticfiles
```

**WebSocket Connection Failed:**
```bash
# Check Redis
redis-cli ping
sudo systemctl restart ecommerce
```

### Performance Optimization

**Database:**
- Enable query caching
- Optimize indexes
- Regular maintenance

**Frontend:**
- Enable gzip compression
- Optimize images
- Use CDN for static files

**Server:**
- Configure proper caching
- Monitor resource usage
- Regular updates

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📧 Contact

For support or questions, please contact [your-email@domain.com]

---

## 📚 Additional Documentation

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detailed deployment guide
- [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) - Production setup
- [FIXES_SUMMARY.md](FIXES_SUMMARY.md) - Bug fixes and updates
- [PAYBOX_GUIDE.md](PAYBOX_GUIDE.md) - E-wallet implementation
- [PRODUCT_VARIANTS_GUIDE.md](PRODUCT_VARIANTS_GUIDE.md) - Product variants system