import React, { useEffect, useState, useContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Image,
  ListGroup,
  Button,
  Card,
  Form,
  Container,
  Breadcrumb,
  Tabs,
  Tab,
  Badge,
} from "react-bootstrap";
import Rating from "../components/rating";
import ProductsContext from "../context/productsContext";
import Loader from "../components/loader";
import Message from "../components/message";
import CartContext from "../context/cartContext";
import ReviewsList from "../components/reviewsList";
import { formatVND } from "../utils/currency";
import { FavoriteContext } from '../context/favoriteContext';
import UserContext from '../context/userContext';
import "../styles/productPage.css";

function ProductPage(props) {
  const { id } = useParams();
  const { error, loadProduct } = useContext(ProductsContext);
  const { addItemToCart } = useContext(CartContext);
  const { isFavorite, addToFavorites, removeFromFavorites } = useContext(FavoriteContext);
  const { userInfo } = useContext(UserContext);
  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const productData = await loadProduct(id);
      setProduct(productData);
      setLoading(false);
      window.scrollTo(0, 0);
    };
    fetchData();
  }, [id]);

  const addToCartHandler = () => {
    addItemToCart(Number(id), Number(qty));
    navigate(`/cart`);
  };

  const handleFavoriteToggle = () => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites(product.id);
    }
  };

  const handleImageClick = (index) => {
    setSelectedImage(index);
  };

  // Giả lập nhiều hình ảnh sản phẩm
  const productImages = product.image ? [
    product.image,
    product.image,
    product.image
  ] : [];

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  if (product && product.id)
    return (
      <div className="product-detail-page">
        <Container>
          {/* Breadcrumb */}
          <Breadcrumb className="product-breadcrumb">
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/search" }}>Sản phẩm</Breadcrumb.Item>
            <Breadcrumb.Item active>{product.name}</Breadcrumb.Item>
          </Breadcrumb>

          <Row>
            {/* Product Images */}
            <Col lg={5} md={6}>
              <div className="product-images">
                <div className="main-image">
                  <Image 
                    src={productImages[selectedImage] || product.image} 
                    alt={product.name} 
                    fluid 
                  />
                </div>
                {productImages.length > 1 && (
                  <div className="thumbnail-images">
                    {productImages.map((img, index) => (
                      <div 
                        key={index} 
                        className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                        onClick={() => handleImageClick(index)}
                      >
                        <Image src={img} alt={`${product.name} - ${index + 1}`} fluid />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Col>

            {/* Product Info */}
            <Col lg={7} md={6}>
              <div className="product-info">
                <h1 className="product-title">{product.name}</h1>
                
                <div className="product-meta">
                  <div className="product-rating-wrapper">
                    <Rating
                      value={product.rating}
                      text={`${product.numReviews} đánh giá`}
                      color={"#f8e825"}
                    />
                    <span className="rating-value">{product.rating ? Number(product.rating).toFixed(1) : "0.0"}</span>
                  </div>
                  <div className="product-sold">
                    <i className="fas fa-shopping-cart"></i> Đã bán {product.total_sold || 0}
                  </div>
                </div>

                <div className="product-price">
                  <span className="current-price">{formatVND(product.price)}</span>
                  {product.oldPrice && (
                    <span className="old-price">{formatVND(product.oldPrice)}</span>
                  )}
                </div>

                <div className="product-status">
                  <span className="status-label">Trạng thái:</span>
                  <span className={`status-value ${product.countInStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {product.countInStock > 0 ? 'Còn hàng' : 'Hết hàng'}
                  </span>
                </div>

                {product.countInStock > 0 && (
                  <div className="product-quantity">
                    <span className="quantity-label">Số lượng:</span>
                    <div className="quantity-control">
                      <Button 
                        variant="outline-secondary" 
                        className="qty-btn"
                        onClick={() => qty > 1 && setQty(qty - 1)}
                      >
                        <i className="fas fa-minus"></i>
                      </Button>
                      <Form.Control
                        type="text"
                        value={qty}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value > 0 && value <= product.countInStock) {
                            setQty(value);
                          }
                        }}
                        min="1"
                        max={product.countInStock}
                        readOnly
                      />
                      <Button 
                        variant="outline-secondary" 
                        className="qty-btn"
                        onClick={() => qty < product.countInStock && setQty(qty + 1)}
                      >
                        <i className="fas fa-plus"></i>
                      </Button>
                    </div>
                  </div>
                )}

                <div className="product-actions">
                  <Button 
                    variant="primary" 
                    className="btn-add-to-cart"
                    onClick={addToCartHandler}
                    disabled={product.countInStock === 0}
                  >
                    <i className="fas fa-shopping-cart"></i> Thêm vào giỏ hàng
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    className="btn-buy-now"
                    onClick={() => {
                      addToCartHandler();
                      navigate('/shipping');
                    }}
                    disabled={product.countInStock === 0}
                  >
                    Mua ngay
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    className="btn-favorite"
                    onClick={handleFavoriteToggle}
                  >
                    <i className={`${isFavorite(product.id) ? 'fas' : 'far'} fa-heart`}></i>
                  </Button>
                </div>

                <div className="product-delivery">
                  <div className="delivery-info">
                    <i className="fas fa-truck"></i>
                    <div>
                      <p>Giao hàng miễn phí</p>
                      <small>Cho đơn hàng từ 300.000đ</small>
                    </div>
                  </div>
                  <div className="delivery-info">
                    <i className="fas fa-undo"></i>
                    <div>
                      <p>Đổi trả dễ dàng</p>
                      <small>Trong vòng 7 ngày</small>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <Row className="mt-5">
            <Col>
              <Tabs defaultActiveKey="description" className="product-tabs">
                <Tab eventKey="description" title="Mô tả sản phẩm">
                  <div className="product-description">
                    <p>{product.description || 'Không có mô tả cho sản phẩm này.'}</p>
                  </div>
                </Tab>
                <Tab eventKey="reviews" title={`Đánh giá (${product.numReviews})`}>
                  <div className="product-reviews">
                    <div className="reviews-summary">
                      <div className="rating-average">
                        <h3>{product.rating ? Number(product.rating).toFixed(1) : "0.0"}</h3>
                        <Rating
                          value={product.rating}
                          text={`${product.numReviews} đánh giá`}
                          color={"#f8e825"}
                        />
                      </div>
                    </div>
                    <ReviewsList product={product}/>
                  </div>
                </Tab>
              </Tabs>
            </Col>
          </Row>

          {/* Related Products */}
          <Row className="mt-5">
            <Col>
              <h2 className="section-title">Sản phẩm liên quan</h2>
              <div className="related-products">
                <Row>
                  {[...Array(4)].map((_, idx) => (
                    <Col key={idx} xs={6} md={3}>
                      <Card className="product-card">
                        <Link to={`/products/${product.id}`}>
                          <Card.Img variant="top" src={product.image} />
                        </Link>
                        <Card.Body>
                          <Link to={`/products/${product.id}`} className="product-name">
                            {product.name}
                          </Link>
                          <div className="product-price">
                            {formatVND(product.price)}
                          </div>
                          <div className="product-rating">
                            <i className="fas fa-star"></i> {product.rating || 0}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );

  return <Message variant="danger">Không tìm thấy sản phẩm.</Message>;
}

export default ProductPage;
