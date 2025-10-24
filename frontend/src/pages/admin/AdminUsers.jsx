import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import AdminLayout from '../../components/admin/AdminLayout';
import httpService from '../../services/httpService';
import './AdminProducts.css'; // Reuse the same CSS

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await httpService.get('/auth/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Mock data for now
      setUsers([
        {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          is_active: true,
          is_staff: false,
          date_joined: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          username: 'jane_smith',
          email: 'jane@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          is_active: true,
          is_staff: true,
          date_joined: '2024-02-20T14:15:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowUserDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await httpService.patch(`/auth/users/${userId}/`, {
        is_active: !currentStatus
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Hàm mở modal edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: ''
    });
    setShowEditModal(true);
  };

  // Hàm mở modal thêm user mới
  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: ''
    });
    setShowEditModal(true);
  };

  // Hàm đóng modal edit
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
  };

  // Hàm xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Hàm submit form (thêm/sửa user)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Cập nhật user - luôn gửi username và email, chỉ gửi password nếu có
        const dataToUpdate = {
          username: formData.username,
          email: formData.email
        };

        // Chỉ thêm password nếu user nhập password mới
        if (formData.password && formData.password.trim() !== '') {
          dataToUpdate.password = formData.password;
        }

        await httpService.put(`/auth/users/${editingUser.id}/`, dataToUpdate);
      } else {
        // Tạo user mới
        await httpService.post('/auth/users/', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          re_password: formData.password
        });
      }
      fetchUsers();
      handleCloseEditModal();
    } catch (error) {
      console.error('Error saving user:', error);
      if (error.response) {
        alert('Error: ' + JSON.stringify(error.response.data));
      } else {
        alert('An error occurred. Please try again.');
      }
    }
  };

  // Hàm xóa user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await httpService.delete(`/auth/users/${userId}/`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserStatusBadge = (user) => {
    if (!user.is_active) {
      return <Badge bg="danger">Inactive</Badge>;
    } else if (user.is_staff) {
      return <Badge bg="warning">Staff</Badge>;
    } else {
      return <Badge bg="success">Active</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-products">
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Quản lý người dùng</h5>
                <Button
                  variant="primary"
                  onClick={handleAddUser}
                >
                  <i className="fas fa-plus me-2"></i>
                  Thêm người dùng
                </Button>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên</th>
                      <th>Email</th>
                      <th>Trạng thái</th>
                      <th>Ngày</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>
                          <strong>{user.username}</strong>
                        </td>
                        <td>{user.email}</td>
                        <td>{getUserStatusBadge(user)}</td>
                        <td>{formatDate(user.date_joined)}</td>
                        <td>
                          <div className="action-buttons">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleShowUserDetails(user)}
                              className="me-1"
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="me-1"
                              title="Edit User"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="me-1"
                              title="Delete User"
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                            <Button
                              variant={user.is_active ? "outline-warning" : "outline-success"}
                              size="sm"
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              title={user.is_active ? "Deactivate User" : "Activate User"}
                            >
                              <i className={`fas fa-${user.is_active ? 'ban' : 'check'}`}></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* User Details Modal */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>User Details - {selectedUser?.username}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedUser && (
              <div>
                <Row className="mb-3">
                  <Col md={6}>
                    <h6>Personal Information</h6>
                    <p>
                      <strong>Username:</strong> {selectedUser.username}<br />
                      <strong>Email:</strong> {selectedUser.email}
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6>Account Status</h6>
                    <p>
                      <strong>Status:</strong> {getUserStatusBadge(selectedUser)}<br />
                      <strong>Staff:</strong> {selectedUser.is_staff ? 'Yes' : 'No'}<br />
                      <strong>Joined:</strong> {formatDate(selectedUser.date_joined)}
                    </p>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col>
                    <h6>Recent Activity</h6>
                    <div className="recent-activity">
                      <div className="activity-item">
                        <i className="fas fa-shopping-cart text-primary"></i>
                        <div className="activity-content">
                          <p><strong>Placed order #1234</strong></p>
                          <small className="text-muted">2 days ago</small>
                        </div>
                      </div>
                      <div className="activity-item">
                        <i className="fas fa-sign-in-alt text-success"></i>
                        <div className="activity-content">
                          <p><strong>Last login</strong></p>
                          <small className="text-muted">1 week ago</small>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
            {selectedUser && (
              <Button 
                variant={selectedUser.is_active ? "danger" : "success"}
                onClick={() => {
                  toggleUserStatus(selectedUser.id, selectedUser.is_active);
                  handleCloseModal();
                }}
              >
                {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* Add/Edit User Modal */}
        <Modal show={showEditModal} onHide={handleCloseEditModal}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingUser ? 'Edit User' : 'Add New User'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>



              <Form.Group className="mb-3">
                <Form.Label>
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseEditModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingUser ? 'Update User' : 'Add User'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
