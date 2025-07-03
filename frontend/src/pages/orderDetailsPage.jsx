import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Row, Col, ListGroup, Image, Card, Button, Alert } from "react-bootstrap";
import httpService from "../services/httpService";
import UserContext from "../context/userContext";
import PayboxContext from "../context/payboxContext";
import Loader from "../components/loader";
import Message from "../components/message";
import StripePaymentWrapper from "../components/stripePaymentWrapper";
import { formatVND } from "../utils/currency";

function OrderDetailsPage(props) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("paybox"); // Mặc định chọn Paybox
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState({});
  const [error, setError] = useState("");
  const [payboxLoading, setPayboxLoading] = useState(false);
  const [payboxMessage, setPayboxMessage] = useState("");
  const { userInfo, logout } = useContext(UserContext);
  const { wallet, payWithPaybox, hasSufficientBalance, formatVND: formatPayboxVND } = useContext(PayboxContext);
  const { id } = useParams();
  const navigate = useNavigate();

  if (!userInfo || !userInfo.username) navigate("/login");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await httpService.get(`/api/orders/${id}/`);
        setOrderDetails(data);
      } catch (ex) {
        if (ex.response && ex.response.status == 403) logout();
        if (ex.response && ex.response.status == 404)
          setError("No such order exists for this user!");
        else setError(ex.message);
      }
      setLoading(false);
    };
    fetchOrder();
  }, []);

  const handlePayboxPayment = async () => {
    try {
      setPayboxLoading(true);
      setPayboxMessage("");

      await payWithPaybox(id);

      // Refresh order details
      const { data } = await httpService.get(`/api/orders/${id}/`);
      setOrderDetails(data);

      setPayboxMessage("Thanh toán thành công!");
    } catch (ex) {
      const errorMessage = ex.response?.data?.error || "Không thể thanh toán bằng ví Paybox";
      setPayboxMessage(errorMessage);
    } finally {
      setPayboxLoading(false);
    }
  };

  return (
    <div>
      {loading ? (
        <Loader />
      ) : error != "" ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Row>
          <Col md={8}>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h2>Shipping</h2>
                <p>
                  <strong>Name: </strong> {orderDetails.user.username}
                </p>
                <p>
                  <strong>Email: </strong>{" "}
                  <Link href={`mailto:${orderDetails.user.email}`}>
                    {orderDetails.user.email}
                  </Link>
                </p>
                <p>
                  <strong>Shipping: </strong>
                  {orderDetails.shippingAddress.address},{" "}
                  {orderDetails.shippingAddress.city},{"   "}
                  {orderDetails.shippingAddress.postalCode},{"   "}
                  {orderDetails.shippingAddress.country}
                </p>
                <p>
                  {orderDetails.isDelivered ? (
                    <Message variant="success">
                      Delivered at {orderDetails.deliveredAt}.
                    </Message>
                  ) : (
                    <Message variant="warning">Not Delivered!</Message>
                  )}
                </p>
              </ListGroup.Item>
              <ListGroup.Item>
                <h2>Payment Method</h2>
                <p>
                  <strong>Method: </strong>
                  {orderDetails.paymentMethod}
                </p>
                <p>
                  {orderDetails.isPaid ? (
                    <Message variant="success">
                      Paid at {orderDetails.paidAt}.
                    </Message>
                  ) : (
                    <Message variant="warning">Not Paid!</Message>
                  )}
                </p>
              </ListGroup.Item>
              <ListGroup.Item>
                <h2>Order Items</h2>
                {
                  <ListGroup variant="flush">
                    {orderDetails.orderItems.map((product) => (
                      <ListGroup.Item key={product.id}>
                        <Row>
                          <Col sm={3} md={2}>
                            <Image
                              src={product.image}
                              alt={product.productName}
                              fluid
                              rounded
                            />
                          </Col>
                          <Col sm={5} md={6}>
                            <Link
                              to={`/product/${product.id}`}
                              className="text-decoration-none"
                            >
                              {product.productName}
                            </Link>
                          </Col>
                          <Col sm={3} md={4}>
                            {product.qty} X {formatVND(product.price)} = {formatVND(product.qty * product.price)}
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                }
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col md={4}>
            <Card className="mb-3">
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <h2>Order Summary</h2>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Items</Col>
                    <Col>
                      {formatVND(orderDetails.totalPrice -
                        orderDetails.taxPrice -
                        orderDetails.shippingPrice)}
                    </Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Shipping</Col>
                    <Col>{formatVND(orderDetails.shippingPrice)}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Tax</Col>
                    <Col>{formatVND(orderDetails.taxPrice)}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Total</Col>
                    <Col>{formatVND(orderDetails.totalPrice)}</Col>
                  </Row>
                </ListGroup.Item>
                {/* <ListGroup.Item>
                  <Row>
                    <Col>Giảm giá</Col>
                    <Col className="text-success">
                      {orderDetails.coupon ? `- ${formatVND(orderDetails.coupon.discount_amount)}` : "0 VND"}
                    </Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col><strong>Tổng cộng</strong></Col>
                    <Col><strong>{formatVND(orderDetails.totalPrice)}</strong></Col>
                  </Row>
                </ListGroup.Item> */}
              </ListGroup>
            </Card>
            <Row className="p-2">
              {!orderDetails.isPaid && (
                <div>
                  {/* Paybox Payment Messages */}
                  {payboxMessage && (
                    <Alert
                      variant={payboxMessage.includes("thành công") ? "success" : "danger"}
                      className="mb-3"
                    >
                      {payboxMessage}
                    </Alert>
                  )}

                  {/* Paybox Payment Option */}
                  {/* Chọn phương thức thanh toán */}
                  <Card className="mb-3">
                    <Card.Body className="p-2">
                      <div className="d-flex gap-3">
                        <Button
                          variant={selectedPaymentMethod === "paybox" ? "primary" : "outline-primary"}
                          onClick={() => setSelectedPaymentMethod("paybox")}
                        >
                          <i className="fas fa-wallet me-2"></i>
                          Ví Paybox
                        </Button>
                        <Button
                          variant={selectedPaymentMethod === "stripe" ? "primary" : "outline-primary"}
                          onClick={() => setSelectedPaymentMethod("stripe")}
                        >
                          <i className="fas fa-credit-card me-2"></i>
                          Thẻ tín dụng/ghi nợ
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Paybox Payment Option */}
                  {selectedPaymentMethod === "paybox" && wallet && (
                    <Card className="mb-3">
                      <Card.Header>
                        <h6 className="mb-0">
                          <i className="fas fa-wallet me-2"></i>
                          Thanh toán bằng ví Paybox
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <small className="text-muted">Số dư hiện tại:</small>
                          <div className="h5 text-primary mb-0">
                            {formatPayboxVND(wallet.balance)}
                          </div>
                        </div>

                        {hasSufficientBalance(orderDetails.totalPrice) ? (
                          <Button
                            variant="success"
                            onClick={handlePayboxPayment}
                            disabled={payboxLoading}
                            className="w-100"
                          >
                            {payboxLoading ? (
                              <>
                                <i className="fas fa-spinner fa-spin me-2"></i>
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-check me-2"></i>
                                Thanh toán {formatPayboxVND(orderDetails.totalPrice)}
                              </>
                            )}
                          </Button>
                        ) : (
                          <div>
                            <Alert variant="warning" className="mb-2">
                              <small>
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                Số dư không đủ để thanh toán đơn hàng này
                              </small>
                            </Alert>
                            <Button
                              variant="outline-primary"
                              href="/paybox"
                              className="w-100"
                            >
                              <i className="fas fa-plus me-2"></i>
                              Nạp thêm tiền vào ví
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  )}

                  {/* Stripe Payment Option */}
                  {selectedPaymentMethod === "stripe" && (
                    <Card>
                      <Card.Header>
                        <h6 className="mb-0">
                          <i className="fas fa-credit-card me-2"></i>
                          Thanh toán bằng thẻ tín dụng/ghi nợ
                        </h6>
                      </Card.Header>
                      <Card.Body className="p-0">
                        <StripePaymentWrapper id={orderDetails.id} />
                      </Card.Body>
                    </Card>
                  )}
                </div>
              )}
            </Row>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default OrderDetailsPage;
