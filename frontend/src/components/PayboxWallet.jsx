import React, { useContext } from "react";
import { Card, Row, Col, Badge } from "react-bootstrap";
import PayboxContext from "../context/payboxContext";
import Loader from "./loader";
import Message from "./message";

function PayboxWallet() {
  const { wallet, loading, error, formatVND } = useContext(PayboxContext);

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!wallet) return <Message variant="info">Không tìm thấy thông tin ví</Message>;

  return (
    <Card className="mb-4">
      <Card.Header>
        <Row className="align-items-center">
          <Col>
            <h5 className="mb-0">
              <i className="fas fa-wallet me-2"></i>
              Ví Paybox
            </h5>
          </Col>
          <Col xs="auto">
            <Badge bg={wallet.is_active ? "success" : "danger"}>
              {wallet.is_active ? "Hoạt động" : "Tạm khóa"}
            </Badge>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                <i className="fas fa-coins fa-2x text-warning"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1">Số dư hiện tại</h6>
                <h3 className="mb-0 text-primary">
                  {formatVND(wallet.balance)}
                </h3>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                <i className="fas fa-calendar-alt fa-2x text-info"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1">Ngày tạo</h6>
                <p className="mb-0">
                  {new Date(wallet.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </Col>
        </Row>
        
        <Row className="mt-3">
          <Col>
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              Ví Paybox cho phép bạn thanh toán đơn hàng một cách nhanh chóng và tiện lợi.
              Bạn có thể nạp tiền vào ví thông qua thẻ tín dụng/ghi nợ.
            </small>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export default PayboxWallet;
