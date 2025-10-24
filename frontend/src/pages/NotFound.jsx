import React from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";

function NotFound() {
  return (
    <Container className="text-center py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <div className="error-page">
            <h1 className="display-1 fw-bold text-primary">404</h1>
            <h2 className="mb-4">Con mẹ nó</h2>
            <p className="mb-4 text-muted">
              Đi đâu đây bờ ra đơ!!!!!!!!!!!!!!!!!!!!!!!!
            </p>
            <Link to="/">
              <Button variant="warning" size="m">
                Về trang chủ
              </Button>
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default NotFound;
