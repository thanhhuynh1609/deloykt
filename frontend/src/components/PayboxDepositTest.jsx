import React, { useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import httpService from "../services/httpService";
import PayboxDepositForm from "./PayboxDepositForm";

// Stripe publishable key
const stripePromise = loadStripe(
  "pk_test_51RPcK7CrdiAruMyrzDn1P7rG9cpU4oiEblmxvu8NaGqojPJim3266dMKKYlg6s6mZbCyrE5HyMkiBO0D7cygWJIg00ciOGJswd"
);

function PayboxDepositTest() {
  const [amount, setAmount] = useState("100000");
  const [step, setStep] = useState("input");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("=== PayboxDepositTest: handleSubmit ===");
    console.log("Current step:", step);
    console.log("Amount:", amount);
    
    const depositAmount = parseInt(amount);
    if (!depositAmount || depositAmount < 10000) {
      setMessage("Số tiền nạp tối thiểu là 10.000 VND");
      return;
    }

    try {
      setLoading(true);
      console.log("Making direct API call...");
      
      const { data } = await httpService.post("/api/paybox/deposit/", {
        amount: depositAmount
      });
      
      console.log("Direct API response:", data);
      
      if (data && data.clientSecret) {
        console.log("Setting clientSecret and moving to payment step");
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setStep("payment");
        setMessage("");
      } else {
        setMessage("Không nhận được client secret từ server");
      }
    } catch (ex) {
      console.error("Error in direct API call:", ex);
      setMessage("Lỗi API: " + (ex.response?.data?.error || ex.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    console.log("Payment success");
    setStep("success");
    setMessage("Nạp tiền thành công!");
  };

  const handlePaymentCancel = () => {
    console.log("Payment cancelled");
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

  console.log("=== PayboxDepositTest Render ===");
  console.log("Step:", step);
  console.log("ClientSecret:", clientSecret ? "Present" : "Missing");

  // Step 1: Input
  if (step === "input") {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">🧪 Test Deposit (Independent)</h5>
        </Card.Header>
        <Card.Body>
          {message && (
            <Alert variant={message.includes("thành công") ? "success" : "danger"}>
              {message}
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
              variant="success"
              disabled={loading}
              className="w-100"
            >
              {loading ? "Đang xử lý..." : "🚀 Test Direct API Call"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    );
  }

  // Step 2: Payment
  if (step === "payment" && clientSecret) {
    const appearance = { theme: 'stripe' };
    const options = { clientSecret, appearance };

    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">💳 Test Payment Form</h5>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <strong>Số tiền: {formatVND(amount)}</strong>
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
          <h5 className="mb-0">✅ Test Success</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="success">
            Test thành công! Đã nạp {formatVND(amount)}
          </Alert>
          
          <Button variant="primary" onClick={handleReset}>
            Test lại
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
          Unknown step: {step}
        </Alert>
        <Button onClick={handleReset}>Reset</Button>
      </Card.Body>
    </Card>
  );
}

export default PayboxDepositTest;
