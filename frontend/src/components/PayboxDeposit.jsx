import React, { useState, useContext } from "react";
import { Card, Form, Button, Row, Col, Alert } from "react-bootstrap";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PayboxContext from "../context/payboxContext";
import PayboxDepositForm from "./PayboxDepositForm";

// Stripe publishable key
const stripePromise = loadStripe(
  "pk_test_51RPcK7CrdiAruMyrzDn1P7rG9cpU4oiEblmxvu8NaGqojPJim3266dMKKYlg6s6mZbCyrE5HyMkiBO0D7cygWJIg00ciOGJswd"
);

function PayboxDeposit() {
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [message, setMessage] = useState("");
  
  const { createDepositIntent, loading, error, formatVND } = useContext(PayboxContext);

  // Các mức tiền gợi ý
  const suggestedAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount.toString());
  };

  const handleCreateIntent = async (e) => {
    e.preventDefault();

    console.log("=== PayboxDeposit: handleCreateIntent ===");
    console.log("Amount:", amount);

    const depositAmount = parseInt(amount);
    if (!depositAmount || depositAmount < 10000) {
      setMessage("Số tiền nạp tối thiểu là 10.000 VND");
      return;
    }

    if (depositAmount > 50000000) {
      setMessage("Số tiền nạp tối đa là 50.000.000 VND");
      return;
    }

    try {
      console.log("Calling createDepositIntent with amount:", depositAmount);
      const data = await createDepositIntent(depositAmount);
      console.log("createDepositIntent response:", data);

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setShowPaymentForm(true);
      setMessage("");

      console.log("State updated - showPaymentForm should be true");
    } catch (ex) {
      console.error("Error in handleCreateIntent:", ex);
      setMessage("Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.");
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setAmount("");
    setClientSecret("");
    setPaymentIntentId("");
    setMessage("Nạp tiền thành công!");
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setClientSecret("");
    setPaymentIntentId("");
  };

  console.log("=== PayboxDeposit Render ===");
  console.log("showPaymentForm:", showPaymentForm);
  console.log("clientSecret:", clientSecret ? "Present" : "Missing");
  console.log("paymentIntentId:", paymentIntentId);

  if (showPaymentForm && clientSecret) {
    console.log("Rendering payment form");

    const appearance = {
      theme: 'stripe',
    };

    const options = {
      clientSecret,
      appearance,
    };

    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-credit-card me-2"></i>
            Thanh toán nạp tiền
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <strong>Số tiền nạp: {formatVND(amount)}</strong>
          </div>
          
          <Elements options={options} stripe={stripePromise}>
            <PayboxDepositForm
              paymentIntentId={paymentIntentId}
              amount={amount}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </Elements>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          <i className="fas fa-plus-circle me-2"></i>
          Nạp tiền vào ví
        </h5>
      </Card.Header>
      <Card.Body>
        {message && (
          <Alert variant={message.includes("thành công") ? "success" : "danger"}>
            {message}
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleCreateIntent}>
          <Form.Group className="mb-3">
            <Form.Label>Số tiền nạp (VND)</Form.Label>
            <Form.Control
              type="number"
              placeholder="Nhập số tiền muốn nạp"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="10000"
              max="50000000"
              step="1000"
            />
            <Form.Text className="text-muted">
              Số tiền nạp từ 10.000 VND đến 50.000.000 VND
            </Form.Text>
          </Form.Group>

          <div className="mb-3">
            <Form.Label>Chọn nhanh</Form.Label>
            <Row>
              {suggestedAmounts.map((suggestedAmount) => (
                <Col xs={6} md={4} key={suggestedAmount} className="mb-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-100"
                    onClick={() => handleAmountSelect(suggestedAmount)}
                  >
                    {formatVND(suggestedAmount)}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading || !amount}
            className="w-100"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-credit-card me-2"></i>
                Tiếp tục thanh toán
              </>
            )}
          </Button>
        </Form>

        <div className="mt-3">
          <small className="text-muted">
            <i className="fas fa-shield-alt me-1"></i>
            Thanh toán được bảo mật bởi Stripe. Chúng tôi không lưu trữ thông tin thẻ của bạn.
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}

export default PayboxDeposit;
