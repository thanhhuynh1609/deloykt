import React, { useContext, useEffect } from "react";
import { Container, Row, Col, Tab, Tabs } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/userContext";
import PayboxContext from "../context/payboxContext";
import PayboxWallet from "../components/PayboxWallet";
import PayboxDeposit from "../components/PayboxDeposit";
import PayboxDepositSimple from "../components/PayboxDepositSimple";
import PayboxDepositTest from "../components/PayboxDepositTest";
import PayboxTransactions from "../components/PayboxTransactions";
import PayboxDebug from "../components/PayboxDebug";
import PayboxSimpleTest from "../components/PayboxSimpleTest";
import Loader from "../components/loader";
import Message from "../components/message";

function PayboxPage() {
  const navigate = useNavigate();
  const { userInfo, loading: userLoading } = useContext(UserContext);
  const { wallet, loading: payboxLoading } = useContext(PayboxContext);

  useEffect(() => {
    if (!userLoading && !userInfo) {
      navigate("/login?redirect=/paybox");
    }
  }, [userInfo, userLoading, navigate]);

  if (userLoading || payboxLoading) {
    return <Loader />;
  }

  if (!userInfo) {
    return (
      <Container>
        <Message variant="warning">
          Vui lòng đăng nhập để sử dụng ví Paybox
        </Message>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex align-items-center mb-4">
            <h2 className="mb-0">
              <i className="fas fa-wallet me-3 text-primary"></i>
              Ví Paybox
            </h2>
          </div>
          
          <p className="text-muted mb-4">
            Quản lý ví điện tử của bạn - Nạp tiền, thanh toán và theo dõi giao dịch một cách dễ dàng.
          </p>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Tabs defaultActiveKey="overview" className="mb-4">
            <Tab eventKey="overview" title={
              <span>
                <i className="fas fa-chart-line me-2"></i>
                Tổng quan
              </span>
            }>
              <Row>
                <Col>
                  <PayboxSimpleTest />
                  <PayboxDebug />
                  <PayboxWallet />
                </Col>
              </Row>
              
              <Row>
                <Col>
                  <PayboxTransactions />
                </Col>
              </Row>
            </Tab>
            
            <Tab eventKey="deposit" title={
              <span>
                <i className="fas fa-plus-circle me-2"></i>
                Nạp tiền
              </span>
            }>
              <Row>
                <Col lg={8}>
                  <PayboxDepositSimple />
                </Col>
                <Col lg={4}>
                  <div className="bg-light p-3 rounded">
                    <h6 className="mb-3">
                      <i className="fas fa-info-circle me-2"></i>
                      Hướng dẫn nạp tiền
                    </h6>
                    <ol className="small">
                      <li>Nhập số tiền muốn nạp (tối thiểu 10.000 VND)</li>
                      <li>Chọn "Tiếp tục thanh toán"</li>
                      <li>Nhập thông tin thẻ tín dụng/ghi nợ</li>
                      <li>Xác nhận thanh toán</li>
                      <li>Tiền sẽ được nạp vào ví ngay lập tức</li>
                    </ol>
                    
                    <div className="mt-3">
                      <h6 className="mb-2">
                        <i className="fas fa-shield-alt me-2"></i>
                        Bảo mật
                      </h6>
                      <ul className="small mb-0">
                        <li>Thanh toán được bảo mật bởi Stripe</li>
                        <li>Thông tin thẻ được mã hóa SSL</li>
                        <li>Chúng tôi không lưu trữ thông tin thẻ</li>
                      </ul>
                    </div>
                  </div>
                </Col>
              </Row>
            </Tab>
            
            <Tab eventKey="transactions" title={
              <span>
                <i className="fas fa-history me-2"></i>
                Lịch sử
              </span>
            }>
              <PayboxTransactions />
            </Tab>
          </Tabs>
        </Col>
        
        <Col lg={4}>
          <div className="sticky-top" style={{ top: '20px' }}>
            {/* Quick Stats */}
            <div className="bg-primary text-white p-3 rounded mb-3">
              <h6 className="mb-2">
                <i className="fas fa-bolt me-2"></i>
                Thanh toán nhanh
              </h6>
              <p className="small mb-0">
                Sử dụng ví Paybox để thanh toán đơn hàng chỉ với 1 click, 
                không cần nhập lại thông tin thẻ.
              </p>
            </div>
            
            {/* Benefits */}
            <div className="bg-light p-3 rounded">
              <h6 className="mb-3">
                <i className="fas fa-star me-2"></i>
                Ưu điểm của ví Paybox
              </h6>
              <ul className="small mb-0">
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Thanh toán tức thì
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Bảo mật cao với Stripe
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Theo dõi chi tiêu dễ dàng
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Không phí giao dịch
                </li>
                <li>
                  <i className="fas fa-check text-success me-2"></i>
                  Hỗ trợ 24/7
                </li>
              </ul>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default PayboxPage;
