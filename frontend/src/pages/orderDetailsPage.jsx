import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Row, Col, ListGroup, Image, Card, Button, Alert, Modal, Form } from "react-bootstrap";
import httpService from "../services/httpService";
import UserContext from "../context/userContext";
import PayboxContext from "../context/payboxContext";
import Loader from "../components/loader";
import Message from "../components/message";
import StripePaymentWrapper from "../components/stripePaymentWrapper";
import { formatVND } from "../utils/currency";

function OrderDetailsPage() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("paybox");
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState({});
  const [refundMessage, setRefundMessage] = useState("");
  const [error, setError] = useState("");
  const [payboxLoading, setPayboxLoading] = useState(false);
  const [payboxMessage, setPayboxMessage] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");

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
        if (ex.response?.status === 403) logout();
        else setError(ex.response?.data?.error || "Đã xảy ra lỗi khi tải đơn hàng.");
      }
      setLoading(false);
    };
    fetchOrder();
  }, [id, logout]);

  const handlePayboxPayment = async () => {
    try {
      setPayboxLoading(true);
      setPayboxMessage("");
      await payWithPaybox(id);
      const { data } = await httpService.get(`/api/orders/${id}/`);
      setOrderDetails(data);
      setPayboxMessage("Thanh toán thành công!");
    } catch (ex) {
      setPayboxMessage(ex.response?.data?.error || "Không thể thanh toán bằng ví Paybox");
    } finally {
      setPayboxLoading(false);
    }
  };

  const submitRefundRequest = async () => {
    if (!refundReason.trim()) {
      setRefundMessage("Vui lòng nhập lý do hoàn tiền!");
      return;
    }
    try {
      await httpService.post("/api/paybox/refund-request/", { order_id: orderDetails.id, reason: refundReason });
      setRefundMessage("Yêu cầu hoàn tiền đã được gửi!");
      const updated = await httpService.get(`/api/orders/${id}/`);
      setOrderDetails(updated.data);
      setShowRefundModal(false);
      setRefundReason("");
    } catch (ex) {
      setRefundMessage(ex.response?.data?.error || "Không thể gửi yêu cầu hoàn tiền.");
    }
  };

  return (
    <div className="order-details-page">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Row>
          <Col md={8}>
            <Card className="mb-3 shadow-sm rounded">
              <Card.Body>
                <h3 className="mb-3">Thông tin đơn hàng</h3>
                <p><strong>Khách:</strong> {orderDetails.user.username}</p>
                <p><strong>Email:</strong> <a href={`mailto:${orderDetails.user.email}`}>{orderDetails.user.email}</a></p>
                <p><strong>Địa chỉ:</strong> {orderDetails.shippingAddress.address}, {orderDetails.shippingAddress.city}</p>
                {orderDetails.isDelivered ? (
                  <Message variant="success">Đã giao lúc {orderDetails.deliveredAt}</Message>
                ) : (
                  <Message variant="warning">Chưa giao</Message>
                )}
              </Card.Body>
            </Card>

            <Card className="mb-3 shadow-sm rounded">
              <Card.Body>
                <h3 className="mb-3">Sản phẩm</h3>
                <ListGroup variant="flush">
                  {orderDetails.orderItems.map(item => (
                    <ListGroup.Item key={item.id} className="py-3">
                      <Row>
                        <Col md={2}><Image src={item.image} alt={item.productName} fluid rounded /></Col>
                        <Col><Link to={`/product/${item.id}`}>{item.productName}</Link></Col>
                        <Col>{item.qty} x {formatVND(item.price)} = <strong>{formatVND(item.qty * item.price)}</strong></Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="mb-3 shadow-sm rounded">
              <Card.Header><h5>Tóm tắt đơn hàng</h5></Card.Header>
              <ListGroup variant="flush">
                <ListGroup.Item>Sản phẩm: {formatVND(orderDetails.itemsPrice)}</ListGroup.Item>
                <ListGroup.Item>Ship: {formatVND(orderDetails.shippingPrice)}</ListGroup.Item>
                <ListGroup.Item>Tax: {formatVND(orderDetails.taxPrice)}</ListGroup.Item>
                <ListGroup.Item><strong>Tổng: {formatVND(orderDetails.totalPrice)}</strong></ListGroup.Item>
              </ListGroup>
            </Card>

            {!orderDetails.isPaid && (
              <>
                <Card className="mb-3 p-3 shadow-sm rounded">
                  <Button variant="outline-primary" className="mb-2" onClick={() => setSelectedPaymentMethod("paybox")}>Ví Paybox</Button>
                  <Button variant="outline-primary" onClick={() => setSelectedPaymentMethod("stripe")}>Thẻ tín dụng</Button>
                </Card>

                {selectedPaymentMethod === "paybox" && (
                  <Card className="mb-3 p-3 shadow-sm rounded">
                    <p>Số dư ví: <strong>{formatPayboxVND(wallet.balance)}</strong></p>
                    {hasSufficientBalance(orderDetails.totalPrice) ? (
                      <Button variant="success" onClick={handlePayboxPayment} disabled={payboxLoading}>
                        {payboxLoading ? "Đang xử lý..." : `Thanh toán ${formatPayboxVND(orderDetails.totalPrice)}`}
                      </Button>
                    ) : (
                      <Alert variant="warning">Số dư ví không đủ!</Alert>
                    )}
                  </Card>
                )}

                {selectedPaymentMethod === "stripe" && (
                  <StripePaymentWrapper id={orderDetails.id} />
                )}
              </>
            )}

            {orderDetails.isPaid && !orderDetails.isRefunded && !orderDetails.refund_request && (
              <Button variant="outline-danger" className="w-100 mt-3" onClick={() => setShowRefundModal(true)}>Yêu cầu hoàn tiền</Button>
            )}

            {refundMessage && <Alert className="mt-3" variant="info">{refundMessage}</Alert>}
          </Col>
        </Row>
      )}

      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)}>
        <Modal.Header closeButton><Modal.Title>Yêu cầu hoàn tiền</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Lý do</Form.Label>
              <Form.Control as="textarea" rows={3} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRefundModal(false)}>Hủy</Button>
          <Button variant="danger" onClick={submitRefundRequest}>Gửi</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default OrderDetailsPage;