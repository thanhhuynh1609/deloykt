import React, { useState, useContext } from "react";
import { Form, Button, Col, Alert, Card } from "react-bootstrap";
import FormContainer from "../components/formContainer";
import CheckoutSteps from "../components/checkoutSteps";
import { useNavigate } from "react-router-dom";
import CartContext from "../context/cartContext";
import PayboxContext from "../context/payboxContext";

function PaymentPage() {
  const {
    shippingAddress,
    paymentMethod,
    updatePaymentMethod,
    totalPrice,
    couponCode,
    setCouponCode,
    couponMessage,
    discountAmount,
    applyCoupon,
    error,
  } = useContext(CartContext);

  const { wallet, formatVND, hasSufficientBalance } = useContext(PayboxContext);
  const [localPaymentMethod, setLocalPaymentMethod] = useState(paymentMethod);
  const navigate = useNavigate();

  const totalAfterDiscount = totalPrice - discountAmount;

  if (!shippingAddress || !shippingAddress.address) navigate("/shipping");

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePaymentMethod(localPaymentMethod);
    navigate("/placeorder");
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 step3 />
      <h2 className="mb-4 text-center" style={{ textTransform: "none" }}>
        💳 Chọn phương thức thanh toán
      </h2>

      {error && (
        <Alert variant="danger" className="mt-2">
          {error}
        </Alert>
      )}

      <Card className="p-4 shadow-sm rounded-3 mb-4">
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <Form.Label as="legend" className="fw-semibold">
              Hình thức thanh toán
            </Form.Label>
            <Col>
              <Form.Check
                type="radio"
                label="💳 Stripe"
                id="stripe"
                name="paymentMethod"
                value="Stripe"
                onChange={(e) => setLocalPaymentMethod(e.currentTarget.value)}
                checked={localPaymentMethod === "Stripe"}
                className="mb-3"
              />

              <Form.Check
                type="radio"
                label={
                  <div>
                    <span>💰 Ví Paybox</span>
                    {wallet && (
                      <small className="text-muted d-block">
                        Số dư: {formatVND(wallet.balance)}
                      </small>
                    )}
                  </div>
                }
                id="paybox"
                name="paymentMethod"
                value="Paybox"
                onChange={(e) => setLocalPaymentMethod(e.currentTarget.value)}
                checked={localPaymentMethod === "Paybox"}
                disabled={!wallet || !hasSufficientBalance(totalPrice)}
                className="mb-2"
              />

              {localPaymentMethod === "Paybox" && wallet && !hasSufficientBalance(totalPrice) && (
                <Alert variant="warning" className="mt-2">
                  <small>
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Số dư ví không đủ. Vui lòng <a href="/paybox">nạp thêm tiền</a> hoặc chọn phương thức khác.
                  </small>
                </Alert>
              )}

              {!wallet && (
                <Alert variant="info" className="mt-2">
                  <small>
                    <i className="fas fa-info-circle me-1"></i>
                    <a href="/paybox">Tạo ví Paybox</a> để thanh toán nhanh chóng.
                  </small>
                </Alert>
              )}
            </Col>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">Mã giảm giá</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="text"
                placeholder="Nhập mã giảm giá"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{ maxWidth: 220 }}
              />
              <Button
                variant="outline-primary"
                className="ms-2"
                onClick={() => applyCoupon(couponCode)}
                disabled={!couponCode}
                type="button"
              >
                Áp dụng
              </Button>
            </div>

            {couponMessage && (
              <div className="mt-2">
                <small
                  className={couponMessage.includes("hợp lệ") ? "text-success" : "text-danger"}
                >
                  {couponMessage}
                </small>
                {discountAmount > 0 && (
                  <small className="text-success d-block">
                    Giảm: {formatVND(discountAmount)}
                  </small>
                )}
              </div>
            )}
          </Form.Group>

          <div className="mb-3">
            <strong>Tổng cộng: </strong>
            <span className="fs-5 text-primary">
              {formatVND(totalAfterDiscount)}
            </span>
            {discountAmount > 0 && (
              <small className="text-success d-block">
                (Đã giảm {formatVND(discountAmount)})
              </small>
            )}
          </div>

          <Button type="submit" variant="success" className="w-100 py-2 fw-bold">
            Tiếp tục đặt hàng
          </Button>
        </Form>
      </Card>
    </FormContainer>
  );
}

export default PaymentPage;
