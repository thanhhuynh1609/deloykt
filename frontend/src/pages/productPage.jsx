import React, { useEffect, useState, useContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Image,
  Button,
  Card,
  Form,
  Container,
  Breadcrumb,
  Tabs,
  Tab,
} from "react-bootstrap";
import Rating from "../components/rating";
import ProductsContext from "../context/productsContext";
import Loader from "../components/loader";
import Message from "../components/message";
import CartContext from "../context/cartContext";
import ReviewsList from "../components/reviewsList";
import { formatVND } from "../utils/currency";
import { FavoriteContext } from "../context/favoriteContext";
import UserContext from "../context/userContext";
import "../styles/productPage.css";
import { toast } from "react-toastify";

function ProductPage(props) {
  const { id } = useParams();
  const { error, loadProduct, getProductVariant } = useContext(ProductsContext);
  const { addItemToCart } = useContext(CartContext);
  const { isFavorite, addToFavorites, removeFromFavorites } =
    useContext(FavoriteContext);
  const { userInfo } = useContext(UserContext);
  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const productData = await loadProduct(id);
      setProduct(productData);

      // Khởi tạo giá và tồn kho
      if (productData.has_variants) {
        setCurrentPrice(productData.min_price || productData.price);
        setCurrentStock(productData.total_stock || 0);
      } else {
        setCurrentPrice(productData.price);
        setCurrentStock(productData.countInStock);
      }

      setLoading(false);
      window.scrollTo(0, 0);
    };
    fetchData();
  }, [id, loadProduct]);

  // Function để lấy sizes có sẵn cho màu đã chọn
  const getAvailableSizesForColor = () => {
    if (!product.has_variants || !selectedColor || !product.variants) {
      return product.has_variants ? (product.available_sizes || []).map(size => ({
        name: size.name,
        available: true
      })) : [];
    }

    // Lấy tất cả sizes và kiểm tra availability
    const allSizes = (product.available_sizes || []).map(size => {
      const variantForColorAndSize = product.variants.find(variant =>
        variant.color.name === selectedColor && variant.size.name === size.name
      );

      return {
        name: size.name,
        available: variantForColorAndSize && variantForColorAndSize.stock_quantity > 0
      };
    });

    return allSizes;
  };

  // Function để lấy colors có sẵn cho size đã chọn
  const getAvailableColorsForSize = () => {
    if (!product.has_variants || !selectedSize || !product.variants) {
      return product.has_variants ? (product.available_colors || []).map(color => ({
        ...color,
        available: true
      })) : [];
    }

    // Lấy tất cả colors và kiểm tra availability
    const allColors = (product.available_colors || []).map(color => {
      const variantForColorAndSize = product.variants.find(variant =>
        variant.color.name === color.name && variant.size.name === selectedSize
      );

      return {
        ...color,
        available: variantForColorAndSize && variantForColorAndSize.stock_quantity > 0
      };
    });

    return allColors;
  };

  // Effect để reset size khi chọn màu mới (nếu size không có sẵn)
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const availableSizesForNewColor = getAvailableSizesForColor();
      const sizeStillAvailable = availableSizesForNewColor.find(s => s.name === selectedSize && s.available);
      if (!sizeStillAvailable) {
        setSelectedSize(""); // Reset size nếu không có sẵn cho màu mới
      }
    }
  }, [selectedColor]);

  // Effect để reset color khi chọn size mới (nếu color không có sẵn)
  useEffect(() => {
    if (selectedSize && selectedColor) {
      const availableColorsForNewSize = getAvailableColorsForSize();
      const colorStillAvailable = availableColorsForNewSize.find(c => c.name === selectedColor && c.available);
      if (!colorStillAvailable) {
        setSelectedColor(""); // Reset color nếu không có sẵn cho size mới
      }
    }
  }, [selectedSize]);

  // Effect để cập nhật biến thể khi chọn màu sắc và size
  useEffect(() => {
    const updateVariant = async () => {
      if (product.has_variants && selectedColor && selectedSize) {
        const colorObj = product.available_colors?.find(c => c.name === selectedColor);
        const sizeObj = product.available_sizes?.find(s => s.name === selectedSize);

        if (colorObj && sizeObj) {
          const variant = await getProductVariant(product.id, colorObj.id, sizeObj.id);
          if (variant) {
            setSelectedVariant(variant);
            setCurrentPrice(variant.price);
            setCurrentStock(variant.stock_quantity);
          } else {
            // Nếu không tìm thấy biến thể, reset thông tin
            setSelectedVariant(null);
            setCurrentPrice(product.min_price || product.price);
            setCurrentStock(0);
          }
        }
      }
    };

    updateVariant();
  }, [selectedColor, selectedSize, product, getProductVariant]);

  const addToCartHandler = () => {
    const cartItem = {
      id: Number(id),
      qty: Number(qty),
      variant_id: selectedVariant?.id || null,
      color: selectedColor || null,
      size: selectedSize || null
    };

    addItemToCart(cartItem);
    toast.success("Đã thêm vào giỏ hàng!");
    // navigate(`/cart`);
  };

  const handleFavoriteToggle = () => {
    if (!userInfo) {
      navigate("/login");
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
  const productImages = product.image
    ? [product.image, product.image, product.image, product.image]
    : [];

  // Lấy dữ liệu màu sắc và kích cỡ từ API với thông tin availability
  const availableColors = product.has_variants ? getAvailableColorsForSize().map(color => ({
    name: color.name,
    value: color.name.toLowerCase(),
    color: color.hex_code,
    available: color.available
  })) : [];

  const availableSizes = getAvailableSizesForColor();

  // FAQ data
  const faqData = [
    {
      question: "Sản phẩm này có bảo hành không?",
      answer:
        "Có, sản phẩm được bảo hành 12 tháng từ ngày mua hàng. Bảo hành bao gồm lỗi do nhà sản xuất.",
    },
    {
      question: "Thời gian giao hàng là bao lâu?",
      answer:
        "Thời gian giao hàng từ 2-5 ngày làm việc tùy theo khu vực. Nội thành Hà Nội và TP.HCM giao trong 1-2 ngày.",
    },
    {
      question: "Có thể đổi trả sản phẩm không?",
      answer:
        "Bạn có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên vẹn.",
    },
    {
      question: "Làm sao để chọn size phù hợp?",
      answer:
        "Bạn có thể tham khảo bảng size chi tiết trong phần mô tả sản phẩm hoặc liên hệ tư vấn viên để được hỗ trợ.",
    },
    {
      question: "Sản phẩm có giống hình ảnh không?",
      answer:
        "Chúng tôi cam kết hình ảnh sản phẩm 100% thật. Màu sắc có thể chênh lệch nhẹ do màn hình hiển thị.",
    },
  ];

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  if (product && product.id)
    return (
      <div className="product-detail-page">
        <Container>
          {/* Breadcrumb */}
          <Breadcrumb className="product-breadcrumb">
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
              Trang chủ
            </Breadcrumb.Item>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/search" }}>
              Sản phẩm
            </Breadcrumb.Item>
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
                        className={`thumbnail ${
                          selectedImage === index ? "active" : ""
                        }`}
                        onClick={() => handleImageClick(index)}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} - ${index + 1}`}
                          fluid
                        />
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
                    <span className="rating-value">
                      {product.rating
                        ? Number(product.rating).toFixed(1)
                        : "0.0"}
                    </span>
                  </div>
                  <div className="product-sold">
                    <i className="fas fa-shopping-cart"></i> Đã bán{" "}
                    {product.total_sold || 0}
                  </div>
                </div>

                <div className="product-price">
                  <span className="current-price">
                    {formatVND(currentPrice)}
                  </span>
                  {product.has_variants && selectedColor && selectedSize && (
                    <span className="variant-info">
                      {selectedColor} - {selectedSize}
                    </span>
                  )}
                  {product.oldPrice && (
                    <>
                      <span className="old-price">
                        {formatVND(product.oldPrice)}
                      </span>
                      <span className="discount-badge">
                        -
                        {Math.round(
                          ((product.oldPrice - currentPrice) /
                            product.oldPrice) *
                            100
                        )}
                        %
                      </span>
                    </>
                  )}
                </div>

                <div className="product-description-short">
                  <p>
                    {product.description
                      ? product.description.substring(0, 150) + "..."
                      : "Sản phẩm chất lượng cao, được nhiều khách hàng tin tưởng và lựa chọn."}
                  </p>
                </div>

                {/* Color Selection */}
                {product.has_variants && (
                  <div className="product-options">
                    {availableColors.length > 0 && (
                      <div className="option-group">
                        <span className="option-label">Màu sắc:</span>
                        <div className="color-options">
                          {availableColors.map((color) => (
                            <div
                              key={color.value}
                              className={`color-option ${
                                selectedColor === color.name ? "selected" : ""
                              } ${!color.available ? "unavailable" : ""}`}
                              onClick={() => {
                                if (color.available) {
                                  // Nếu click vào màu đã chọn, bỏ chọn
                                  if (selectedColor === color.name) {
                                    setSelectedColor("");
                                  } else {
                                    setSelectedColor(color.name);
                                  }
                                }
                              }}
                              title={color.available ? color.name : `${color.name} (Hết hàng)`}
                              style={{
                                cursor: color.available ? "pointer" : "not-allowed",
                                opacity: color.available ? 1 : 0.5
                              }}
                            >
                              <div
                                className="color-circle"
                                style={{
                                  backgroundColor: color.color,
                                  border:
                                    color.name === "Trắng"
                                      ? "1px solid #ddd"
                                      : "none",
                                  opacity: color.available ? 1 : 0.6
                                }}
                              ></div>
                              <span className="color-name">{color.name}</span>
                              {!color.available && (
                                <small className="text-muted d-block">(Hết hàng)</small>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Size Selection */}
                    {availableSizes.length > 0 && (
                      <div className="option-group">
                        <span className="option-label">Kích cỡ:</span>
                        <div className="size-options">
                          {availableSizes.map((size) => (
                            <button
                              key={size.name}
                              className={`size-option ${
                                selectedSize === size.name ? "selected" : ""
                              } ${!size.available ? "unavailable" : ""}`}
                              onClick={() => {
                                if (size.available) {
                                  // Nếu click vào size đã chọn, bỏ chọn
                                  if (selectedSize === size.name) {
                                    setSelectedSize("");
                                  } else {
                                    setSelectedSize(size.name);
                                  }
                                }
                              }}
                              disabled={!size.available}
                              title={size.available ? size.name : `Size ${size.name} (Hết hàng)`}
                              style={{
                                opacity: size.available ? 1 : 0.5,
                                cursor: size.available ? "pointer" : "not-allowed"
                              }}
                            >
                              {size.name}
                              {!size.available && (
                                <small className="d-block text-muted" style={{fontSize: "0.7rem"}}>
                                  (Hết hàng)
                                </small>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="product-status">
                  <span className="status-label">Trạng thái:</span>
                  <span
                    className={`status-value ${
                      currentStock > 0 ? "in-stock" : "out-of-stock"
                    }`}
                  >
                    {currentStock > 0 ? "Còn hàng" : "Hết hàng"}
                  </span>
                  {currentStock > 0 && (
                    <span className="stock-count">
                      ({currentStock} sản phẩm có sẵn)
                    </span>
                  )}
                  {product.has_variants && (!selectedColor || !selectedSize) && (
                    <div className="variant-warning">
                      <small className="text-warning">
                        Vui lòng chọn màu sắc và kích cỡ để xem tồn kho
                      </small>
                    </div>
                  )}
                </div>

                {currentStock > 0 && (
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
                          if (
                            !isNaN(value) &&
                            value > 0 &&
                            value <= currentStock
                          ) {
                            setQty(value);
                          }
                        }}
                        min="1"
                        max={currentStock}
                        readOnly
                      />
                      <Button
                        variant="outline-secondary"
                        className="qty-btn"
                        onClick={() =>
                          qty < currentStock && setQty(qty + 1)
                        }
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
                    disabled={
                      currentStock === 0 ||
                      (product.has_variants && (!selectedColor || !selectedSize))
                    }
                  >
                    <i className="fas fa-shopping-cart"></i> Thêm vào giỏ hàng
                  </Button>
                  <div className="product-actions-secondary">
                    <Button
                      variant="outline-secondary"
                      className="btn-buy-now"
                      onClick={() => {
                        addToCartHandler();
                        navigate("/shipping");
                      }}
                      disabled={
                        currentStock === 0 ||
                        (product.has_variants && (!selectedColor || !selectedSize))
                      }
                    >
                      Mua ngay
                    </Button>
                    <Button
                      variant="outline-danger"
                      className="btn-favorite"
                      onClick={handleFavoriteToggle}
                    >
                      <i
                        className={`${
                          isFavorite(product.id) ? "fas" : "far"
                        } fa-heart`}
                      ></i>
                    </Button>
                  </div>
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
                <Tab eventKey="description" title="Thông tin sản phẩm">
                  <div className="product-description">
                    <h4>Mô tả chi tiết</h4>
                    <p>
                      {product.description ||
                        "Sản phẩm chất lượng cao, được sản xuất từ những nguyên liệu tốt nhất. Thiết kế hiện đại, phù hợp với xu hướng thời trang hiện tại. Đảm bảo độ bền và tính thẩm mỹ cao."}
                    </p>

                    <h5>Thông số kỹ thuật</h5>
                    <ul>
                      <li>Chất liệu: Cotton cao cấp</li>
                      <li>Xuất xứ: Việt Nam</li>
                      <li>Bảo hành: 12 tháng</li>
                      <li>Hướng dẫn bảo quản: Giặt máy ở nhiệt độ thường</li>
                    </ul>

                    <h5>Ưu điểm nổi bật</h5>
                    <ul>
                      <li>✓ Chất lượng cao, bền đẹp</li>
                      <li>✓ Thiết kế hiện đại, thời trang</li>
                      <li>✓ Giá cả hợp lý</li>
                      <li>✓ Dịch vụ hậu mãi tốt</li>
                    </ul>
                  </div>
                </Tab>
                <Tab
                  eventKey="reviews"
                  title={`Đánh giá & Nhận xét (${product.numReviews})`}
                >
                  <div className="product-reviews">
                    <div className="reviews-summary">
                      <div className="rating-average">
                        <h3>
                          {product.rating
                            ? Number(product.rating).toFixed(1)
                            : "0.0"}
                        </h3>
                        <Rating
                          value={product.rating}
                          text={`${product.numReviews} đánh giá`}
                          color={"#f8e825"}
                        />
                        <p className="rating-text">
                          Trung bình từ {product.numReviews} đánh giá
                        </p>
                      </div>
                      <div className="rating-breakdown">
                        <div className="rating-bar">
                          <span>5 sao</span>
                          <div className="bar">
                            <div
                              className="fill"
                              style={{ width: "60%" }}
                            ></div>
                          </div>
                          <span>60%</span>
                        </div>
                        <div className="rating-bar">
                          <span>4 sao</span>
                          <div className="bar">
                            <div
                              className="fill"
                              style={{ width: "25%" }}
                            ></div>
                          </div>
                          <span>25%</span>
                        </div>
                        <div className="rating-bar">
                          <span>3 sao</span>
                          <div className="bar">
                            <div
                              className="fill"
                              style={{ width: "10%" }}
                            ></div>
                          </div>
                          <span>10%</span>
                        </div>
                        <div className="rating-bar">
                          <span>2 sao</span>
                          <div className="bar">
                            <div className="fill" style={{ width: "3%" }}></div>
                          </div>
                          <span>3%</span>
                        </div>
                        <div className="rating-bar">
                          <span>1 sao</span>
                          <div className="bar">
                            <div className="fill" style={{ width: "2%" }}></div>
                          </div>
                          <span>2%</span>
                        </div>
                      </div>
                    </div>
                    <ReviewsList product={product} />
                  </div>
                </Tab>
                <Tab eventKey="faq" title="Câu hỏi thường gặp">
                  <div className="product-faq">
                    <h4>Câu hỏi thường gặp</h4>
                    <div className="faq-list">
                      {faqData.map((faq, index) => (
                        <div key={index} className="faq-item">
                          <div className="faq-question">
                            <i className="fas fa-question-circle"></i>
                            <strong>{faq.question}</strong>
                          </div>
                          <div className="faq-answer">
                            <i className="fas fa-check-circle"></i>
                            {faq.answer}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="faq-contact">
                      <p>
                        Không tìm thấy câu trả lời?{" "}
                        <a href="/contact">Liên hệ với chúng tôi</a>
                      </p>
                    </div>
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
                          <Link
                            to={`/products/${product.id}`}
                            className="product-name"
                          >
                            {product.name}
                          </Link>
                          <div className="product-price">
                            {formatVND(product.price)}
                          </div>
                          <div className="product-rating">
                            <i className="fas fa-star"></i>{" "}
                            {product.rating || 0}
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
