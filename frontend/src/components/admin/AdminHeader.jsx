import React, { useContext } from 'react';
import { Navbar, Nav, Dropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import UserContext from '../../context/userContext';
import './AdminHeader.css';

const AdminHeader = () => {
  const { userInfo, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('Admin logout clicked');
    logout();
    navigate('/login');
  };

  console.log('AdminHeader rendered, userInfo:', userInfo);

  return (
    <Navbar className="admin-header" expand="lg">
      <div className="admin-header-content">
        <div className="header-left">
          {/* <button className="sidebar-toggle">
            <i className="fas fa-bars"></i>
          </button> */}

          <div className="logo">
            <i className="fas fa-circle" style={{ color: '#00BCD4' }}></i>
            <span className="logo-text">TNBH Store</span>
          </div>
        </div>

        <div className="header-center">
          <h4 className="page-title">Quản Lý</h4>
        </div>

        <div className="header-right">
          <Nav className="header-nav">
            <Nav.Item className="nav-item-icon">
              <Nav.Link as={Link} to="/admin/refunds" className="nav-icon">
                <i className="fas fa-undo-alt"></i>
                {/* <Badge bg="warning">2</Badge>  // Nếu bạn muốn badge số lượng */}
              </Nav.Link>
            </Nav.Item>

            <Nav.Item className="nav-item-icon">
              <Nav.Link href="#" className="nav-icon">
                <i className="fas fa-bell"></i>
                <Badge bg="danger" className="notification-badge">3</Badge>
              </Nav.Link>
            </Nav.Item>

            <Nav.Item className="nav-item-icon">
              <Nav.Link href="#" className="nav-icon">
                <i className="fas fa-question-circle"></i>
              </Nav.Link>
            </Nav.Item>

            <Nav.Item className="nav-item-icon">
              <Nav.Link href="#" className="nav-icon">
                <i className="fas fa-envelope"></i>
                <Badge bg="danger" className="notification-badge">1</Badge>
              </Nav.Link>
            </Nav.Item>

            <Dropdown align="end">
              <Dropdown.Toggle 
                variant="link" 
                className="user-dropdown"
                id="user-dropdown"
              >
                <i className="fas fa-user-shield"></i>
                <span className="user-name">{userInfo?.username || 'Admin'}</span>
                <i className="fas fa-chevron-down"></i>
              </Dropdown.Toggle>

              <Dropdown.Menu className="user-menu">
                {/* <Dropdown.Item as={Link} to="/admin/profile">
                  <i className="fas fa-user"></i>
                  Thông tin cá nhân
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/admin/settings">
                  <i className="fas fa-cog"></i>
                  Cài đặt
                </Dropdown.Item>
                <Dropdown.Divider /> */}
                <Dropdown.Item onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i>
                  Đăng xuất
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </div>
      </div>
    </Navbar>
  );
};

export default AdminHeader;
