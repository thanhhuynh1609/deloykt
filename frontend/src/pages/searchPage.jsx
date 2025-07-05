import React, { useContext, useEffect, useState } from "react";
import { Row, Col, Container, Form } from "react-bootstrap";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Product from "../components/product";
import ProductsContext from "../context/productsContext";
import Loader from "../components/loader";
import Message from "../components/message";
import AdminRedirect from '../components/AdminRedirect';
import "../styles/searchPage.css";

function SearchPage() {
  const { error, products, loadProducts, brands, categories } =
    useContext(ProductsContext);
  const [loading, setLoading] = useState(true);
  const [errorFilters, setErrorFilters] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [sortBy, setSortBy] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const brandParam = searchParams.get("brand")
    ? Number(searchParams.get("brand"))
    : 0;
  const categoryParam = searchParams.get("category")
    ? Number(searchParams.get("category"))
    : 0;

  const keyword = searchParams.get("keyword")
    ? searchParams.get("keyword")
    : "";

  useEffect(() => {
    loadProducts().then(() => {
      setLoading(false);
    });
  }, [loadProducts]);

  useEffect(() => {
    setSelectedBrand(brandParam);
    setSelectedCategory(categoryParam);
  }, [brandParam, categoryParam]);

  // Hàm sắp xếp
  const sortProducts = (products, sortBy) => {
    const sortedProducts = [...products];
    
    switch (sortBy) {
      case 'price-asc':
        return sortedProducts.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sortedProducts.sort((a, b) => b.price - a.price);
      case 'rating-desc':
        return sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'reviews-desc':
        return sortedProducts.sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0));
      case 'sold-desc':
        return sortedProducts.sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0));
      default:
        return sortedProducts;
    }
  };

  let filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(keyword.toLowerCase())
  );

  if (selectedBrand != 0) {
    filteredProducts = filteredProducts.filter(
      (product) => product.brand == selectedBrand
    );
  }

  if (selectedCategory != 0) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category == selectedCategory
    );
  }

  // Áp dụng sắp xếp vào filteredProducts
  let sortedAndFilteredProducts = sortProducts(filteredProducts, sortBy);

  if (loading) return <Loader />;

  if (error != "" || errorFilters != "")
    return (
      <Message variant="danger">
        <h4>{error != "" ? error : errorFilters}</h4>
      </Message>
    );

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <AdminRedirect>
      <div className="search-page">
        <Container>
          <Row className="mb-4">
            <Col>
              <h2 className="search-title">
                {keyword ? `Kết quả tìm kiếm cho "${keyword}"` : "Tất cả sản phẩm"}
              </h2>
              <p className="search-results-count">Hiển thị {sortedAndFilteredProducts.length} sản phẩm</p>
            </Col>
          </Row>
          
          <Row>
            <Col md={3}>
              <div className="filter-sidebar">
                <div className="filter-header">
                  <h3>Bộ lọc</h3>
                  <Link
                    to={`/search?keyword=${keyword}`}
                    className="clear-filters"
                    onClick={() => {
                      setSelectedBrand(0);
                      setSelectedCategory(0);
                      setSortBy('');
                    }}
                  >
                    Xóa tất cả <i className="fas fa-times"></i>
                  </Link>
                </div>
                
                <div className="filter-section">
                  <h4>Danh mục</h4>
                  <div className="filter-options">
                    <div className="filter-option">
                      <input 
                        type="radio" 
                        id="category-all" 
                        name="category" 
                        checked={selectedCategory == 0}
                        onChange={() => {
                          setSelectedCategory(0);
                          navigate(`/search?keyword=${keyword}&brand=${selectedBrand}`);
                        }}
                      />
                      <label htmlFor="category-all">Tất cả danh mục</label>
                    </div>
                    {categories.map((category) => (
                      <div className="filter-option" key={category.id}>
                        <input 
                          type="radio" 
                          id={`category-${category.id}`} 
                          name="category" 
                          checked={selectedCategory == category.id}
                          onChange={() => {
                            setSelectedCategory(category.id);
                            navigate(`/search?keyword=${keyword}&brand=${selectedBrand}&category=${category.id}`);
                          }}
                        />
                        <label htmlFor={`category-${category.id}`}>{category.title}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="filter-section">
                  <h4>Thương hiệu</h4>
                  <div className="filter-options">
                    <div className="filter-option">
                      <input 
                        type="radio" 
                        id="brand-all" 
                        name="brand" 
                        checked={selectedBrand == 0}
                        onChange={() => {
                          setSelectedBrand(0);
                          navigate(`/search?keyword=${keyword}&category=${selectedCategory}`);
                        }}
                      />
                      <label htmlFor="brand-all">Tất cả thương hiệu</label>
                    </div>
                    {brands.map((brand) => (
                      <div className="filter-option" key={brand.id}>
                        <input 
                          type="radio" 
                          id={`brand-${brand.id}`} 
                          name="brand" 
                          checked={selectedBrand == brand.id}
                          onChange={() => {
                            setSelectedBrand(brand.id);
                            navigate(`/search?keyword=${keyword}&brand=${brand.id}&category=${selectedCategory}`);
                          }}
                        />
                        <label htmlFor={`brand-${brand.id}`}>{brand.title}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
            
            <Col md={9}>
              <div className="products-header">
                <div className="sort-options">
                  <span>Sắp xếp theo:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="">Mặc định</option>
                    <option value="price-asc">Giá: Thấp đến cao</option>
                    <option value="price-desc">Giá: Cao đến thấp</option>
                    <option value="rating-desc">Đánh giá cao nhất</option>
                    <option value="reviews-desc">Nhiều đánh giá nhất</option>
                    <option value="sold-desc">Bán chạy nhất</option>
                  </select>
                </div>
              </div>
              
              <div className="products-grid">
                <Row>
                  {sortedAndFilteredProducts.map((product) => (
                    <Col key={product.id} sm={6} md={4} lg={4} className="mb-4">
                      <div className="product-card">
                        <Link to={`/products/${product.id}`} className="product-image">
                          <img src={product.image} alt={product.name} />
                          {product.total_sold > 10 && (
                            <span className="product-badge bestseller">Bán chạy</span>
                          )}
                        </Link>
                        <div className="product-info">
                          <Link to={`/products/${product.id}`} className="product-name">
                            {product.name}
                          </Link>
                          <div className="product-meta">
                            <div className="product-price">{formatPrice(product.price)}</div>
                            <div className="product-rating">
                              <i className="fas fa-star"></i> {product.rating || 0}
                              <span className="product-sold">Đã bán {product.total_sold || 0}</span>
                            </div>
                          </div>
                          <div className="product-actions">
                            <Link to={`/products/${product.id}`} className="btn-view">
                              Xem chi tiết
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
                
                {sortedAndFilteredProducts.length === 0 && (
                  <div className="no-products">
                    <i className="fas fa-search"></i>
                    <p>Không tìm thấy sản phẩm phù hợp</p>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </AdminRedirect>
  );
}

export default SearchPage;
