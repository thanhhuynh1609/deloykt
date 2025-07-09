import React, { useState, useContext } from "react";
import { Form, Button, ListGroup, Row, Col, Alert } from "react-bootstrap";
import Rating from "./rating";
import UserContext from "../context/userContext";
import httpService from "../services/httpService";
import Message from "./message";
import "../styles/reviewsList.css";

function ReviewsList({ product }) {
  const { userInfo } = useContext(UserContext);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState(product.reviews || []);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await httpService.post(`/api/products/${product.id}/reviews/`, {
        rating,
        comment,
      });
      setReviews([...reviews, data]);
      setRating(0);
      setComment("");
      setSuccess("Đánh giá của bạn đã được gửi thành công!");
    } catch (ex) {
      setError(
        ex.response && ex.response.data.detail
          ? ex.response.data.detail
          : "Đã xảy ra lỗi khi gửi đánh giá"
      );
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  return (
    <div className="reviews-container">
      {reviews.length === 0 ? (
        <Alert variant="info">Chưa có đánh giá nào cho sản phẩm này</Alert>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="reviewer-details">
                    <h5>{review.name}</h5>
                    <p className="review-date">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <div className="review-rating">
                  <Rating value={review.rating} color="#f8e825" />
                </div>
              </div>
              <div className="review-content">
                <p>{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="review-form-container">
        <h4>Viết đánh giá</h4>
        {success && <Message variant="success">{success}</Message>}
        {error && <Message variant="danger">{error}</Message>}
        
        {userInfo ? (
          <Form onSubmit={submitHandler}>
            <Form.Group controlId="rating" className="mb-3">
              <Form.Label>Đánh giá</Form.Label>
              <div className="rating-select">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div 
                    key={star} 
                    className={`rating-star ${rating >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    <i className="fas fa-star"></i>
                  </div>
                ))}
              </div>
            </Form.Group>

            <Form.Group controlId="comment" className="mb-3">
              <Form.Label>Bình luận</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này"
              ></Form.Control>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="submit-review-btn"
            >
              {loading ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </Form>
        ) : (
          <Message variant="info">
            Vui lòng <a href="/login">đăng nhập</a> để viết đánh giá
          </Message>
        )}
      </div>
    </div>
  );
}

export default ReviewsList;
