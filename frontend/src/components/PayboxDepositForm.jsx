import React, { useState, useContext } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button, Alert } from "react-bootstrap";
import PayboxContext from "../context/payboxContext";

function PayboxDepositForm({ paymentIntentId, amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const { confirmDeposit, formatVND } = useContext(PayboxContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      // Xác nhận thanh toán với Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/paybox`,
        },
        redirect: "if_required",
      });

      if (error) {
        setMessage(error.message);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Xác nhận với backend
        try {
          await confirmDeposit(paymentIntent.id);
          setMessage("Nạp tiền thành công!");
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } catch (ex) {
          setMessage("Có lỗi xảy ra khi xác nhận giao dịch. Vui lòng liên hệ hỗ trợ.");
        }
      }
    } catch (ex) {
      setMessage("Có lỗi xảy ra trong quá trình thanh toán.");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {message && (
        <Alert variant={message.includes("thành công") ? "success" : "danger"} className="mb-3">
          {message}
        </Alert>
      )}
      
      <div className="mb-3">
        <PaymentElement />
      </div>
      
      <div className="d-grid gap-2">
        <Button
          type="submit"
          variant="success"
          disabled={isLoading || !stripe || !elements}
          size="lg"
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin me-2"></i>
              Đang xử lý thanh toán...
            </>
          ) : (
            <>
              <i className="fas fa-check me-2"></i>
              Nạp {formatVND(amount)}
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          <i className="fas fa-times me-2"></i>
          Hủy
        </Button>
      </div>
      
      <div className="mt-3 text-center">
        <small className="text-muted">
          <i className="fas fa-lock me-1"></i>
          Thanh toán an toàn với mã hóa SSL
        </small>
      </div>
    </form>
  );
}

export default PayboxDepositForm;
