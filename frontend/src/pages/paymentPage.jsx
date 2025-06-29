import React, { useState, useContext } from "react";
import { Form, Button, Col, Alert } from "react-bootstrap";
import FormContainer from "../components/formContainer";
import CheckoutSteps from "../components/checkoutSteps";
import { useNavigate } from "react-router-dom";
import CartContext from "../context/cartContext";
import PayboxContext from "../context/payboxContext";

function PaymentPage(props) {
  const { shippingAddress, paymentMethod:method, updatePaymentMethod, totalPrice } = useContext(CartContext);
  const { wallet, formatVND, hasSufficientBalance } = useContext(PayboxContext);
  const [paymentMethod, setPaymentMethod] = useState(method);
  const navigate = useNavigate();

  if (!shippingAddress || !shippingAddress.address) navigate("/shipping");

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePaymentMethod(paymentMethod)
    navigate("/placeorder");
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 step3 />
      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label as="legend">Select Method</Form.Label>
          <Col>
            <Form.Check
              type="radio"
              label="Stripe or Debit Card"
              id="stripe"
              name="paymentMethod"
              value="Stripe"
              onChange={(e) => {
                setPaymentMethod(e.currentTarget.value);
              }}
              checked={"Stripe" == paymentMethod}
            ></Form.Check>

            <Form.Check
              type="radio"
              label={
                <div>
                  <span>Ví Paybox</span>
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
              onChange={(e) => {
                setPaymentMethod(e.currentTarget.value);
              }}
              checked={"Paybox" == paymentMethod}
              disabled={!wallet || !hasSufficientBalance(totalPrice)}
            ></Form.Check>

            {paymentMethod === "Paybox" && wallet && !hasSufficientBalance(totalPrice) && (
              <Alert variant="warning" className="mt-2">
                <small>
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  Số dư ví không đủ. Vui lòng <a href="/paybox">nạp thêm tiền</a> hoặc chọn phương thức thanh toán khác.
                </small>
              </Alert>
            )}

            {!wallet && (
              <Alert variant="info" className="mt-2">
                <small>
                  <i className="fas fa-info-circle me-1"></i>
                  <a href="/paybox">Tạo ví Paybox</a> để thanh toán nhanh chóng và tiện lợi.
                </small>
              </Alert>
            )}
            {/* <Form.Check
              type="radio"
              label="Cash on Delivery"
              id="cod"
              value="Cash on Delivery"
              onChange={(e) => {
                setPaymentMethod(e.currentTarget.value);
              }}
              checked={"Cash on Delivery" == paymentMethod}
            ></Form.Check> */}
          </Col>
        </Form.Group>
        <Button type="submit" variant="primary">
          Continue
        </Button>
      </Form>
    </FormContainer>
  );
}

export default PaymentPage;
