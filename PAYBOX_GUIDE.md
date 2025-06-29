# Hướng dẫn sử dụng Ví điện tử Paybox

## Tổng quan
Paybox là hệ thống ví điện tử tích hợp trong ứng dụng e-commerce, cho phép người dùng:
- Nạp tiền vào ví thông qua Stripe
- Thanh toán đơn hàng bằng số dư ví
- Theo dõi lịch sử giao dịch
- Quản lý ví một cách dễ dàng

## Cấu trúc Database

### PayboxWallet Model
- `user`: OneToOne với User model
- `balance`: Số dư ví (VND, không có decimal)
- `is_active`: Trạng thái hoạt động của ví
- `created_at`, `updated_at`: Timestamps

### PayboxTransaction Model
- `wallet`: ForeignKey đến PayboxWallet
- `transaction_type`: DEPOSIT, PAYMENT, REFUND, TRANSFER
- `amount`: Số tiền giao dịch
- `status`: PENDING, COMPLETED, FAILED, CANCELLED
- `description`: Mô tả giao dịch
- `order`: Liên kết với đơn hàng (nếu có)
- `stripe_payment_intent_id`: ID từ Stripe
- `balance_before`, `balance_after`: Số dư trước và sau giao dịch

## API Endpoints

### User Endpoints
- `GET /api/paybox/wallet/` - Lấy thông tin ví
- `GET /api/paybox/transactions/` - Lịch sử giao dịch
- `POST /api/paybox/deposit/` - Tạo payment intent nạp tiền
- `POST /api/paybox/deposit/confirm/` - Xác nhận nạp tiền thành công
- `POST /api/paybox/payment/` - Thanh toán đơn hàng bằng ví

### Admin Endpoints
- `GET /api/admin/paybox/wallets/` - Danh sách tất cả ví
- `GET /api/admin/paybox/transactions/` - Danh sách tất cả giao dịch

## Frontend Components

### Pages
- `/paybox` - Trang dashboard ví Paybox
- `/admin/paybox` - Trang quản lý admin

### Components
- `PayboxWallet` - Hiển thị thông tin ví
- `PayboxDeposit` - Form nạp tiền
- `PayboxDepositForm` - Form Stripe payment
- `PayboxTransactions` - Lịch sử giao dịch
- `AdminPaybox` - Interface admin

### Context
- `PayboxContext` - Quản lý state và API calls

## Hướng dẫn Testing

### 1. Kiểm tra tạo ví
```bash
# Đăng nhập với user bất kỳ
# Truy cập /paybox
# Ví sẽ được tạo tự động với số dư 0
```

### 2. Test nạp tiền
```bash
# Vào tab "Nạp tiền" trong /paybox
# Nhập số tiền (ví dụ: 100000)
# Sử dụng test card: 4242 4242 4242 4242
# Expiry: 12/34, CVC: 123
# Kiểm tra số dư được cập nhật
```

### 3. Test thanh toán đơn hàng
```bash
# Tạo đơn hàng bình thường
# Trong payment page, chọn "Ví Paybox"
# Hoàn tất đơn hàng
# Trong order details, sử dụng nút "Thanh toán bằng Paybox"
# Kiểm tra số dư bị trừ và đơn hàng được đánh dấu đã thanh toán
```

### 4. Test admin interface
```bash
# Đăng nhập với admin account
# Truy cập /admin/paybox
# Kiểm tra danh sách ví và giao dịch
# Verify thống kê hiển thị đúng
```

## Stripe Test Cards
- **Thành công**: 4242 4242 4242 4242
- **Thất bại**: 4000 0000 0000 0002
- **Yêu cầu 3D Secure**: 4000 0025 0000 3155

## Lưu ý quan trọng

### Bảo mật
- Tất cả API endpoints đều yêu cầu authentication
- Admin endpoints kiểm tra `is_staff`
- Stripe payment được xử lý an toàn
- Không lưu trữ thông tin thẻ

### Xử lý lỗi
- Kiểm tra số dư trước khi thanh toán
- Xử lý duplicate payment intent
- Transaction atomic để đảm bảo consistency
- Error handling cho tất cả API calls

### Performance
- Lazy loading cho transactions
- Pagination có thể được thêm sau
- Index trên các trường thường query

## Tính năng có thể mở rộng

1. **Chuyển tiền giữa users**
2. **Cashback và rewards**
3. **Limit giao dịch hàng ngày**
4. **Multi-currency support**
5. **Export transaction history**
6. **Email notifications**
7. **Mobile app integration**

## Troubleshooting

### Lỗi thường gặp
1. **"Số dư không đủ"** - Kiểm tra balance trong database
2. **"Payment intent failed"** - Kiểm tra Stripe configuration
3. **"Transaction already processed"** - Duplicate payment intent ID

### Debug
- Check Django logs cho API errors
- Check browser console cho frontend errors
- Verify Stripe webhook configuration
- Check database constraints

## Migration và Deployment

### Database Migration
```bash
python manage.py makemigrations
python manage.py migrate
```

### Environment Variables
```bash
STRIPE_API_KEY=sk_test_...
```

### Production Considerations
- Sử dụng Stripe live keys
- Setup proper logging
- Monitor transaction volumes
- Backup strategy cho wallet data
- Rate limiting cho API endpoints
