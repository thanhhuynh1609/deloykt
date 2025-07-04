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
            <small>Administrator</small>
          </div>
        </div>
      </div>

      <Nav className="flex-column sidebar-nav">
        <div className="nav-section">
          <small className="nav-section-title">MANAGEMENT</small>

          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/admin" 
              className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
            >
              <i className="fas fa-tachometer-alt"></i>
              Dashboard
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/admin/products" 
              className={`sidebar-link ${isActive('/admin/products') ? 'active' : ''}`}
            >
              <i className="fas fa-box"></i>
              Products
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/admin/categories" 
              className={`sidebar-link ${isActive('/admin/categories') ? 'active' : ''}`}
            >
              <i className="fas fa-tags"></i>
              Categories
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/admin/brands" 
              className={`sidebar-link ${isActive('/admin/brands') ? 'active' : ''}`}
            >
              <i className="fas fa-trademark"></i>
              Brands
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/admin/orders" 
              className={`sidebar-link ${isActive('/admin/orders') ? 'active' : ''}`}
            >
              <i className="fas fa-shopping-cart"></i>
              Orders
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link 
              as={Link} 
              to="/admin/users" 
              className={`sidebar-link ${isActive('/admin/users') ? 'active' : ''}`}
            >
              <i className="fas fa-users"></i>
              Users
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/reviews"
              className={`sidebar-link ${isActive('/admin/reviews') ? 'active' : ''}`}
            >
              <i className="fas fa-star"></i>
              Reviews
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/paybox"
              className={`sidebar-link ${isActive('/admin/paybox') ? 'active' : ''}`}
            >
              <i className="fas fa-wallet"></i>
              Paybox
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/admin/refunds"
              className={`sidebar-link ${isActive('/admin/refunds') ? 'active' : ''}`}
            >
              <i className="fas fa-undo-alt"></i>
              Refund Requests
            </Nav.Link>
          </Nav.Item>
        </div>
      </Nav>
    </div>
  );
};

export default AdminSidebar;
