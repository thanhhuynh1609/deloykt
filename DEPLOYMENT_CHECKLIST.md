# ✅ Deployment Checklist cho Render

## 📋 Pre-deployment Checklist

### Code Preparation
- [ ] Code đã được push lên GitHub repository
- [ ] File `render.yaml` đã được tạo
- [ ] File `build.sh` đã được tạo và có execute permission
- [ ] File `requirements.txt` đã được cập nhật với dependencies mới
- [ ] File `runtime.txt` chỉ định Python version
- [ ] Settings production (`backend/settings_render.py`) đã được cấu hình

### Dependencies Check
- [ ] `gunicorn` đã được thêm vào requirements.txt
- [ ] `whitenoise` đã được thêm vào requirements.txt
- [ ] `psycopg2-binary` đã được thêm vào requirements.txt
- [ ] `channels-redis` đã được thêm vào requirements.txt
- [ ] `redis` đã được thêm vào requirements.txt

### Frontend Build
- [ ] React app build thành công locally
- [ ] Static files được collect đúng
- [ ] Frontend routing hoạt động với Django

## 🚀 Deployment Steps

### 1. Render Account Setup
- [ ] Tạo tài khoản Render.com
- [ ] Connect GitHub account
- [ ] Verify email address

### 2. Database Setup
- [ ] Tạo PostgreSQL database service
- [ ] Lưu DATABASE_URL
- [ ] Test connection

### 3. Redis Setup
- [ ] Tạo Redis service
- [ ] Lưu REDIS_URL
- [ ] Test connection

### 4. Web Service Deployment
- [ ] Tạo Web Service từ GitHub repo
- [ ] Cấu hình build command: `./build.sh`
- [ ] Cấu hình start command: `gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT`
- [ ] Thiết lập environment variables

### 5. Environment Variables
- [ ] SECRET_KEY (auto-generate hoặc manual)
- [ ] DEBUG=False
- [ ] DJANGO_SETTINGS_MODULE=backend.settings_render
- [ ] DATABASE_URL (từ PostgreSQL service)
- [ ] REDIS_URL (từ Redis service)
- [ ] STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] EMAIL settings (nếu cần)

## 🔍 Post-deployment Testing

### Basic Functionality
- [ ] Website load thành công
- [ ] Health check endpoint: `/api/health/`
- [ ] Admin panel accessible: `/admin/`
- [ ] API endpoints hoạt động: `/api/`

### Authentication & Users
- [ ] User registration hoạt động
- [ ] User login hoạt động
- [ ] JWT tokens được tạo đúng
- [ ] Admin user có thể login

### E-commerce Features
- [ ] Products hiển thị đúng
- [ ] Categories và Brands hoạt động
- [ ] Product variants (color/size) hoạt động
- [ ] Shopping cart functionality
- [ ] Order placement hoạt động

### Payment Integration
- [ ] Stripe integration hoạt động
- [ ] Test payment với test cards
- [ ] Paybox wallet features
- [ ] Order payment status updates

### AI Features
- [ ] Chatbot hoạt động
- [ ] AI product search
- [ ] WebSocket connections
- [ ] Real-time messaging

### Static Files & Media
- [ ] CSS/JS files load đúng
- [ ] Images hiển thị đúng
- [ ] Media upload hoạt động
- [ ] Static files served correctly

## 🐛 Common Issues & Solutions

### Build Failures
- [ ] Check build logs trong Render dashboard
- [ ] Verify `build.sh` permissions
- [ ] Check `requirements.txt` syntax
- [ ] Verify Node.js version compatibility

### Database Issues
- [ ] Verify DATABASE_URL format
- [ ] Check PostgreSQL service status
- [ ] Run migrations manually if needed
- [ ] Check database permissions

### Static Files Issues
- [ ] Verify WhiteNoise configuration
- [ ] Check STATIC_ROOT settings
- [ ] Run `collectstatic` manually
- [ ] Check file permissions

### WebSocket Issues
- [ ] Verify Redis connection
- [ ] Check CHANNEL_LAYERS settings
- [ ] Test WebSocket endpoints
- [ ] Check ASGI configuration

## 📊 Performance & Monitoring

### Performance Optimization
- [ ] Enable gzip compression
- [ ] Optimize database queries
- [ ] Configure caching
- [ ] Monitor memory usage

### Monitoring Setup
- [ ] Check application logs
- [ ] Monitor database performance
- [ ] Set up error tracking
- [ ] Configure health checks

## 🔄 Maintenance

### Regular Tasks
- [ ] Monitor application logs
- [ ] Update dependencies regularly
- [ ] Backup database periodically
- [ ] Monitor disk usage
- [ ] Check security updates

### Scaling Considerations
- [ ] Monitor resource usage
- [ ] Consider upgrading plans if needed
- [ ] Optimize database queries
- [ ] Consider CDN for static files

---

**✅ Deployment hoàn tất khi tất cả items trong checklist đã được check!**
