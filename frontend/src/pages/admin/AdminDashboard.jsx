import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import httpService from '../../services/httpService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch various stats from your APIs
      const [ordersRes, productsRes] = await Promise.all([
        httpService.get('/api/orders/'),
        httpService.get('/api/products/')
      ]);
      const [totalUsers] = await Promise.all([
        httpService.get('/auth/users/'),
      ]);
       const orders = ordersRes.data || [];
       const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

      setStats({
        totalUsers: totalUsers.data.length - 1 || 0, // Mock data - you can implement user count API
        totalOrders: ordersRes.data.length || 0,
        totalProducts: productsRes.data.length || 0,
        totalRevenue: totalRevenue // Mock data - calculate from orders
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        {/* Stats Cards */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <Card className="stat-card stat-card-orange">
              <Card.Body>
                <div className="stat-content">
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.totalUsers}</h3>
                    <p>Người dùng</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-3">
            <Card className="stat-card stat-card-blue">
              <Card.Body>
                <div className="stat-content">
                  <div className="stat-icon">
                    <i className="fas fa-box"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.totalProducts}</h3>
                    <p>Sản phẩm</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-3">
            <Card className="stat-card stat-card-green">
              <Card.Body>
                <div className="stat-content">
                  <div className="stat-icon">
                    <i className="fas fa-shopping-cart"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.totalOrders}</h3>
                    <p>Đơn hàng </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-3">
            <Card className="stat-card stat-card-pink">
              <Card.Body>
                <div className="stat-content">
                  <div className="stat-icon">
                    {/* <i className="fas fa-dollar-sign"></i> */}
                    <h2>VND</h2>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.totalRevenue.toLocaleString('vi-VN')}</h3>
                    <p>Doanh thu</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Activity */}
        <Row className="mb-4">
          <Col lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Đơn hàng gần đây</h5>
              </Card.Header>
              <Card.Body>
                <div className="recent-activity">
                  <div className="activity-item">
                    <i className="fas fa-shopping-cart text-primary"></i>
                    <div className="activity-content">
                      <p><strong>Đơn hàng mới #1234</strong></p>
                      <small className="text-muted">2 phút trước</small>
                    </div>
                  </div>
                  <div className="activity-item">
                    <i className="fas fa-user text-success"></i>
                    <div className="activity-content">
                      <p><strong>Người dùng mới</strong></p>
                      <small className="text-muted">5 phút trước</small>
                    </div>
                  </div>
                  <div className="activity-item">
                    <i className="fas fa-box text-warning"></i>
                    <div className="activity-content">
                      <p><strong>Cập nhật sản phẩm</strong></p>
                      <small className="text-muted">10 phút trước</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Thao tác nhanh</h5>
              </Card.Header>
              <Card.Body>
                <div className="quick-actions">
                  <Link to="/admin/products" className="btn btn-primary me-2 mb-2">
                    <i className="fas fa-plus me-1"></i>
                    Thêm sản phẩm
                  </Link>
                  <Link to="/admin/orders" className="btn btn-success me-2 mb-2">
                    <i className="fas fa-eye me-1"></i>
                    Xem đơn hàng
                  </Link>
                  <Link to="/admin/users" className="btn btn-info me-2 mb-2">
                    <i className="fas fa-users me-1"></i>
                    QL người dùng
                  </Link>
                  <Link to="/admin/categories" className="btn btn-warning me-2 mb-2">
                    <i className="fas fa-tags me-1"></i>
                    Danh mục
                  </Link>
                  <Link to="/admin/reviews" className="btn btn-primary mb-2">
                    <i className="fas fa-star me-1"></i>
                    Đánh giá
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Chart Section */}
        <Row>
          <Col lg={12}>
            <Card className="chart-card">
              <Card.Header>
                <h5>Extra Area Chart</h5>
              </Card.Header>
              <Card.Body>
                <div className="chart-placeholder">
                  <div className="chart-legend">
                    <span className="legend-item">
                      <span className="legend-color" style={{backgroundColor: '#ff9800'}}></span>
                      Dataset 1
                    </span>
                    <span className="legend-item">
                      <span className="legend-color" style={{backgroundColor: '#4caf50'}}></span>
                      Dataset 2
                    </span>
                    <span className="legend-item">
                      <span className="legend-color" style={{backgroundColor: '#f44336'}}></span>
                      Dataset 3
                    </span>
                  </div>
                  <div className="chart-area">
                    <p>Chart will be rendered here</p>
                    <small>You can integrate Chart.js or any other charting library</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

