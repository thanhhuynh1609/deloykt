import React, { useContext, useEffect, useState } from "react";
import { Row, Col, Container, Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import ProductsContext from "../context/productsContext";
import Loader from "../components/loader";
import Message from "../components/message";
import AdminRedirect from '../components/AdminRedirect';
import "../styles/homePage.css";
import AISearch from '../components/AISearch';

function HomePage() {
  const { products, loading, error, loadProducts, productsLoaded, brands, categories } = useContext(ProductsContext);
  
  // Di chuyển useState lên đầu component
  const [showAISearch, setShowAISearch] = useState(false);
  
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

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <AdminRedirect>
      <div className="home-page">
        {/* Main Banner */}
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
          {/* Hero content */}
          <div className="hero-content text-center">
            <h1 className="hero-title">Khám phá thế giới công nghệ</h1>
            <p className="hero-subtitle">Sản phẩm chất lượng cao với giá tốt nhất</p>
            <div className="hero-buttons mt-4">
              <Link to="/search" className="btn btn-light rounded-pill px-4 py-2 me-3">
                SHOP NOW
              </Link>
              <Button 
                variant="outline-light" 
                className="rounded-pill px-4 py-2"
                onClick={() => setShowAISearch(true)}
              >
                <i className="fas fa-camera me-2"></i>
                AI SEARCH
              </Button>
            </div>
          </div>
        </div>

        {/* Rest of your component content */}
        <Container className="py-5">
          {/* Sản phẩm bán chạy */}
          <section className="mb-5">
            <h2 className="section-title">Sản phẩm bán chạy</h2>
            <Row>
              {bestSellingProducts.map(product => (
                <Col key={product.id} sm={6} md={4} lg={3} className="mb-4">
                  <Card className="product-card h-100">
                    <Link to={`/products/${product.id}`}>
                      <Card.Img 
                        variant="top" 
                        src={product.image} 
                        className="product-image"
                      />
                    </Link>
                    <Card.Body>
                      <Card.Title className="product-title">
                        <Link to={`/products/${product.id}`}>
                          {product.name}
                        </Link>
                      </Card.Title>
                      <div className="product-price">
                        {formatPrice(product.price)}
                      </div>
                      <div className="product-rating">
                        <i className="fas fa-star"></i>
                        {product.rating || 0} ({product.numReviews || 0})
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>

          {/* Sản phẩm đánh giá cao */}
          <section className="mb-5">
            <h2 className="section-title">Sản phẩm được đánh giá cao</h2>
            <Row>
              {topRatedProducts.map(product => (
                <Col key={product.id} sm={6} md={4} lg={3} className="mb-4">
                  <Card className="product-card h-100">
                    <Link to={`/products/${product.id}`}>
                      <Card.Img 
                        variant="top" 
                        src={product.image} 
                        className="product-image"
                      />
                    </Link>
                    <Card.Body>
                      <Card.Title className="product-title">
                        <Link to={`/products/${product.id}`}>
                          {product.name}
                        </Link>
                      </Card.Title>
                      <div className="product-price">
                        {formatPrice(product.price)}
                      </div>
                      <div className="product-rating">
                        <i className="fas fa-star"></i>
                        {product.rating || 0} ({product.numReviews || 0})
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>

          {/* Sản phẩm mới */}
          <section className="mb-5">
            <h2 className="section-title">Sản phẩm mới</h2>
            <Row>
              {newProducts.map(product => (
                <Col key={product.id} sm={6} md={4} lg={3} className="mb-4">
                  <Card className="product-card h-100">
                    <Link to={`/products/${product.id}`}>
                      <Card.Img 
                        variant="top" 
                        src={product.image} 
                        className="product-image"
                      />
                    </Link>
                    <Card.Body>
                      <Card.Title className="product-title">
                        <Link to={`/products/${product.id}`}>
                          {product.name}
                        </Link>
                      </Card.Title>
                      <div className="product-price">
                        {formatPrice(product.price)}
                      </div>
                      <div className="product-rating">
                        <i className="fas fa-star"></i>
                        {product.rating || 0} ({product.numReviews || 0})
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>
        </Container>

        {/* AI Search Modal */}
        <AISearch 
          show={showAISearch} 
          onHide={() => setShowAISearch(false)} 
        />
      </div>
    </AdminRedirect>
  );
}

export default HomePage;
