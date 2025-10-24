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
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
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
    image: null,
    has_variants: false
  });
  const [variants, setVariants] = useState([]);
  const [imagePreview, setImagePreview] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, brandsRes, colorsRes, sizesRes] = await Promise.all([
        httpService.get('/api/products/'),
        httpService.get('/api/category/'),
        httpService.get('/api/brands/'),
        httpService.get('/api/colors/'),
        httpService.get('/api/sizes/')
      ]);

      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setBrands(brandsRes.data);
      setColors(colorsRes.data);
      setSizes(sizesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = async (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        countInStock: product.countInStock || '',
        brand: product.brand || '',
        category: product.category || '',
        image: null,
        has_variants: product.has_variants || false
      });

      // Load variants nếu có
      if (product.has_variants) {
        try {
          const variantsRes = await httpService.get(`/api/product-variants/?product=${product.id}`);
          const formattedVariants = variantsRes.data.map(variant => ({
            id: variant.id,
            color: variant.color.id,
            size: variant.size.id,
            price: variant.price,
            stock_quantity: variant.stock_quantity,
            isNew: false
          }));
          setVariants(formattedVariants);
        } catch (error) {
          console.error('Error loading variants:', error);
          setVariants([]);
        }
      } else {
        setVariants([]);
      }

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
        image: null,
        has_variants: false
      });
      setVariants([]);
      setImagePreview('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setVariants([]);
    setImagePreview('');
  };

  const handleInputChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (name === 'image') {
      const file = files[0];
      console.log('Image file selected:', file);

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Create preview URL
      if (file) {
        console.log('Creating image preview...');
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('Image preview created:', reader.result);
          setImagePreview(reader.result);
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
        };
        reader.readAsDataURL(file);
      } else {
        console.log('No file selected, clearing preview');
        setImagePreview('');
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));

      // Reset variants khi tắt has_variants
      if (name === 'has_variants' && !checked) {
        setVariants([]);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Thêm biến thể mới
  const addVariant = () => {
    setVariants(prev => [...prev, {
      id: Date.now(), // temporary ID
      color: '',
      size: '',
      price: '',
      stock_quantity: '',
      isNew: true
    }]);
  };

  // Xóa biến thể
  const removeVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  // Cập nhật biến thể
  const updateVariant = (index, field, value) => {
    setVariants(prev => prev.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    ));
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
      formDataToSend.append('has_variants', formData.has_variants);

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      let productResponse;
      if (editingProduct) {
        productResponse = await httpService.put(`/api/products/${editingProduct.id}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        productResponse = await httpService.post('/api/products/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Nếu có biến thể, lưu biến thể
      if (formData.has_variants && variants.length > 0) {
        const productId = editingProduct ? editingProduct.id : productResponse.data.id;

        // Xóa biến thể cũ nếu đang edit
        if (editingProduct) {
          try {
            const existingVariants = await httpService.get(`/api/product-variants/?product=${productId}`);
            for (const variant of existingVariants.data) {
              await httpService.delete(`/api/product-variants/${variant.id}/`);
            }
          } catch (error) {
            console.error('Error deleting existing variants:', error);
          }
        }

        // Thêm biến thể mới
        for (const variant of variants) {
          if (variant.color && variant.size && variant.price && variant.stock_quantity) {
            try {
              console.log('Creating variant:', {
                product: productId,
                color_id: parseInt(variant.color),
                size_id: parseInt(variant.size),
                price: parseFloat(variant.price),
                stock_quantity: parseInt(variant.stock_quantity)
              });

              await httpService.post('/api/product-variants/', {
                product: productId,
                color_id: parseInt(variant.color),
                size_id: parseInt(variant.size),
                price: parseFloat(variant.price),
                stock_quantity: parseInt(variant.stock_quantity)
              });
            } catch (error) {
              console.error('Error creating variant:', error);
              console.error('Variant data:', variant);
            }
          }
        }
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

  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortProducts = (products, field, order) => {
    return [...products].sort((a, b) => {
      let valueA, valueB;
      
      switch (field) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'price':
          valueA = Number(a.price);
          valueB = Number(b.price);
          break;
        case 'countInStock':
          valueA = Number(a.countInStock);
          valueB = Number(b.countInStock);
          break;
        case 'rating':
          valueA = Number(a.rating || 0);
          valueB = Number(b.rating || 0);
          break;
        case 'total_sold':
          valueA = Number(a.total_sold || 0);
          valueB = Number(b.total_sold || 0);
          break;
        default:
          valueA = a[field];
          valueB = b[field];
      }
      
      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      return 0;
    });
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
                <h5 className="mb-0">Quản lý sản phẩ  m</h5>
                <Button 
                  variant="primary" 
                  onClick={() => handleShowModal()}
                >
                  <i className="fas fa-plus me-2"></i>
                  Thêm sản phẩm
                </Button>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')}>
                        ID
                        {sortField === 'id' && (
                          <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th>Image</th>
                      <th onClick={() => handleSort('brand')}>
                        Tên
                        {sortField === 'name' && (
                          <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('brand')}>
                        Thương hiệu
                        {sortField === 'brand' && (
                          <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('category')}>
                        Loại
                        {sortField === 'category' && (
                          <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('price')}>
                        Giá
                        {sortField === 'price' && (
                          <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('countInStock')}>
                        Số lượng
                        {sortField === 'countInStock' && (
                          <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('rating')}>
                        Rating
                        {sortField === 'rating' && (
                          <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('total_sold')}>
                        Đã bán
                        {sortField === 'total_sold' && (
                          <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortProducts(products, sortField, sortOrder).map(product => (
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
                          {product.has_variants && (
                            <div className="mt-1">
                              <Badge bg="secondary" className="me-1">
                                <i className="fas fa-tags me-1"></i>
                                Có biến thể
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td>{getBrandName(product.brand)}</td>
                        <td>{getCategoryName(product.category)}</td>
                        <td>
                          {product.has_variants ? (
                            <div>
                              <span className="text-muted">Từ </span>
                              {formatVND(product.min_price || product.price)}
                            </div>
                          ) : (
                            formatVND(product.price)
                          )}
                        </td>
                        <td>
                          <Badge
                            bg={product.has_variants ?
                              (product.total_stock > 0 ? 'success' : 'danger') :
                              (product.countInStock > 0 ? 'success' : 'danger')
                            }
                          >
                            {product.has_variants ? product.total_stock : product.countInStock}
                          </Badge>
                          {product.has_variants && (
                            <div>
                              <small className="text-muted">Tổng biến thể</small>
                            </div>
                          )}
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
                          <Badge 
                            bg="info"
                          >
                            {product.total_sold || 0}
                          </Badge>
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
                <Form.Check
                  type="checkbox"
                  name="has_variants"
                  label="Sản phẩm có biến thể (màu sắc, kích cỡ)"
                  checked={formData.has_variants}
                  onChange={handleInputChange}
                />
              </Form.Group>

              {/* Quản lý biến thể */}
              {formData.has_variants && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Biến thể sản phẩm</h6>
                    <Button variant="outline-primary" size="sm" onClick={addVariant}>
                      <i className="fas fa-plus me-1"></i>
                      Thêm biến thể
                    </Button>
                  </div>

                  {variants.map((variant, index) => (
                    <div key={variant.id || index} className="border rounded p-3 mb-3">
                      <Row>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Màu sắc</Form.Label>
                            <Form.Select
                              value={variant.color}
                              onChange={(e) => updateVariant(index, 'color', e.target.value)}
                              required
                            >
                              <option value="">Chọn màu</option>
                              {colors.map(color => (
                                <option key={color.id} value={color.id}>
                                  {color.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Kích cỡ</Form.Label>
                            <Form.Select
                              value={variant.size}
                              onChange={(e) => updateVariant(index, 'size', e.target.value)}
                              required
                            >
                              <option value="">Chọn size</option>
                              {sizes.map(size => (
                                <option key={size.id} value={size.id}>
                                  {size.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={2}>
                          <Form.Group>
                            <Form.Label>Giá (VND)</Form.Label>
                            <Form.Control
                              type="number"
                              value={variant.price}
                              onChange={(e) => updateVariant(index, 'price', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2}>
                          <Form.Group>
                            <Form.Label>Tồn kho</Form.Label>
                            <Form.Control
                              type="number"
                              value={variant.stock_quantity}
                              onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeVariant(index)}
                            className="mb-3"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  ))}

                  {variants.length === 0 && (
                    <div className="text-center text-muted py-3">
                      <i className="fas fa-info-circle me-2"></i>
                      Chưa có biến thể nào. Nhấn "Thêm biến thể" để bắt đầu.
                    </div>
                  )}
                </div>
              )}

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
