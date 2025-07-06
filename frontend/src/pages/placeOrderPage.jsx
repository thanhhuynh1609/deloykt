import React, { useContext } from "react";
import { Button, Row, Col, ListGroup, Image, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import Message from "../components/message";
import CheckoutSteps from "../components/checkoutSteps";
import UserContext from "../context/userContext";
import CartContext from "../context/cartContext";
import FormContainer from "../components/formContainer";
import { CURRENCY, formatVND } from "../utils/currency";

function PlacerOrderPage(props) {
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
    placeOrder
  } = useContext(CartContext);
  const navigate = useNavigate();
  const totalAfterDiscount = totalPrice - discountAmount;

  if (!userInfo || !userInfo.username) navigate("/login");
  if (!shippingAddress || !shippingAddress.address) navigate("/shipping");

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const id = await placeOrder();

  };

  return (
    <div>
      <FormContainer>
        <CheckoutSteps step1 step2 step3 step4 />
      </FormContainer>
      <Row>
        <Col md={8}>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <h2 style={{ textTransform: "none" }}>Địa chỉ</h2>
              <p>
                <strong>Địa chỉ: </strong>
                {shippingAddress.address}, {shippingAddress.city},{"   "}
                {shippingAddress.postalCode},{"   "}
                {shippingAddress.country}
              </p>
            </ListGroup.Item>
            <ListGroup.Item>
              <h2>Phương thức thanh toán</h2>
              <p>
                <strong>Phương thức: </strong>
                {paymentMethod}
              </p>
            </ListGroup.Item>
            <ListGroup.Item>
              <h2>Sản phẩm</h2>
              {productsInCart.length == 0 ? (
                <Message variant="info">Giỏ hàng bạn đang trống</Message>
              ) : (
                <ListGroup variant="flush">
                  {productsInCart.map((product) => (
                    <ListGroup.Item key={product.id}>
                      <Row>
                        <Col sm={3} md={2}>
                          <Image
                            src={product.image}
                            alt={product.name}
                            fluid
                            rounded
                          />
                        </Col>
                        <Col sm={5} md={6}>
                          <Link
                            to={`/product/${product.id}`}
                            className="text-decoration-none"
                          >
                            {product.name}
                          </Link>
                        </Col>
                        <Col sm={3} md={4}>
                          {product.qty} X {formatVND(product.price)} = {formatVND(product.qty * product.price)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col md={4}>
          <Card className="mb-3">
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h2>Tóm tắt đơn hàng</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Sản phẩm</Col>
                  <Col>{formatVND(totalItemsPrice)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Phí ship</Col>
                  <Col>{formatVND(shippingPrice)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
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
                    <strong>{formatVND(totalAfterDiscount)}</strong>
                    {discountAmount > 0 && (
                      <span className="text-success ms-2">(Đã áp dụng mã giảm giá)</span>
                    )}
                  </Col>
                </Row>
              </ListGroup.Item>
              {/* <ListGroup.Item>
                <Row>
                  <Col>Total</Col>
                  <Col>{formatVND(totalPrice)}</Col>
                </Row>
              </ListGroup.Item> */}
              <ListGroup.Item>
                <Row className="mx-1">
                  <Button
                    type="button"
                    className="btn-block"
                    disabled={productsInCart.length == 0}
                    onClick={handlePlaceOrder}
                  >
                    Đặt hàng
                  </Button>
                </Row>
              </ListGroup.Item>
            </ListGroup>
          </Card>

          {totalItemsPrice <= CURRENCY.FREE_SHIPPING_THRESHOLD ? (
            <Message variant="info">
              Miễn phí vận chuyển với giá trị đơn hàng từ {formatVND(CURRENCY.FREE_SHIPPING_THRESHOLD)}.
            </Message>
          ) : (
            <Message variant="info">Free shipping on this order!</Message>
          )}
          <Message variant="info">
            Thuế 5% tính theo giá trị sản phẩm.
          </Message>
        </Col>
      </Row>
    </div>
  );
}

export default PlacerOrderPage;
