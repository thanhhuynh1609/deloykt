import React, { useContext, useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ProductsContext from "../context/productsContext";
import Loader from "../components/loader";
import Message from "../components/message";
import AdminRedirect from "../components/AdminRedirect";
import "../styles/searchPage.css";

function SearchPage() {
  const { error, products, loadProducts, brands, categories } =
    useContext(ProductsContext);
  const [loading, setLoading] = useState(true);
  const [errorFilters, setErrorFilters] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [priceRange, setPriceRange] = useState(0); // 0 = all prices
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const brandParam = searchParams.get("brand")
    ? Number(searchParams.get("brand"))
    : 0;
  const categoryParam = searchParams.get("category")
    ? Number(searchParams.get("category"))
    : 0;
  const priceParam = searchParams.get("price")
    ? Number(searchParams.get("price"))
    : 0;

  const keyword = searchParams.get("keyword")
    ? searchParams.get("keyword")
    : "";

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadProducts();
        setSelectedBrand(brandParam);
        setSelectedCategory(categoryParam);
        setPriceRange(priceParam);
        setLoading(false);
      } catch (error) {
        setErrorFilters(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [loadProducts, brandParam, categoryParam, priceParam]);

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

  // Hàm lọc theo khoảng giá
  const filterByPrice = (products, priceRange) => {
    switch (priceRange) {
      case 1: // Dưới 100.000đ
        return products.filter(product => product.price < 100000);
      case 2: // 100.000đ - 300.000đ
        return products.filter(product => product.price >= 100000 && product.price <= 300000);
      case 3: // 300.000đ - 500.000đ
        return products.filter(product => product.price > 300000 && product.price <= 500000);
      case 4: // 500.000đ - 1.000.000đ
        return products.filter(product => product.price > 500000 && product.price <= 1000000);
      case 5: // Trên 1.000.000đ
        return products.filter(product => product.price > 1000000);
      default: // Tất cả giá
        return products;
    }
  };

  let filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(keyword.toLowerCase())
  );

  if (selectedBrand !== 0) {
    filteredProducts = filteredProducts.filter(
      (product) => product.brand === selectedBrand
    );
  }

  if (selectedCategory !== 0) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCategory
    );
  }

  // Áp dụng lọc theo khoảng giá
  filteredProducts = filterByPrice(filteredProducts, priceRange);

  // Áp dụng sắp xếp vào filteredProducts
  let sortedAndFilteredProducts = sortProducts(filteredProducts, sortBy);

  // Phân trang
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedAndFilteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sortedAndFilteredProducts.length / productsPerPage);

  // Xử lý chuyển trang
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  // Xử lý thay đổi khoảng giá
  const handlePriceChange = (value) => {
    setPriceRange(value);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi bộ lọc
    
    // Cập nhật URL với tham số giá mới
    navigate(`/search?keyword=${keyword}&brand=${selectedBrand}&category=${selectedCategory}&price=${value}`);
  };

  if (loading) return <Loader />;

  if (error !== "" || errorFilters !== "")
    return (
      <Message variant="danger">
        <h4>{error !== "" ? error : errorFilters}</h4>
      </Message>
    );

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <AdminRedirect>
      <div className="search-page">
        <Container fluid> 
          <Row className="mb-4">
            <Col>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                  <li className="breadcrumb-item active">Casual</li>
                </ol>
              </nav>
            </Col>
          </Row>
          
          <Row>
            <Col md={3} lg={3}>
              <div className="filter-sidebar">
                <div className="filter-header">
                  <h3>Filters</h3>
                  <Link
                    to={`/search?keyword=${keyword}`}
                    className="clear-filters"
                    onClick={() => {
                      setSelectedBrand(0);
                      setSelectedCategory(0);
                      setPriceRange(0);
                      setSortBy('');
                    }}
                  >
                    Clear All
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
                        checked={selectedCategory === 0}
                        onChange={() => {
                          setSelectedCategory(0);
                          navigate(`/search?keyword=${keyword}&brand=${selectedBrand}&price=${priceRange}`);
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
                          checked={selectedCategory === category.id}
                          onChange={() => {
                            setSelectedCategory(category.id);
                            navigate(`/search?keyword=${keyword}&brand=${selectedBrand}&category=${category.id}&price=${priceRange}`);
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
                        checked={selectedBrand === 0}
                        onChange={() => {
                          setSelectedBrand(0);
                          navigate(`/search?keyword=${keyword}&category=${selectedCategory}&price=${priceRange}`);
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
                          checked={selectedBrand === brand.id}
                          onChange={() => {
                            setSelectedBrand(brand.id);
                            navigate(`/search?keyword=${keyword}&brand=${brand.id}&category=${selectedCategory}&price=${priceRange}`);
                          }}
                        />
                        <label htmlFor={`brand-${brand.id}`}>{brand.title}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="filter-section">
                  <h4>Khoảng giá</h4>
                  <div className="filter-options">
                    <div className="filter-option">
                      <input 
                        type="radio" 
                        id="price-all" 
                        name="price" 
                        checked={priceRange === 0}
                        onChange={() => handlePriceChange(0)}
                      />
                      <label htmlFor="price-all">Tất cả giá</label>
                    </div>
                    <div className="filter-option">
                      <input 
                        type="radio" 
                        id="price-1" 
                        name="price" 
                        checked={priceRange === 1}
                        onChange={() => handlePriceChange(1)}
                      />
                      <label htmlFor="price-1">Dưới 100.000₫</label>
                    </div>
                    <div className="filter-option">
                      <input 
                        type="radio" 
                        id="price-2" 
                        name="price" 
                        checked={priceRange === 2}
                        onChange={() => handlePriceChange(2)}
                      />
                      <label htmlFor="price-2">100.000₫ - 300.000₫</label>
                    </div>
                    <div className="filter-option">
                      <input 
                        type="radio" 
                        id="price-3" 
                        name="price" 
                        checked={priceRange === 3}
                        onChange={() => handlePriceChange(3)}
                      />
                      <label htmlFor="price-3">300.000₫ - 500.000₫</label>
                    </div>
                    <div className="filter-option">
                      <input 
                        type="radio" 
                        id="price-4" 
                        name="price" 
                        checked={priceRange === 4}
                        onChange={() => handlePriceChange(4)}
                      />
                      <label htmlFor="price-4">500.000₫ - 1.000.000₫</label>
                    </div>
                    <div className="filter-option">
                      <input 
                        type="radio" 
                        id="price-5" 
                        name="price" 
                        checked={priceRange === 5}
                        onChange={() => handlePriceChange(5)}
                      />
                      <label htmlFor="price-5">Trên 1.000.000₫</label>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            
         <Col md={9} lg={9}>
              <div className="sort-container">
                <h2 className="search-title">
                  {keyword ? `Kết quả tìm kiếm cho "${keyword}"` : "Casual"}
                </h2>
                <div className="sort-options">
                  <span className="sort-label">Sort By: </span>
                  <select 
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="">Most Popular</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating-desc">Rating</option>
                    <option value="sold-desc">Best Selling</option>
                  </select>
                </div>
              </div>
              
              <p className="search-results-count">
                Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, sortedAndFilteredProducts.length)} of {sortedAndFilteredProducts.length} products
              </p>
              
              <div className="products-grid">
                <Row>
                  {currentProducts.map((product) => (
                    <Col key={product.id} sm={6} md={6} lg={4} className="mb-4">
                      <div className="product-card">
                        <Link to={`/products/${product.id}`} className="product-image">
                          <img src={product.image} alt={product.name} />
                          {product.total_sold > 10 && (
                            <span className="product-badge bestseller">
                              <i className="fas fa-fire-alt mr-1"></i> Bán chạy
                            </span>
                          )}
                          {product.discount > 0 && (
                            <span className="product-badge discount">
                              <i className="fas fa-tag mr-1"></i> -{product.discount}%
                            </span>
                          )}
                          {product.is_new && (
                            <span className="product-badge new">
                              <i className="fas fa-bolt mr-1"></i> Mới
                            </span>
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
                              Xem Chi Tiết
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
              
              {sortedAndFilteredProducts.length > 0 && (
                <nav aria-label="Page navigation">
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        &laquo;
                      </button>
                    </li>
                    
                    {[...Array(totalPages).keys()].map(number => (
                      <li 
                        key={number + 1} 
                        className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(number + 1)}
                        >
                          {number + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        &raquo;
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </AdminRedirect>
  );
}

export default SearchPage;
