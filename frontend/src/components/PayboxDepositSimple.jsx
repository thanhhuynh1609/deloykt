import React, { useState, useContext, useEffect } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PayboxContext from "../context/payboxContext";
import PayboxDepositForm from "./PayboxDepositForm";

// Stripe publishable key
const stripePromise = loadStripe(
  "pk_test_51RPcK7CrdiAruMyrzDn1P7rG9cpU4oiEblmxvu8NaGqojPJim3266dMKKYlg6s6mZbCyrE5HyMkiBO0D7cygWJIg00ciOGJswd"
);

function PayboxDepositSimple() {
  const [amount, setAmount] = useState("100000");
  const [step, setStep] = useState("input"); // "input", "payment", "success"
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [message, setMessage] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  
  const { createDepositIntent, loading, error, formatVND } = useContext(PayboxContext);

  // Debug state changes
  useEffect(() => {
    console.log("=== PayboxDepositSimple State Change ===");
    console.log("step:", step);
    console.log("clientSecret:", clientSecret ? "Present" : "Missing");
    console.log("paymentIntentId:", paymentIntentId);
    console.log("amount:", amount);
    console.log("PayboxContext loading:", loading);
    console.log("localLoading:", localLoading);
  }, [step, clientSecret, paymentIntentId, amount, loading, localLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("=== PayboxDepositSimple: handleSubmit ===");
    console.log("Current step:", step);
    console.log("Amount:", amount);
    
    const depositAmount = parseInt(amount);
    if (!depositAmount || depositAmount < 10000) {
      setMessage("Số tiền nạp tối thiểu là 10.000 VND");
      return;
    }

    try {
      setLocalLoading(true);
      console.log("Calling createDepositIntent...");
      const data = await createDepositIntent(depositAmount);
      console.log("Got response:", data);

      if (data && data.clientSecret) {
        console.log("Setting state - clientSecret:", data.clientSecret);
        console.log("Setting state - paymentIntentId:", data.paymentIntentId);

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setMessage("");

        console.log("About to set step to payment");
        setStep("payment");
        console.log("Step set to payment");
      } else {
        setMessage("Không nhận được client secret từ server");
      }
    } catch (ex) {
      console.error("Error in handleSubmit:", ex);
      setMessage("Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    console.log("Payment success, moving to success step");
    setStep("success");
    setMessage("Nạp tiền thành công!");
  };

  const handlePaymentCancel = () => {
    console.log("Payment cancelled, back to input step");
    setStep("input");
    setClientSecret("");
    setPaymentIntentId("");
  };

  const handleReset = () => {
    setStep("input");
    setClientSecret("");
    setPaymentIntentId("");
    setMessage("");
    setAmount("100000");
  };

  console.log("=== PayboxDepositSimple Render ===");
  console.log("Current step:", step);
  console.log("ClientSecret:", clientSecret ? "Present" : "Missing");

  // Step 1: Input amount
  if (step === "input") {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">💰 Nạp tiền vào ví (Simple)</h5>
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

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Số tiền nạp (VND)</Form.Label>
              <Form.Control
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10000"
                step="1000"
              />
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              disabled={localLoading}
              className="w-100"
            >
              {localLoading ? "Đang xử lý..." : "Tiếp tục thanh toán"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    );
  }

  // Step 2: Payment form
  if (step === "payment" && clientSecret) {
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
          <h5 className="mb-0">💳 Thanh toán nạp tiền</h5>
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

  // Step 3: Success
  if (step === "success") {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">✅ Nạp tiền thành công</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="success">
            Đã nạp thành công {formatVND(amount)} vào ví Paybox!
          </Alert>
          
          <Button variant="primary" onClick={handleReset}>
            Nạp tiền lần nữa
          </Button>
        </Card.Body>
      </Card>
    );
  }

  // Fallback
  return (
    <Card>
      <Card.Body>
        <Alert variant="warning">
          Trạng thái không xác định: {step}
        </Alert>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </Card.Body>
    </Card>
  );
}

export default PayboxDepositSimple;
