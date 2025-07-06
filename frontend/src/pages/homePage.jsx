import React, { useContext, useEffect, useState } from "react";
import { Row, Col, Container, Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import Product from "../components/product";
import ProductsContext from "../context/productsContext";
import Loader from "../components/loader";
import Message from "../components/message";
import AdminRedirect from '../components/AdminRedirect';
import "../styles/homePage.css";

function HomePage() {
  const { products, loading, error, loadProducts, productsLoaded, brands, categories } = useContext(ProductsContext);
  
  useEffect(() => {
    if (!productsLoaded) loadProducts();
    window.scrollTo(0, 0);
  }, [productsLoaded, loadProducts]);

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  // Sản phẩm bán chạy
  const bestSellingProducts = [...products]
    .sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0))
    .slice(0, 8);

  // Sản phẩm được đánh giá cao
  const topRatedProducts = [...products]
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 8);

  // Sản phẩm mới
  const newProducts = [...products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  // Sản phẩm giảm giá (giả định - có thể thay đổi logic này)
  const discountedProducts = [...products]
    .filter(product => product.price < 500000)
    .slice(0, 8);

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <AdminRedirect>
      <div className="home-page">
        {/* Main Banner */}
        <div className="main-banner">
          <Container>
            <Row className="align-items-center">
              <Col md={6} className="banner-content">
                <h1>Mua sắm thông minh, trải nghiệm tuyệt vời</h1>
                <p>Khám phá hàng ngàn sản phẩm chất lượng với giá ưu đãi hấp dẫn</p>
                <Link to="/search" className="btn btn-primary">KHÁM PHÁ NGAY</Link>
              </Col>
              <Col md={6} className="banner-image">
                <img src="/images/banner-products.jpg" alt="Sản phẩm nổi bật" className="img-fluid" />
              </Col>
            </Row>
          </Container>
        </div>

        {/* Category Icons */}
        <Container className="category-icons-container">
          <div className="category-icons">
            <Row>
              {categories.slice(0, 8).map(category => (
                <Col key={category.id} xs={3} sm={3} md={3} lg={1} className="category-icon-col">
                  <Link to={`/search?category=${category.id}`} className="category-icon-link">
                    <div className="category-icon">
                      <img src={category.image || '/images/placeholder.png'} alt={category.title} />
                    </div>
                    <p>{category.title}</p>
                  </Link>
                </Col>
              ))}
            </Row>
          </div>
        </Container>

        {/* Best Selling Products */}
        <section className="products-section">
          <Container>
            <div className="section-header">
              <h2>Sản Phẩm Bán Chạy</h2>
              <Link to="/search?sort=sold-desc" className="view-all">Xem Tất Cả</Link>
            </div>
            <Row>
              {bestSellingProducts.slice(0, 4).map(product => (
                <Col key={product.id} xs={6} md={4} lg={3} className="mb-4">
                  <Card className="product-card">
                    {product.total_sold > 10 && (
                      <div className="product-badge bestseller">
                        <Badge bg="danger">Bán Chạy</Badge>
                      </div>
                    )}
                    <Link to={`/products/${product.id}`}>
                      <Card.Img variant="top" src={product.image} alt={product.name} />
                    </Link>
                    <Card.Body>
                      <Link to={`/products/${product.id}`} className="product-name">
                        {product.name}
                      </Link>
                      <div className="product-price">
                        {formatPrice(product.price)}
                      </div>
                      <div className="product-rating">
                        <i className="fas fa-star"></i> {product.rating || 0} | Đã bán {product.total_sold || 0}
                      </div>
                      <Link to={`/products/${product.id}`} className="btn btn-sm btn-outline-primary w-100 mt-2">
                        Xem Chi Tiết
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        {/* Promotional Banners */}
        <section className="promo-banners">
          <Container>
            <Row>
              <Col md={6} className="mb-4">
                <div className="promo-banner">
                  <div className="promo-content">
                    <h3>Mua sắm thực phẩm dễ dàng cùng chúng tôi</h3>
                    <Link to="/search" className="btn btn-sm btn-light">Mua Ngay</Link>
                  </div>
                  <img src="/images/grocery-banner.jpg" alt="Mua sắm thực phẩm" />
                </div>
              </Col>
              <Col md={6} className="mb-4">
                <div className="promo-banner">
                  <div className="promo-content">
                    <h3>Nhận các sản phẩm thiết yếu hàng ngày</h3>
                    <Link to="/search" className="btn btn-sm btn-light">Mua Ngay</Link>
                  </div>
                  <img src="/images/essentials-banner.jpg" alt="Sản phẩm thiết yếu" />
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Top Rated Products */}
        <section className="products-section bg-light">
          <Container>
            <div className="section-header">
              <h2>Sản Phẩm Đánh Giá Cao</h2>
              <Link to="/search?sort=rating-desc" className="view-all">Xem Tất Cả</Link>
            </div>
            <Row>
              {topRatedProducts.slice(0, 4).map(product => (
                <Col key={product.id} xs={6} md={4} lg={3} className="mb-4">
                  <Card className="product-card">
                    {product.rating >= 4.5 && (
                      <div className="product-badge">
                        <Badge bg="success">Đánh Giá Cao</Badge>
                      </div>
                    )}
                    <Link to={`/products/${product.id}`}>
                      <Card.Img variant="top" src={product.image} alt={product.name} />
                    </Link>
                    <Card.Body>
                      <Link to={`/products/${product.id}`} className="product-name">
                        {product.name}
                      </Link>
                      <div className="product-price">
                        {formatPrice(product.price)}
                      </div>
                      <div className="product-rating">
                        <i className="fas fa-star"></i> {product.rating || 0}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        {/* New Arrivals */}
        <section className="products-section">
          <Container>
            <div className="section-header">
              <h2>Sản Phẩm Mới</h2>
              <Link to="/search" className="view-all">Xem Tất Cả</Link>
            </div>
            <Row>
              {newProducts.slice(0, 4).map(product => (
                <Col key={product.id} xs={6} md={4} lg={3} className="mb-4">
                  <Card className="product-card">
                    <div className="product-badge">
                      <Badge bg="primary">Mới</Badge>
                    </div>
                    <Link to={`/products/${product.id}`}>
                      <Card.Img variant="top" src={product.image} alt={product.name} />
                    </Link>
                    <Card.Body>
                      <Link to={`/products/${product.id}`} className="product-name">
                        {product.name}
                      </Link>
                      <div className="product-price">
                        {formatPrice(product.price)}
                      </div>
                      <div className="product-rating">
                        <i className="fas fa-star"></i> {product.rating || 0}
                      </div>
                      <Link to={`/products/${product.id}`} className="btn btn-sm btn-outline-primary w-100 mt-2">
                        Xem Chi Tiết
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        {/* Featured Brands */}
        <section className="brands-section">
          <Container>
            <div className="section-header">
              <h2>Thương Hiệu Nổi Bật</h2>
            </div>
            <div className="brands-slider">
              <Row>
                {brands.slice(0, 6).map(brand => (
                  <Col key={brand.id} xs={4} md={2} className="mb-4">
                    <Link to={`/search?brand=${brand.id}`} className="brand-item">
                      <img src={brand.image || '/images/placeholder.png'} alt={brand.title} />
                    </Link>
                  </Col>
                ))}
              </Row>
            </div>
          </Container>
        </section>

        {/* Blog Posts */}
        <section className="blog-section">
          <Container>
            <div className="section-header">
              <h2>Tin Tức Cửa Hàng</h2>
            </div>
            <Row>
              <Col md={3} className="mb-4">
                <Card className="blog-card">
                  <Card.Img variant="top" src="/images/blog1.jpg" alt="Bài viết blog" />
                  <Card.Body>
                    <Card.Title>Mẹo cho thói quen ăn uống lành mạnh</Card.Title>
                    <Card.Text>
                      Tìm hiểu cách duy trì chế độ ăn uống cân bằng với các sản phẩm của chúng tôi.
                    </Card.Text>
                    <Link to="#" className="read-more">Đọc Thêm</Link>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} className="mb-4">
                <Card className="blog-card">
                  <Card.Img variant="top" src="/images/blog2.jpg" alt="Bài viết blog" />
                  <Card.Body>
                    <Card.Title>Mẹo nấu ăn từ đầu bếp của chúng tôi</Card.Title>
                    <Card.Text>
                      Mẹo nấu ăn chuyên nghiệp để làm các món ăn ngon tại nhà.
                    </Card.Text>
                    <Link to="#" className="read-more">Đọc Thêm</Link>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} className="mb-4">
                <Card className="blog-card">
                  <Card.Img variant="top" src="/images/blog3.jpg" alt="Bài viết blog" />
                  <Card.Body>
                    <Card.Title>Cách tiết kiệm tiền khi mua sắm</Card.Title>
                    <Card.Text>
                      Chiến lược mua sắm thông minh để tối đa hóa ngân sách của bạn.
                    </Card.Text>
                    <Link to="#" className="read-more">Đọc Thêm</Link>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} className="mb-4">
                <Card className="blog-card">
                  <Card.Img variant="top" src="/images/blog4.jpg" alt="Bài viết blog" />
                  <Card.Body>
                    <Card.Title>Sản phẩm theo mùa bạn nên thử</Card.Title>
                    <Card.Text>
                      Khám phá những sản phẩm theo mùa tốt nhất hiện có.
                    </Card.Text>
                    <Link to="#" className="read-more">Đọc Thêm</Link>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Newsletter */}
        <section className="newsletter-section">
          <Container>
            <Row className="justify-content-center">
              <Col md={8} className="text-center">
                <h3>Đăng ký nhận bản tin của chúng tôi để được giảm 5%</h3>
                <p>Nhận thông tin cập nhật mới nhất về sản phẩm mới và khuyến mãi sắp tới</p>
                <div className="newsletter-form">
                  <input type="email" placeholder="Địa chỉ email của bạn" />
                  <Button variant="primary">Đăng Ký</Button>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      </div>
    </AdminRedirect>
  );
}

export default HomePage;
