import React, { useContext } from "react";
import { Card, Table, Badge, Button } from "react-bootstrap";
import PayboxContext from "../context/payboxContext";
import Loader from "./loader";
import Message from "./message";

function PayboxTransactions() {
  const { transactions, loading, error, formatVND, fetchTransactions } = useContext(PayboxContext);

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

  const getAmountDisplay = (transaction) => {
    const isPositive = transaction.transaction_type === 'DEPOSIT' || transaction.transaction_type === 'REFUND';
    const className = isPositive ? 'text-success' : 'text-danger';
    const sign = isPositive ? '+' : '-';
    
    return (
      <span className={className}>
        {sign}{formatVND(transaction.amount)}
      </span>
    );
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="fas fa-history me-2"></i>
          Lịch sử giao dịch
        </h5>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={fetchTransactions}
          disabled={loading}
        >
          <i className="fas fa-sync-alt me-1"></i>
          Làm mới
        </Button>
      </Card.Header>
      <Card.Body className="p-0">
        {transactions.length === 0 ? (
          <div className="text-center py-4">
            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
            <p className="text-muted">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Loại giao dịch</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Mô tả</th>
                  <th>Thời gian</th>
                  <th>Số dư sau GD</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2">
                          {getTransactionIcon(transaction.transaction_type)}
                        </span>
                        <span>{transaction.transaction_type_display}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{getAmountDisplay(transaction)}</strong>
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
                    <td>
                      <span className="text-primary">
                        {formatVND(transaction.balance_after)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
      
      {transactions.length > 0 && (
        <Card.Footer className="text-muted">
          <small>
            <i className="fas fa-info-circle me-1"></i>
            Hiển thị {transactions.length} giao dịch gần nhất
          </small>
        </Card.Footer>
      )}
    </Card>
  );
}

export default PayboxTransactions;
