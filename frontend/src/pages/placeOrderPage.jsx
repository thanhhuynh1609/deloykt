import React, { useContext } from "react";
import { Button, Row, Col, ListGroup, Image, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import Message from "../components/message";
import CheckoutSteps from "../components/checkoutSteps";
import UserContext from "../context/userContext";
import CartContext from "../context/cartContext";
import FormContainer from "../components/formContainer";
import { CURRENCY, formatVND } from "../utils/currency";

function PlacerOrderPage() {
  const { userInfo } = useContext(UserContext);
  const {
    productsInCart,
    shippingAddress,
    paymentMethod,
    totalItemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    discountAmount,
    placeOrder,
  } = useContext(CartContext);

  const navigate = useNavigate();
  const totalAfterDiscount = totalPrice - discountAmount;

  if (!userInfo || !userInfo.username) navigate("/login");
  if (!shippingAddress || !shippingAddress.address) navigate("/shipping");

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    await placeOrder();
  };

  return (
    <div>
      <FormContainer>
        <CheckoutSteps step1 step2 step3 step4 />
      </FormContainer>

      <Row>
        <Col md={8}>
          <ListGroup variant="flush" className="mb-4">
            <ListGroup.Item>
              <h4>📍 Địa chỉ nhận hàng</h4>
              <p className="mb-1">
                <strong>Địa chỉ:</strong>{" "}
                {`${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.postalCode}, ${shippingAddress.country}`}
              </p>
            </ListGroup.Item>

            <ListGroup.Item>
              <h4>💳 Phương thức thanh toán</h4>
              <p className="mb-1">
                <strong>Phương thức:</strong> {paymentMethod}
              </p>
            </ListGroup.Item>

            <ListGroup.Item>
              <h4>🛒 Sản phẩm trong đơn</h4>
              {productsInCart.length === 0 ? (
                <Message variant="info">Giỏ hàng của bạn đang trống.</Message>
              ) : (
                <ListGroup variant="flush">
                  {productsInCart.map((product) => (
                    <ListGroup.Item key={product.id} className="d-flex align-items-center">
                      <Image
                        src={product.image}
                        alt={product.name}
                        rounded
                        style={{ width: "60px", height: "60px", objectFit: "cover", marginRight: "12px" }}
                      />
                      <div className="flex-grow-1">
                        <Link to={`/product/${product.id}`} className="text-decoration-none fw-semibold">
                          {product.name}
                        </Link>
                        <div className="text-muted small">
                          {product.qty} × {formatVND(product.price)} ={" "}
                          <span className="fw-semibold">{formatVND(product.qty * product.price)}</span>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm mb-3">
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h4>Tóm tắt đơn hàng</h4>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Sản phẩm</Col>
                  <Col>{formatVND(totalItemsPrice)}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Phí vận chuyển</Col>
                  <Col>{formatVND(shippingPrice)}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Thuế (5%)</Col>
                  <Col>{formatVND(taxPrice)}</Col>
                </Row>
              </ListGroup.Item>

              {discountAmount > 0 && (
                <ListGroup.Item>
                  <Row>
                    <Col>Giảm giá</Col>
                    <Col className="text-success">- {formatVND(discountAmount)}</Col>
                  </Row>
                </ListGroup.Item>
              )}

              <ListGroup.Item>
                <Row>
                  <Col><strong>Tổng cộng</strong></Col>
                  <Col>
                    <strong className="text-primary">{formatVND(totalAfterDiscount)}</strong>
                    {discountAmount > 0 && (
                      <div className="text-success small">(Đã áp dụng mã giảm giá)</div>
                    )}
                  </Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Button
                  type="button"
                  variant="success"
                  className="w-100 fw-bold py-2"
                  disabled={productsInCart.length === 0}
                  onClick={handlePlaceOrder}
                >
                  Đặt hàng
                </Button>
              </ListGroup.Item>
            </ListGroup>
          </Card>

          <Message variant="info">
            {totalItemsPrice <= CURRENCY.FREE_SHIPPING_THRESHOLD ? (
              <>Miễn phí vận chuyển với đơn hàng từ {formatVND(CURRENCY.FREE_SHIPPING_THRESHOLD)}.</>
            ) : (
              "Đơn hàng này được miễn phí vận chuyển!"
            )}
          </Message>
          <Message variant="info">Thuế 5% tính trên giá trị sản phẩm.</Message>
        </Col>
      </Row>
    </div>
  );
}

export default PlacerOrderPage;
