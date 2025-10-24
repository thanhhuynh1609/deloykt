import React, { useContext } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import UserContext from '../../context/userContext';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const location = useLocation();
  const { userInfo } = useContext(UserContext);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <div className="admin-info">
          <div className="admin-avatar">
            <i className="fas fa-user-shield"></i>
          </div>
          <div className="admin-details">
            <h6>{userInfo?.username?.toUpperCase() || 'ADMIN'}</h6>
            <small>Quản trị viên</small>
          </div>
        </div>
      </div>

      <Nav className="flex-column sidebar-nav">
        <div className="nav-section">
          <small className="nav-section-title">Quản lý</small>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin"
              className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
            >
              <i className="fas fa-tachometer-alt"></i>
              Trang chính
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/products"
              className={`sidebar-link ${isActive('/admin/products') ? 'active' : ''}`}
            >
              <i className="fas fa-box"></i>
              Sản phẩm
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/categories"
              className={`sidebar-link ${isActive('/admin/categories') ? 'active' : ''}`}
            >
              <i className="fas fa-tags"></i>
              Loại
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/brands"
              className={`sidebar-link ${isActive('/admin/brands') ? 'active' : ''}`}
            >
              <i className="fas fa-trademark"></i>
              Thương hiệu
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/orders"
              className={`sidebar-link ${isActive('/admin/orders') ? 'active' : ''}`}
            >
              <i className="fas fa-shopping-cart"></i>
              Đơn hàng
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/users"
              className={`sidebar-link ${isActive('/admin/users') ? 'active' : ''}`}
            >
              <i className="fas fa-users"></i>
              Người dùng
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/reviews"
              className={`sidebar-link ${isActive('/admin/reviews') ? 'active' : ''}`}
            >
              <i className="fas fa-star"></i>
              Đánh giá
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/paybox"
              className={`sidebar-link ${isActive('/admin/paybox') ? 'active' : ''}`}
            >
              <i className="fas fa-wallet"></i>
              Ví Paybox
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/coupons"
              className={`sidebar-link ${isActive('/admin/coupons') ? 'active' : ''}`}
            >
              <i className="fas fa-ticket-alt me-2"></i>
              Mã giảm giá
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/chat"
              className={`sidebar-link ${isActive('/admin/chat') ? 'active' : ''}`}
            >
              <i className="fas fa-comments"></i>
              Tin nhắn
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/refunds"
              className={`sidebar-link ${isActive('/admin/refunds') ? 'active' : ''}`}
            >
              <i className="fas fa-undo-alt"></i>
              Yêu cầu hoàn tiền
            </Nav.Link>
          </Nav.Item>

        </div>
      </Nav>
    </div>
  );
};

export default AdminSidebar;
