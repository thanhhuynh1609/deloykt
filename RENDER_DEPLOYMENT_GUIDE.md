# 🚀 Hướng dẫn Deploy E-commerce lên Render.com

## 📋 Tổng quan dự án
Dự án E-commerce này bao gồm:
- **Backend**: Django REST Framework với JWT authentication
- **Frontend**: React.js với Bootstrap UI
- **Database**: PostgreSQL (production)
- **Cache/WebSocket**: Redis
- **AI Features**: Chatbot với NLP, product search
- **Payment**: Stripe integration
- **Features**: Product variants, admin dashboard, user management

## 🛠️ Chuẩn bị trước khi deploy

### 1. Tài khoản cần thiết:
- [x] Tài khoản Render.com (miễn phí)
- [x] Tài khoản GitHub (để connect repository)
- [x] Tài khoản Stripe (cho payment)
- [ ] Tài khoản email provider (Gmail/SendGrid - tùy chọn)

### 2. Chuẩn bị code:
- [x] Push code lên GitHub repository
- [x] Đảm bảo có các file: `render.yaml`, `build.sh`, `requirements.txt`
- [x] Cấu hình `backend/settings_render.py`

## 🚀 Các bước deploy

### Bước 1: Tạo tài khoản và connect GitHub
1. Đăng ký tại [render.com](https://render.com)
2. Connect với GitHub account
3. Authorize Render truy cập repositories

### Bước 2: Tạo PostgreSQL Database
1. Trong Render Dashboard, click **"New +"**
2. Chọn **"PostgreSQL"**
3. Cấu hình:
   - **Name**: `ecommerce-db`
   - **Database**: `ecommerce_prod`
   - **User**: `ecommerce_user`
   - **Region**: Singapore (gần Việt Nam nhất)
   - **Plan**: Free tier
4. Click **"Create Database"**
5. **Lưu lại DATABASE_URL** từ dashboard

### Bước 3: Tạo Redis Service
1. Click **"New +"** → **"Redis"**
2. Cấu hình:
   - **Name**: `ecommerce-redis`
   - **Plan**: Free tier
   - **Region**: Singapore
3. Click **"Create Redis"**
4. **Lưu lại REDIS_URL** từ dashboard

### Bước 4: Deploy Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect GitHub repository
3. Cấu hình:
   - **Name**: `ecommerce-web`
   - **Environment**: Python
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT`
   - **Plan**: Free tier

### Bước 5: Thiết lập Environment Variables
Trong Web Service settings, thêm các biến môi trường:

#### Bắt buộc:
```
SECRET_KEY=<auto-generate>
DEBUG=False
DJANGO_SETTINGS_MODULE=backend.settings_render
DATABASE_URL=<từ PostgreSQL service>
REDIS_URL=<từ Redis service>
```

#### Stripe (bắt buộc cho payment):
```
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

#### Tùy chọn:
```
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

### Bước 6: Deploy
1. Click **"Create Web Service"**
2. Render sẽ tự động:
   - Clone repository
   - Chạy build script
   - Install dependencies
   - Build React frontend
   - Collect static files
   - Run migrations
   - Start server

### Bước 7: Cấu hình Domain và HTTPS
1. Render tự động cung cấp HTTPS
2. Domain mặc định: `https://your-app-name.onrender.com`
3. Có thể custom domain (paid plan)

## 🔧 Sau khi deploy

### 1. Tạo superuser
```bash
# Trong Render Shell (Web Service → Shell)
python manage.py createsuperuser
```

### 2. Test các endpoints
- Health check: `https://your-app.onrender.com/api/health/`
- Admin: `https://your-app.onrender.com/admin/`
- API: `https://your-app.onrender.com/api/`

### 3. Upload sample data
- Tạo categories, brands, products qua admin
- Test payment với Stripe test cards
- Test AI chatbot features

## 🐛 Troubleshooting

### Build fails:
- Check build logs trong Render dashboard
- Đảm bảo `build.sh` có execute permission
- Verify `requirements.txt` syntax

### Database connection issues:
- Check DATABASE_URL format
- Verify PostgreSQL service đang chạy
- Check network connectivity

### Static files không load:
- Verify `collectstatic` chạy thành công
- Check WhiteNoise configuration
- Verify STATIC_ROOT settings

### WebSocket không hoạt động:
- Check Redis connection
- Verify CHANNEL_LAYERS settings
- Check ASGI configuration

## 📊 Monitoring và Logs
- **Logs**: Render Dashboard → Service → Logs
- **Metrics**: Built-in monitoring
- **Health checks**: Automatic với `/api/health/`
- **Alerts**: Email notifications

## 💰 Chi phí
- **Free tier**: 750 hours/month
- **Database**: PostgreSQL free tier
- **Redis**: Free tier với giới hạn
- **Bandwidth**: 100GB/month free

## 🔄 Auto-deploy
- Render tự động deploy khi push code lên main branch
- Có thể disable auto-deploy nếu cần
- Support preview deployments cho pull requests

## 📞 Support
- Render Documentation: [render.com/docs](https://render.com/docs)
- Community Forum: [community.render.com](https://community.render.com)
- Email support (paid plans)

---

**🎉 Chúc mừng! Dự án E-commerce của bạn đã được deploy thành công lên Render!**
