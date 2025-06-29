import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Badge, Button, Form, Alert } from "react-bootstrap";
import httpService from "../../services/httpService";
import Loader from "../../components/loader";
import AdminLayout from "../../components/admin/AdminLayout"; // Thêm dòng này sau các import khác
import Message from "../../components/message";

function AdminPaybox() {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("wallets");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch wallets and transactions from admin endpoints
      // Note: You'll need to create admin-specific endpoints
      const [walletsResponse, transactionsResponse] = await Promise.all([
        httpService.get("/api/admin/paybox/wallets/"),
        httpService.get("/api/admin/paybox/transactions/")
      ]);
      
      setWallets(walletsResponse.data);
      setTransactions(transactionsResponse.data);
      setError("");
    } catch (ex) {
      setError("Không thể tải dữ liệu Paybox");
      console.error("Error fetching paybox data:", ex);
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge bg="success">Hoàn thành</Badge>;
      case 'PENDING':
        return <Badge bg="warning">Đang xử lý</Badge>;
      case 'FAILED':
        return <Badge bg="danger">Thất bại</Badge>;
      case 'CANCELLED':
        return <Badge bg="secondary">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return <i className="fas fa-plus-circle text-success"></i>;
      case 'PAYMENT':
        return <i className="fas fa-shopping-cart text-primary"></i>;
      case 'REFUND':
        return <i className="fas fa-undo text-info"></i>;
      case 'TRANSFER':
        return <i className="fas fa-exchange-alt text-warning"></i>;
      default:
        return <i className="fas fa-circle text-secondary"></i>;
    }
  };

  const filteredWallets = wallets.filter(wallet =>
    wallet.user_info?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.user_info?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction =>
    transaction.wallet_info?.user_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  return (
    <AdminLayout>
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2>
            <i className="fas fa-wallet me-3"></i>
            Quản lý Paybox
          </h2>
          <p className="text-muted">Quản lý ví điện tử và giao dịch của người dùng</p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{wallets.length}</h3>
              <p className="text-muted mb-0">Tổng số ví</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">
                {formatVND(wallets.reduce((sum, wallet) => sum + parseFloat(wallet.balance || 0), 0))}
              </h3>
              <p className="text-muted mb-0">Tổng số dư</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info">{transactions.length}</h3>
              <p className="text-muted mb-0">Tổng giao dịch</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">
                {transactions.filter(t => t.status === 'COMPLETED').length}
              </h3>
              <p className="text-muted mb-0">Giao dịch thành công</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Navigation Tabs */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button
                variant={activeTab === "wallets" ? "primary" : "outline-primary"}
                onClick={() => setActiveTab("wallets")}
                className="me-2"
              >
                <i className="fas fa-wallet me-1"></i>
                Ví người dùng
              </Button>
              <Button
                variant={activeTab === "transactions" ? "primary" : "outline-primary"}
                onClick={() => setActiveTab("transactions")}
              >
                <i className="fas fa-history me-1"></i>
                Giao dịch
              </Button>
            </div>
            <div className="d-flex">
              <Form.Control
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="me-2"
                style={{ width: "250px" }}
              />
              <Button variant="outline-secondary" onClick={fetchData}>
                <i className="fas fa-sync-alt"></i>
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Content */}
      {activeTab === "wallets" && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Danh sách ví người dùng</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>Số dư</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Cập nhật cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWallets.map((wallet) => (
                    <tr key={wallet.id}>
                      <td>
                        <strong>{wallet.user_info?.username}</strong>
                      </td>
                      <td>{wallet.user_info?.email}</td>
                      <td>
                        <span className="text-primary fw-bold">
                          {formatVND(wallet.balance)}
                        </span>
                      </td>
                      <td>
                        <Badge bg={wallet.is_active ? "success" : "danger"}>
                          {wallet.is_active ? "Hoạt động" : "Tạm khóa"}
                        </Badge>
                      </td>
                      <td>
                        {new Date(wallet.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        {new Date(wallet.updated_at).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {activeTab === "transactions" && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Lịch sử giao dịch</h5>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Người dùng</th>
                    <th>Loại GD</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                    <th>Mô tả</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <strong>{transaction.wallet_info?.user_username}</strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="me-2">
                            {getTransactionIcon(transaction.transaction_type)}
                          </span>
                          <span>{transaction.transaction_type_display}</span>
                        </div>
                      </td>
                      <td>
                        <span className={
                          transaction.transaction_type === 'DEPOSIT' || transaction.transaction_type === 'REFUND'
                            ? 'text-success fw-bold'
                            : 'text-danger fw-bold'
                        }>
                          {transaction.transaction_type === 'DEPOSIT' || transaction.transaction_type === 'REFUND' ? '+' : '-'}
                          {formatVND(transaction.amount)}
                        </span>
                      </td>
                      <td>
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td>
                        <div>
                          {transaction.description}
                          {transaction.order_info && (
                            <div>
                              <small className="text-muted">
                                Đơn hàng #{transaction.order_info.id}
                              </small>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          {new Date(transaction.created_at).toLocaleDateString('vi-VN')}
                        </div>
                        <small className="text-muted">
                          {new Date(transaction.created_at).toLocaleTimeString('vi-VN')}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
    </AdminLayout>
  );
}

export default AdminPaybox;
