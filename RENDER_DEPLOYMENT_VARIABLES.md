# Environment Variables cho Render Deployment

## 🔧 Biến môi trường bắt buộc

### Django Core Settings
```
SECRET_KEY=your-secret-key-here
DEBUG=False
DJANGO_SETTINGS_MODULE=backend.settings_render
```

### Database (PostgreSQL)
```
DATABASE_URL=postgresql://username:password@hostname:port/database_name
```
*Render sẽ tự động tạo và cung cấp DATABASE_URL khi bạn tạo PostgreSQL database*

### Redis (cho WebSocket và Cache)
```
REDIS_URL=redis://hostname:port/0
```
*Render sẽ tự động tạo và cung cấp REDIS_URL khi bạn tạo Redis service*

## 💳 Stripe Payment (Bắt buộc cho thanh toán)
```
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

## 📧 Email Settings (Tùy chọn)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

## 🤖 AI/ML Settings (Tùy chọn cho chatbot)
```
OPENAI_API_KEY=your-openai-api-key-here
HUGGINGFACE_API_KEY=your-huggingface-api-key-here
```

## 🔒 Security Settings (Render tự động)
Những biến này sẽ được Render tự động tạo:
```
PYTHON_VERSION=3.11.0
NODE_VERSION=18.17.0
```

## 📝 Cách thiết lập trên Render:

1. **Tự động từ Services**: DATABASE_URL và REDIS_URL sẽ được tự động tạo
2. **Cần thiết lập thủ công**: 
   - SECRET_KEY (có thể để Render tự generate)
   - STRIPE_PUBLISHABLE_KEY
   - STRIPE_SECRET_KEY
   - EMAIL_* (nếu cần email)
   - *_API_KEY (nếu cần AI features)

## ⚠️ Lưu ý quan trọng:
- Không bao giờ commit file .env vào Git
- Sử dụng Render Dashboard để thiết lập environment variables
- SECRET_KEY có thể để Render tự động generate
- Stripe keys cần lấy từ Stripe Dashboard
- Email settings chỉ cần nếu muốn gửi email notifications
