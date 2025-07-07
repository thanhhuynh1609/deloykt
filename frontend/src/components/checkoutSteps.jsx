import React from "react";
import { Nav, ProgressBar } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";

function CheckoutSteps({ step1, step2, step3, step4 }) {
  return (
    <div>
      <ProgressBar
        variant="primary"
        now={step4 ? 80 : step3 ? 60 : step2 ? 40 : step1 ? 20 : 0}
        className="my-2"
      />
      <Nav className="justify-content-center mb-4" style={{ flexWrap: "nowrap" }}>
        <Nav.Item style={{ textAlign: "center", minWidth: "120px" }}>
          <LinkContainer to="/login">
            <Nav.Link style={{ whiteSpace: "nowrap", display: "inline-block" }}>
              1. Đăng nhập
            </Nav.Link>
          </LinkContainer>
        </Nav.Item>
        <Nav.Item style={{ textAlign: "center", minWidth: "120px" }}>
          <LinkContainer to="/shipping">
            <Nav.Link style={{ whiteSpace: "nowrap", display: "inline-block" }}>
              2. Địa chỉ giao hàng
            </Nav.Link>
          </LinkContainer>
        </Nav.Item>
        <Nav.Item style={{ textAlign: "center", minWidth: "120px" }}>
          <Nav.Link disabled style={{ whiteSpace: "nowrap", display: "inline-block" }}>
            3. Thanh toán
          </Nav.Link>
        </Nav.Item>
        <Nav.Item style={{ textAlign: "center", minWidth: "120px" }}>
          <Nav.Link disabled style={{ whiteSpace: "nowrap", display: "inline-block" }}>
            4. Đặt hàng
          </Nav.Link>
        </Nav.Item>
      </Nav>

    </div>
  );
}

export default CheckoutSteps;
