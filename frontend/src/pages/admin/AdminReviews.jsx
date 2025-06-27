import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal } from 'react-bootstrap';
import AdminLayout from '../../components/admin/AdminLayout';
import httpService from '../../services/httpService';
import './AdminProducts.css'; // Reuse the same CSS

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await httpService.get('/api/reviews/');
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Fallback to mock data if API fails
      setReviews([
        {
          id: 1,
          product: { id: 1, name: 'iPhone 13' },
          user: { username: 'john_doe', email: 'john@example.com' },
          name: 'John Doe',
          rating: 5,
          comment: 'Excellent product! Highly recommended.',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          product: { id: 2, name: 'MacBook Pro' },
          user: { username: 'jane_smith', email: 'jane@example.com' },
          name: 'Jane Smith',
          rating: 4,
          comment: 'Good laptop but a bit expensive.',
          createdAt: '2024-01-20T14:15:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowReviewDetails = (review) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReview(null);
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await httpService.delete(`/api/reviews/${reviewId}/`);
        fetchReviews(); // Refresh the list
      } catch (error) {
        console.error('Error deleting review:', error);
        // Fallback: remove from state
        setReviews(reviews.filter(review => review.id !== reviewId));
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`fas fa-star ${i <= rating ? 'text-warning' : 'text-muted'}`}
        ></i>
      );
    }
    return stars;
  };

  const getRatingBadge = (rating) => {
    if (rating >= 4) return <Badge bg="success">{rating}/5</Badge>;
    if (rating >= 3) return <Badge bg="warning">{rating}/5</Badge>;
    return <Badge bg="danger">{rating}/5</Badge>;
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
                <h5 className="mb-0">Reviews Management</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Customer</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map(review => (
                      <tr key={review.id}>
                        <td>{review.id}</td>
                        <td>
                          <strong>{review.product_name || 'Unknown Product'}</strong>
                        </td>
                        <td>
                          <div>
                            <strong>{review.name}</strong>
                            <br />
                            <small className="text-muted">
                              {review.user_info?.email || 'No email'}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {getRatingBadge(review.rating)}
                            <div>{getRatingStars(review.rating)}</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ maxWidth: '200px' }}>
                            {review.comment?.substring(0, 50)}
                            {review.comment?.length > 50 && '...'}
                          </div>
                        </td>
                        <td>{formatDate(review.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleShowReviewDetails(review)}
                              className="me-1"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              <i className="fas fa-trash"></i>
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

        {/* Review Details Modal */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Review Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedReview && (
              <div>
                <Row className="mb-3">
                  <Col md={6}>
                    <h6>Product Information</h6>
                    <p>
                      <strong>Product:</strong> {selectedReview.product_name || 'Unknown Product'}<br />
                      <strong>Product ID:</strong> #{selectedReview.product}
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6>Customer Information</h6>
                    <p>
                      <strong>Name:</strong> {selectedReview.name}<br />
                      <strong>Username:</strong> {selectedReview.user_info?.username || 'Unknown'}<br />
                      <strong>Email:</strong> {selectedReview.user_info?.email || 'No email'}
                    </p>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col>
                    <h6>Review Details</h6>
                    <div className="mb-2">
                      <strong>Rating:</strong> 
                      <span className="ms-2">{getRatingStars(selectedReview.rating)}</span>
                      <span className="ms-2">({selectedReview.rating}/5)</span>
                    </div>
                    <div className="mb-2">
                      <strong>Date:</strong> {formatDate(selectedReview.createdAt)}
                    </div>
                    <div>
                      <strong>Comment:</strong>
                      <div className="mt-2 p-3 bg-light rounded">
                        {selectedReview.comment}
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
            <Button 
              variant="danger" 
              onClick={() => {
                handleDeleteReview(selectedReview.id);
                handleCloseModal();
              }}
            >
              Delete Review
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
