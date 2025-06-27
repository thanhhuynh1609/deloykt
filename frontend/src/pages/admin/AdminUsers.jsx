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
              <Card.Header>
                <h5 className="mb-0">Users Management</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>
                          <strong>{user.username}</strong>
                        </td>
                        <td>
                          {user.first_name} {user.last_name}
                        </td>
                        <td>{user.email}</td>
                        <td>{getUserStatusBadge(user)}</td>
                        <td>{formatDate(user.date_joined)}</td>
                        <td>
                          <div className="action-buttons">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleShowUserDetails(user)}
                              className="me-1"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button
                              variant={user.is_active ? "outline-danger" : "outline-success"}
                              size="sm"
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
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
                      <strong>Email:</strong> {selectedUser.email}<br />
                      <strong>First Name:</strong> {selectedUser.first_name}<br />
                      <strong>Last Name:</strong> {selectedUser.last_name}
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
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
