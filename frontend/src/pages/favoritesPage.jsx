import React, { useContext } from 'react';
import { Row, Col, Alert, Container, Breadcrumb } from 'react-bootstrap';
import { FavoriteContext } from '../context/favoriteContext';
import Product from '../components/product';
import Loader from '../components/loader';
import { Link } from 'react-router-dom';

function FavoritesPage() {
  const { favorites, loading } = useContext(FavoriteContext);

  if (loading) {
    return <Loader />;
  }

  return (
    <Container>
      {/* Breadcrumb */}
      <Breadcrumb className="my-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item active>Sản phẩm yêu thích</Breadcrumb.Item>
      </Breadcrumb>

      <div className="favorites-page">
        <h1 className="mb-4">Sản phẩm yêu thích</h1>
        {favorites.length === 0 ? (
          <Alert variant="info">
            Bạn chưa thêm sản phẩm nào vào danh sách yêu thích.{' '}
            <Link to="/">Tiếp tục mua sắm</Link>
          </Alert>
        ) : (
          <>
            <p className="text-muted mb-4">Bạn có {favorites.length} sản phẩm trong danh sách yêu thích</p>
            <Row>
              {favorites.map((product) => (
                <Col key={product.id} sm={6} md={4} lg={3} className="mb-4">
                  <Product product={product} showSoldCount={true} />
                </Col>
              ))}
            </Row>
          </>
        )}
      </div>
    </Container>
  );
}

export default FavoritesPage;
