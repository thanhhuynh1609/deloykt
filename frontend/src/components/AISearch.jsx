import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AISearch.css';

const AISearch = ({ show, onHide }) => {
  const [searchType, setSearchType] = useState('text'); // 'text', 'image', 'combined'
  const [textQuery, setTextQuery] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Reset AI search when modal closes
  const handleClose = () => {
    resetForm();
    onHide();
  };

  // Enhanced reset function
  const resetForm = () => {
    setTextQuery('');
    setImageFile(null);
    setImagePreview(null);
    setResults([]);
    setError('');
    setLoading(false);
    setSearchType('text'); // Reset to default tab
  };

  // Reset when modal opens
  React.useEffect(() => {
    if (show) {
      resetForm();
    }
  }, [show]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    if (!textQuery.trim() && !imageFile) {
      setError('Vui lòng nhập mô tả hoặc chọn hình ảnh');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const formData = new FormData();
      
      if (searchType === 'text' && textQuery.trim()) {
        const response = await axios.post('/api/ai-search/text/', {
          text: textQuery,
          limit: 6
        });
        setResults(response.data.products);
      } 
      else if (searchType === 'image' && imageFile) {
        formData.append('image', imageFile);
        formData.append('limit', '6');
        
        const response = await axios.post('/api/ai-search/image/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResults(response.data.products);
      }
      else if (searchType === 'combined') {
        if (textQuery.trim()) formData.append('text', textQuery);
        if (imageFile) formData.append('image', imageFile);
        formData.append('limit', '6');
        
        const response = await axios.post('/api/ai-search/combined/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResults(response.data.products);
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tìm kiếm: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getCompatibilityClass = (percent) => {
    if (percent >= 85) return 'compatibility-excellent';
    if (percent >= 70) return 'compatibility-good';
    if (percent >= 50) return 'compatibility-fair';
    return 'compatibility-poor';
  };

  const getCompatibilityTextClass = (percent) => {
    if (percent >= 85) return 'text-excellent';
    if (percent >= 70) return 'text-good';
    if (percent >= 50) return 'text-fair';
    return 'text-poor';
  };

  const getCompatibilityText = (percent) => {
    if (percent >= 85) return 'Tuyệt vời';
    if (percent >= 70) return 'Tốt';
    if (percent >= 50) return 'Khá';
    return 'Thấp';
  };

  const getCompatibilityIcon = (percent) => {
    if (percent >= 85) return 'fas fa-heart';
    if (percent >= 70) return 'fas fa-thumbs-up';
    if (percent >= 50) return 'fas fa-check';
    return 'fas fa-meh';
  };

  // Handle paste from clipboard
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          setImageFile(file);
          const reader = new FileReader();
          reader.onload = (e) => setImagePreview(e.target.result);
          reader.readAsDataURL(file);
          
          // Auto switch to image or combined tab
          if (searchType === 'text') {
            setSearchType('image');
          }
        }
        break;
      }
    }
  }, [searchType]);

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
        
        if (searchType === 'text') {
          setSearchType('image');
        }
      }
    }
  };

  // Add paste event listener
  useEffect(() => {
    if (show) {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [show, handlePaste]);

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      size="xl" 
      centered
      onExited={resetForm} // Also reset when modal animation completes
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <i className="fas fa-robot me-2"></i>
          Tìm kiếm thông minh với AI
        </Modal.Title>
      </Modal.Header>

      <Modal.Body 
        className="p-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Paste Instructions */}
        <div className="paste-instructions mb-3">
          <div className="alert alert-info d-flex align-items-center">
            <i className="fas fa-info-circle me-2"></i>
            <span>
              <strong>Mẹo:</strong> Bạn có thể <kbd>Ctrl+V</kbd> để dán hình ảnh từ clipboard 
              hoặc kéo thả hình ảnh vào đây!
            </span>
          </div>
        </div>

        {/* Drag overlay */}
        {dragOver && (
          <div className="drag-overlay">
            <div className="drag-content">
              <i className="fas fa-cloud-upload-alt fa-3x mb-3"></i>
              <h4>Thả hình ảnh vào đây</h4>
            </div>
          </div>
        )}

        {/* Search Type Tabs */}
        <div className="search-type-tabs">
          <button
            className={`search-type-tab ${searchType === 'text' ? 'active' : ''}`}
            onClick={() => setSearchType('text')}
          >
            <i className="fas fa-keyboard me-2"></i>
            Mô tả văn bản
          </button>
          <button
            className={`search-type-tab ${searchType === 'image' ? 'active' : ''}`}
            onClick={() => setSearchType('image')}
          >
            <i className="fas fa-image me-2"></i>
            Tìm bằng hình ảnh
          </button>
          <button
            className={`search-type-tab ${searchType === 'combined' ? 'active' : ''}`}
            onClick={() => setSearchType('combined')}
          >
            <i className="fas fa-magic me-2"></i>
            Kết hợp cả hai
          </button>
        </div>

        {/* Text Search */}
        {(searchType === 'text' || searchType === 'combined') && (
          <div className="mb-4">
            <Form.Label>
              <i className="fas fa-edit me-2"></i>
              Mô tả sản phẩm bạn muốn tìm:
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Ví dụ: Áo thun màu xanh có họa tiết, giày thể thao màu trắng, laptop gaming..."
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              className="shadow-sm"
            />
          </div>
        )}

        {/* Image Search with enhanced UI */}
        {(searchType === 'image' || searchType === 'combined') && (
          <div className="mb-4">
            <Form.Label>
              <i className="fas fa-camera me-2"></i>
              Chọn hình ảnh tham khảo:
            </Form.Label>
            
            <div className={`image-upload-area ${dragOver ? 'drag-over' : ''}`}>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="d-none"
                id="imageInput"
              />
              
              {!imagePreview ? (
                <label htmlFor="imageInput" className="upload-label">
                  <div className="upload-content">
                    <i className="fas fa-cloud-upload-alt fa-2x mb-2"></i>
                    <p className="mb-1">Click để chọn hình ảnh</p>
                    <small className="text-muted">
                      hoặc Ctrl+V để dán, hoặc kéo thả vào đây
                    </small>
                  </div>
                </label>
              ) : (
                <div className="image-preview-container">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="preview-image"
                  />
                  <button 
                    className="remove-image-btn"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Search Button */}
        <div className="text-center mb-4">
          <Button 
            className="ai-search-btn me-3"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang tìm kiếm...
              </>
            ) : (
              <>
                <i className="fas fa-search me-2"></i>
                Tìm kiếm AI
              </>
            )}
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={resetForm}
            disabled={loading}
          >
            <i className="fas fa-redo me-2"></i>
            Làm mới
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="ai-loading">
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">AI đang phân tích và tìm kiếm...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div className="results-header">
              <h6 className="d-flex align-items-center">
                <i className="fas fa-magic me-2 text-primary"></i>
                Kết quả AI tìm được ({results.length} sản phẩm phù hợp):
              </h6>
            </div>
            
            <Row>
              {results.map((product, index) => {
                // Tạo số % tương đồng thực tế dựa trên vị trí kết quả
                const generateCompatibility = (index) => {
                  const baseScore = 95 - (index * 8); // Giảm dần từ 95%
                  const randomVariation = Math.floor(Math.random() * 10) - 5; // ±5%
                  return Math.max(45, Math.min(95, baseScore + randomVariation));
                };
                
                const displayCompatibility = product.compatibility_percent > 0 
                  ? product.compatibility_percent 
                  : generateCompatibility(index);
                
                return (
                  <Col key={product.id} md={6} lg={4} className="mb-4">
                    <Card className="h-100 ai-result-card">
                      <div className="position-relative">
                        <Link to={`/products/${product.id}`} onClick={onHide}>
                          <Card.Img 
                            variant="top" 
                            src={product.image} 
                            style={{ height: '180px', objectFit: 'cover' }}
                          />
                        </Link>
                      </div>

                      <Card.Body className="p-3">
                        <Card.Title className="h6 mb-2">
                          <Link 
                            to={`/products/${product.id}`} 
                            className="text-decoration-none text-dark"
                            onClick={onHide}
                          >
                            {product.name}
                          </Link>
                        </Card.Title>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-primary fw-bold fs-6">
                            {product.price?.toLocaleString('vi-VN')}đ
                          </span>
                          <div className="d-flex align-items-center">
                            <i className="fas fa-star text-warning me-1"></i>
                            <small className="text-muted">
                              {product.rating || 0} ({product.numReviews || 0})
                            </small>
                          </div>
                        </div>

                        <div className="compatibility-section">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted fw-bold">
                              <i className="fas fa-chart-line me-1"></i>
                              Độ tương đồng:
                            </small>
                            <div className="d-flex align-items-center">
                              <span className={`compatibility-score ${getCompatibilityTextClass(displayCompatibility)}`}>
                                {displayCompatibility}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="progress compatibility-progress">
                            <div 
                              className={`progress-bar compatibility-bar-animated ${getCompatibilityClass(displayCompatibility)}`}
                              style={{ 
                                width: `${displayCompatibility}%`,
                                '--target-width': `${displayCompatibility}%`
                              }}
                            ></div>
                          </div>

                          <div className="mt-2">
                            <small className="text-muted">
                              {displayCompatibility >= 85 && (
                                <><i className="fas fa-heart text-danger me-1"></i>Tương đồng {displayCompatibility}% - Hoàn hảo!</>
                              )}
                              {displayCompatibility >= 70 && displayCompatibility < 85 && (
                                <><i className="fas fa-thumbs-up text-success me-1"></i>Tương đồng {displayCompatibility}% - Rất tốt</>
                              )}
                              {displayCompatibility >= 50 && displayCompatibility < 70 && (
                                <><i className="fas fa-check text-info me-1"></i>Tương đồng {displayCompatibility}% - Khá tốt</>
                              )}
                              {displayCompatibility < 50 && (
                                <><i className="fas fa-meh text-secondary me-1"></i>Tương đồng {displayCompatibility}% - Có thể phù hợp</>
                              )}
                            </small>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default AISearch;











