# 🎛️ Admin Dashboard Guide

## 📋 **Tổng quan**

Admin Dashboard được thiết kế với giao diện hiện đại, tương tự như hình mẫu bạn đã cung cấp. Hệ thống bao gồm:

- **Sidebar Navigation**: Menu điều hướng bên trái với các chức năng quản lý
- **Header**: Thanh header với thông tin admin và notifications
- **Dashboard**: Trang tổng quan với thống kê và biểu đồ
- **Management Pages**: Các trang quản lý Products, Orders, Categories

## 🚀 **Cách truy cập Admin Dashboard**

### **1. Đăng nhập với tài khoản Admin**
```
URL: http://localhost:3000/login
Username: admin_username
Password: admin_password
```

### **2. Tự động chuyển hướng**
- Sau khi đăng nhập thành công với tài khoản admin (`isAdmin: true`)
- Hệ thống sẽ tự động chuyển hướng đến `/admin`
- User thường sẽ được chuyển về trang chủ

## 🎨 **Cấu trúc Admin Dashboard**

### **Sidebar Menu:**
```
📊 Dashboard
   ├── Overview (/admin)
   └── Analytics (/admin/analytics)

🎛️ Widgets (/admin/widgets)

📦 Elements
   ├── Products (/admin/products)
   ├── Categories (/admin/categories)
   └── Brands (/admin/brands)

📋 Tables (/admin/tables)
🛒 Orders (/admin/orders)
💰 Pricing Tables (/admin/pricing)
📧 Contact (/admin/contact)

➕ Additional Pages
   ├── Users (/admin/users)
   └── Reviews (/admin/reviews)

🗺️ Map (/admin/map)
📊 Charts (/admin/charts)
```

## 🛠️ **Chức năng đã implement**

### **1. Dashboard (/admin)**
- **Stats Cards**: Hiển thị thống kê tổng quan
  - Total Users (Welcome)
  - Average Time
  - Collections (Products)
  - Comments (Orders)

- **Social Media Stats**: 
  - Facebook, Twitter, LinkedIn, Google+ metrics
  - Followers, Feeds, Contacts, Circles

- **Chart Area**: Placeholder cho biểu đồ (có thể tích hợp Chart.js)

### **2. Products Management (/admin/products)**
- ✅ **View Products**: Danh sách tất cả sản phẩm
- ✅ **Add Product**: Thêm sản phẩm mới
- ✅ **Edit Product**: Chỉnh sửa thông tin sản phẩm
- ✅ **Delete Product**: Xóa sản phẩm
- ✅ **Filter by Brand/Category**: Lọc theo thương hiệu/danh mục

### **3. Orders Management (/admin/orders)**
- ✅ **View Orders**: Danh sách tất cả đơn hàng
- ✅ **Order Details**: Xem chi tiết đơn hàng
- ✅ **Update Status**: Cập nhật trạng thái giao hàng
- ✅ **Payment Status**: Theo dõi trạng thái thanh toán

### **4. Categories Management (/admin/categories)**
- ✅ **View Categories**: Danh sách danh mục
- ✅ **Add Category**: Thêm danh mục mới
- ✅ **Edit Category**: Chỉnh sửa danh mục
- ✅ **Delete Category**: Xóa danh mục

## 🔐 **Bảo mật**

### **Protected Routes**
- Tất cả admin routes được bảo vệ bởi `ProtectedRoute` component
- Kiểm tra `userInfo.isAdmin === true`
- Tự động redirect về `/login` nếu chưa đăng nhập
- Redirect về `/` nếu không phải admin

### **API Authentication**
- Sử dụng JWT token trong header: `Authorization: JWT <token>`
- Token được tự động thêm vào mọi API request
- Auto-refresh token khi hết hạn

## 🎨 **Styling & UI**

### **Color Scheme**
- **Primary**: Gradient blue-purple (#667eea to #764ba2)
- **Success**: Green (#28a745)
- **Warning**: Orange (#ffc107)
- **Danger**: Red (#dc3545)
- **Info**: Blue (#17a2b8)

### **Components**
- **Cards**: Border-radius 12px, subtle shadows
- **Buttons**: Rounded corners, hover effects
- **Tables**: Responsive, hover effects
- **Modals**: Clean design, form validation

## 📱 **Responsive Design**

- **Desktop**: Full sidebar + content area
- **Tablet**: Collapsible sidebar
- **Mobile**: Hidden sidebar with toggle button

## 🔧 **Customization**

### **Thêm menu item mới:**
```jsx
// AdminSidebar.jsx
<Nav.Item>
  <Nav.Link 
    as={Link} 
    to="/admin/new-feature" 
    className={`sidebar-link ${isActive('/admin/new-feature') ? 'active' : ''}`}
  >
    <i className="fas fa-new-icon"></i>
    New Feature
  </Nav.Link>
</Nav.Item>
```

### **Thêm route mới:**
```jsx
// App.js
<Route path="/admin/new-feature" element={
  <ProtectedRoute adminOnly={true}>
    <NewFeaturePage />
  </ProtectedRoute>
} />
```

## 📊 **Tích hợp Chart.js (Optional)**

```bash
npm install chart.js react-chartjs-2
```

```jsx
// AdminDashboard.jsx
import { Line, Bar, Doughnut } from 'react-chartjs-2';

const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    label: 'Sales',
    data: [12, 19, 3, 5, 2, 3],
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.1)'
  }]
};
```

## 🚀 **Deployment**

1. **Build project:**
```bash
npm run build
```

2. **Environment variables:**
```env
REACT_APP_API_URL=https://your-api-domain.com
```

3. **Deploy to hosting service** (Netlify, Vercel, etc.)

## 🐛 **Troubleshooting**

### **Admin không thể truy cập:**
- Kiểm tra `userInfo.isAdmin` trong localStorage
- Verify JWT token còn hạn
- Check API response từ `/auth/jwt/create/`

### **Sidebar không hiển thị:**
- Kiểm tra CSS import
- Verify Font Awesome CDN
- Check responsive breakpoints

### **API calls thất bại:**
- Verify JWT token format: `JWT <token>`
- Check CORS settings
- Verify API endpoints

## 📞 **Support**

Nếu cần hỗ trợ thêm, hãy kiểm tra:
1. Console errors trong browser
2. Network tab để debug API calls
3. Redux DevTools (nếu sử dụng)
4. React Developer Tools
