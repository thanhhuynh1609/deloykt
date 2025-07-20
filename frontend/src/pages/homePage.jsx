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
        {/* Main Banner mới */}
       <div
  className="main-banner hero-banner"
  style={{
    backgroundImage: `url(${process.env.PUBLIC_URL}/images/Rectangle2.png)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    color: '#fff',
    position: 'relative',
  }}
>
  {/* overlay duy nhất */}

  <Container className="position-relative z-2">
    <div className="banner-content-wrapper text-start">
      <h1 className="display-4 fw-bold">
        FIND CLOTHES <br /> THAT MATCHES <br />YOUR STYLE
      </h1>
      <p className="banner-description mt-3 fs-5">
  Browse through our diverse range of meticulously crafted garments,<br />
  designed to bring out your individuality and cater to your sense of style.
</p>

      <Link to="/search" className="btn btn-light rounded-pill px-4 py-2 mt-3">
        SHOP NOW
        </Link>
       <Row className="stats-row stats-row-custom mt-5">
  <Col xs={4} className="text-center">
    <h5 className="fw-bold stat-number">200+</h5>
    <small className="stat-label">International Brands</small>
  </Col>
  <Col xs={4} className="text-center">
    <h5 className="fw-bold stat-number">2,000+</h5>
    <small className="stat-label">High-Quality Products</small>
  </Col>
  <Col xs={4} className="text-center">
    <h5 className="fw-bold stat-number">30,000+</h5>
    <small className="stat-label">Happy Customers</small>
  </Col>
</Row>

    </div>
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

    
{/* Browse by Dress Style */}
{/* <section className="dress-style-section py-5" style={{ backgroundColor: "#f2f2f2", borderRadius: "20px", margin: "40px 0" }}>
  <Container>
    <div style={{
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      maxWidth: "100%",
      margin: "0 auto"
    }}>
      <img 
        src="/images/Frame60.png" 
        alt="Dress Style" 
        style={{ width: "100%", height: "auto", display: "block" }} 
      />
    </div>
  </Container>
</section> */}



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

      {/* Customer Reviews */}
<section className="testimonial-section py-5">
  <Container>
    <div className="section-header text-center mb-4">
      <h2 className="fw-bold">OUR HAPPY CUSTOMERS</h2>
    </div>
    <Row className="justify-content-center">
      <Col md={4} className="mb-4">
        <Card className="h-100 p-3 shadow-sm border">
          <div className="d-flex align-items-center mb-2">
            <h5 className="mb-0 fw-bold">Sarah M.</h5>
            <i className="fas fa-check-circle text-success ms-2"></i>
          </div>
          <div className="text-warning mb-2">
            ★★★★★
          </div>
          <p className="mb-0">
            "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has <strong>exceeded my expectations</strong>."
          </p>
        </Card>
      </Col>
      <Col md={4} className="mb-4">
        <Card className="h-100 p-3 shadow-sm border">
          <div className="d-flex align-items-center mb-2">
            <h5 className="mb-0 fw-bold">Alex K.</h5>
          </div>
          <div className="text-warning mb-2">
            ★★★★★
          </div>
          <p className="mb-0">
            "Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co..."
          </p>
        </Card>
      </Col>
      <Col md={4} className="mb-4">
        <Card className="h-100 p-3 shadow-sm border">
          <div className="d-flex align-items-center mb-2">
            <h5 className="mb-0 fw-bold">James L.</h5>
            <i className="fas fa-check-circle text-success ms-2"></i>
          </div>
          <div className="text-warning mb-2">
            ★★★★★
          </div>
          <p className="mb-0">
            "As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co..."
          </p>
        </Card>
      </Col>
    </Row>
  </Container>
</section>


       {/* Newsletter Section */}
<section className="newsletter-section bg-dark text-white py-5">
  <Container>
    <Row className="justify-content-center text-center">
      <Col lg={8}>
        <h3 className="fw-bold text-uppercase">
          Stay up to date about <br /> our latest offers
        </h3>
        <div className="d-flex justify-content-center mt-4 gap-2 flex-column flex-sm-row">
          <input
            type="email"
            className="form-control rounded-pill px-3"
            placeholder="Enter your email address"
            style={{ maxWidth: '300px' }}
          />
          <Button variant="light" className="rounded-pill px-4">
            Subscribe to Newsletter
          </Button>
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
