import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form } from 'react-bootstrap';
import AdminLayout from '../../components/admin/AdminLayout';
import httpService from '../../services/httpService';
import './AdminProducts.css'; // Reuse the same CSS

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Lấy tất cả sản phẩm để có thông tin về reviews
      const productsResponse = await httpService.get('/api/products/');
      setProducts(productsResponse.data);
      
      // Tạo mảng reviews từ tất cả reviews của các sản phẩm
      let allReviews = [];
      productsResponse.data.forEach(product => {
        if (product.reviews && product.reviews.length > 0) {
          // Thêm thông tin sản phẩm vào mỗi review
          const productReviews = product.reviews.map(review => ({
            ...review,
            product_name: product.name,
            product_id: product.id
          }));
          allReviews = [...allReviews, ...productReviews];
        }
      });
      
      setReviews(allReviews);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (review = null) => {
    if (review) {
      setEditingReview(review);
      setFormData({
        rating: review.rating || 5,
        comment: review.comment || ''
      });
    } else {
      setEditingReview(null);
      setFormData({
        rating: 5,
        comment: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReview) {
        // Sử dụng API endpoint chính xác để cập nhật review
        await httpService.put(`/api/products/${editingReview.product_id}/reviews/${editingReview.id}/`, {
          rating: formData.rating,
          comment: formData.comment
        });
        
        fetchData(); // Refresh data
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error saving review:', error);
    }
  };

  const handleDelete = async (review) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        // Sử dụng API endpoint chính xác để xóa review
        await httpService.delete(`/api/products/${review.product_id}/reviews/${review.id}/`);
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <i 
        key={i} 
        className={`fas fa-star ${i < rating ? 'text-warning' : 'text-muted'}`}
      ></i>
    ));
  };

  return (
    <AdminLayout>
      <div className="admin-reviews">
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Quản lý đánh giá</h5>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <p>Loading reviews...</p>
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Sản phẩm</th>
                        <th>Người dùng</th>
                        <th>Rating</th>
                        <th>Đánh giá</th>
                        <th>Ngày</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map(review => (
                        <tr key={review.id}>
                          <td>{review.id}</td>
                          <td>
                            <strong>{review.product_name || 'Unknown Product'}</strong>
                          </td>
                          <td>{review.user_info?.username || review.name || 'Anonymous'}</td>
                          <td>
                            <div className="d-flex">
                              {renderStars(review.rating)}
                            </div>
                          </td>
                          <td>
                            {review.comment?.substring(0, 100)}
                            {review.comment?.length > 100 && '...'}
                          </td>
                          <td>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowModal(review)}
                                className="me-1"
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(review)}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Edit Review Modal */}
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>
              Edit Review
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              {editingReview && (
                <div className="mb-3">
                  <strong>Product:</strong> {editingReview.product_name}<br/>
                  <strong>User:</strong> {editingReview.user_info?.username || editingReview.name || 'Anonymous'}
                </div>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label>Rating</Form.Label>
                <Form.Select
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  required
                >
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Fair</option>
                  <option value="3">3 - Good</option>
                  <option value="4">4 - Very Good</option>
                  <option value="5">5 - Excellent</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Comment</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Update Review
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;


