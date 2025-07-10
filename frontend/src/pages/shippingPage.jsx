import React, { useState, useContext, useEffect } from "react";
import { Form, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/userContext";
import FormContainer from "../components/formContainer";
import CartContext from "../context/cartContext";
import CheckoutSteps from "../components/checkoutSteps";

function ShippingPage() {
  const { userInfo } = useContext(UserContext);
  const { shippingAddress, updateShippingAddress } = useContext(CartContext);

  const [address, setAddress] = useState(shippingAddress?.address || "");
  const [city, setCity] = useState(shippingAddress?.city || "");
  const [postalCode, setPostalCode] = useState(shippingAddress?.postalCode || "");
  const [country, setCountry] = useState(shippingAddress?.country || "");

  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo || !userInfo.username) navigate("/");
  }, [userInfo, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateShippingAddress(address, city, postalCode, country);
    navigate("/payment");
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 />
      <h2 className="mb-4 text-center" style={{ textTransform: "none" }}>
        📦 Thông tin giao hàng
      </h2>
      <Card className="p-4 shadow-sm rounded-3">
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="address" className="mb-3">
            <Form.Label>🏠 Đường, xã/phường</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="Nhập số nhà, tên đường, xã/phường..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="city" className="mb-3">
            <Form.Label>🏙️ Thành phố</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="Nhập tên thành phố"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="postalCode" className="mb-3">
            <Form.Label>📮 Mã bưu điện</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="Nhập mã vùng (VD: 550000)"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </Form.Group>

          <Form.Group controlId="country" className="mb-4">
            <Form.Label>🌏 Quốc gia</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="Nhập quốc gia (VD: Việt Nam)"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </Form.Group>

          <Button
            type="submit"
            variant="success"
            className="w-100 py-2 fw-bold"
            style={{ textTransform: "none" }}
          >
            Tiếp tục đến thanh toán
          </Button>
        </Form>
      </Card>
    </FormContainer>
  );
}

export default ShippingPage;
