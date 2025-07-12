# Hướng dẫn sử dụng chức năng Biến thể Sản phẩm

## Tổng quan
Hệ thống đã được cập nhật để hỗ trợ biến thể sản phẩm với màu sắc và kích cỡ. Mỗi biến thể có thể có giá và số lượng tồn kho riêng biệt.

## Cách sử dụng cho Admin

### 1. Quản lý Màu sắc và Kích cỡ

#### Truy cập Django Admin:
- Đăng nhập vào Django Admin: `http://localhost:8000/admin/`
- Tìm các mục "Màu sắc" và "Kích cỡ" trong phần API

#### Thêm màu sắc mới:
1. Vào "Màu sắc" → "Add Color"
2. Nhập tên màu (ví dụ: "Đỏ")
3. Nhập mã màu hex (ví dụ: "#FF0000")
4. Lưu

#### Thêm kích cỡ mới:
1. Vào "Kích cỡ" → "Add Size"
2. Nhập tên size (ví dụ: "L")
3. Nhập thứ tự hiển thị (số càng nhỏ hiển thị càng trước)
4. Lưu

### 2. Quản lý Sản phẩm có Biến thể

#### Tạo sản phẩm có biến thể:
1. Vào "Products" → "Add Product"
2. Điền thông tin cơ bản của sản phẩm
3. **Quan trọng**: Tích chọn "Has variants" = True
4. Lưu sản phẩm

#### Thêm biến thể cho sản phẩm:
1. Sau khi lưu sản phẩm, cuộn xuống phần "Product variants"
2. Nhấn "Add another Product variant"
3. Chọn màu sắc và kích cỡ
4. Nhập giá cho biến thể này
5. Nhập số lượng tồn kho
6. SKU sẽ được tự động tạo
7. Có thể thêm hình ảnh riêng cho biến thể (tùy chọn)
8. Lưu

#### Ví dụ:
- Sản phẩm: "Áo thun cotton"
- Biến thể 1: Màu Đỏ, Size M, Giá 200.000 VND, Tồn kho 50
- Biến thể 2: Màu Đỏ, Size L, Giá 220.000 VND, Tồn kho 30
- Biến thể 3: Màu Xanh, Size M, Giá 200.000 VND, Tồn kho 40

### 3. Quản lý Tồn kho

#### Xem tổng tồn kho:
- Trong danh sách sản phẩm, cột "Tổng tồn kho" sẽ hiển thị tổng số lượng của tất cả biến thể

#### Cập nhật tồn kho:
1. Vào chi tiết sản phẩm
2. Tìm biến thể cần cập nhật
3. Thay đổi số lượng trong trường "Stock quantity"
4. Lưu

## Cách hoạt động cho Khách hàng

### 1. Xem sản phẩm
- Khách hàng sẽ thấy các tùy chọn màu sắc và kích cỡ
- Giá và tồn kho sẽ cập nhật theo biến thể được chọn
- Phải chọn đầy đủ màu sắc và kích cỡ mới có thể thêm vào giỏ hàng

### 2. Giỏ hàng
- Mỗi biến thể sẽ hiển thị như một item riêng biệt
- Hiển thị thông tin màu sắc và kích cỡ
- Có thể điều chỉnh số lượng cho từng biến thể

### 3. Đặt hàng
- Thông tin biến thể sẽ được lưu trong đơn hàng
- Admin có thể xem chi tiết biến thể trong quản lý đơn hàng

## Lưu ý quan trọng

### Cho sản phẩm có biến thể:
- **Bắt buộc** tích "Has variants" = True
- Giá hiển thị sẽ là giá thấp nhất trong các biến thể
- Tồn kho hiển thị là tổng tồn kho của tất cả biến thể
- Khách hàng phải chọn màu sắc và kích cỡ mới có thể mua

### Cho sản phẩm không có biến thể:
- Giữ "Has variants" = False
- Sử dụng giá và tồn kho trực tiếp của sản phẩm
- Khách hàng có thể mua ngay không cần chọn biến thể

## Troubleshooting

### Lỗi thường gặp:
1. **Không thể thêm vào giỏ hàng**: Kiểm tra đã chọn đầy đủ màu sắc và kích cỡ chưa
2. **Giá không cập nhật**: Kiểm tra biến thể có tồn tại và có giá hợp lệ không
3. **Tồn kho hiển thị 0**: Kiểm tra số lượng tồn kho của biến thể được chọn

### Kiểm tra dữ liệu:
- Sử dụng Django Admin để kiểm tra dữ liệu biến thể
- Đảm bảo mỗi sản phẩm có ít nhất một biến thể nếu "Has variants" = True
- Kiểm tra SKU không bị trùng lặp

## API Endpoints mới

### Lấy thông tin biến thể:
```
GET /api/products/{product_id}/variants/{color_id}/{size_id}/
```

### Quản lý màu sắc:
```
GET /api/colors/
POST /api/colors/
```

### Quản lý kích cỡ:
```
GET /api/sizes/
POST /api/sizes/
```

### Quản lý biến thể sản phẩm:
```
GET /api/product-variants/
POST /api/product-variants/
GET /api/product-variants/?product={product_id}
```
