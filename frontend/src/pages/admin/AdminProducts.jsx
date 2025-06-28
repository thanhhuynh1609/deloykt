import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Modal, Form } from 'react-bootstrap';
import AdminLayout from '../../components/admin/AdminLayout';
import httpService from '../../services/httpService';
import './AdminProducts.css';
import { formatVND } from '../../utils/currency';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    countInStock: '',
    brand: '',
    category: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        httpService.get('/api/products/'),
        httpService.get('/api/category/'),
        httpService.get('/api/brands/')
      ]);

      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setBrands(brandsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        countInStock: product.countInStock || '',
        brand: product.brand || '',
        category: product.category || '',
        image: null
      });
      setImagePreview(product.image || '');
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        countInStock: '',
        brand: '',
        category: '',
        image: null
      });
      setImagePreview('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImagePreview('');
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview URL
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('countInStock', formData.countInStock);
      formDataToSend.append('brand', formData.brand);
      formDataToSend.append('category', formData.category);

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      if (editingProduct) {
        await httpService.put(`/api/products/${editingProduct.id}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await httpService.post('/api/products/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await httpService.delete(`/api/products/${productId}/`);
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    return brand ? brand.title : 'Unknown';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.title : 'Unknown';
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
                <h5 className="mb-0">Products Management</h5>
                <Button 
                  variant="primary" 
                  onClick={() => handleShowModal()}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Product
                </Button>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>
                          <img 
                            src={product.image || '/api/placeholder/50/50'} 
                            alt={product.name}
                            className="product-thumbnail"
                          />
                        </td>
                        <td>
                          <strong>{product.name}</strong>
                          <br />
                          <small className="text-muted">
                            {product.description?.substring(0, 50)}...
                          </small>
                        </td>
                        <td>{getBrandName(product.brand)}</td>
                        <td>{getCategoryName(product.category)}</td>
                        <td>{formatVND(product.price)}</td>
                        <td>
                          <Badge 
                            bg={product.countInStock > 0 ? 'success' : 'danger'}
                          >
                            {product.countInStock}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="me-1">{product.rating || 0}</span>
                            <i className="fas fa-star text-warning"></i>
                            <small className="text-muted ms-1">
                              ({product.numReviews || 0})
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleShowModal(product)}
                              className="me-1"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
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

        {/* Add/Edit Product Modal */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price (VND)</Form.Label>
                    <Form.Control
                      type="number"
                      step="1"
                      min="0"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Enter price in VND (e.g., 1500000)"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Brand</Form.Label>
                    <Form.Select
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Brand</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Stock Count</Form.Label>
                <Form.Control
                  type="number"
                  name="countInStock"
                  value={formData.countInStock}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Product Image</Form.Label>
                <Form.Control
                  type="file"
                  name="image"
                  onChange={handleInputChange}
                  accept="image/*"
                />
                {editingProduct && editingProduct.image && !imagePreview && (
                  <div className="mt-2">
                    <p>Current image:</p>
                    <img
                      src={editingProduct.image}
                      alt={editingProduct.name}
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    />
                  </div>
                )}
                {imagePreview && (
                  <div className="mt-2">
                    <p>New image preview:</p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'cover',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                )}
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
