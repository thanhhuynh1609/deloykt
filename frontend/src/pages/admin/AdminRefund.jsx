import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal } from 'react-bootstrap';
import AdminLayout from '../../components/admin/AdminLayout';
import httpService from '../../services/httpService';

const AdminRefund = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  const fetchRefundRequests = async () => {
    try {
      const response = await httpService.get('/api/paybox/refund-requests/');
      setRefunds(response.data);
    } catch (error) {
      console.error('Error fetching refund requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefundAction = async (orderId, approved) => {
    try {
      const url = approved
        ? `/api/admin/paybox/refund/${orderId}/approve/`
        : `/api/admin/paybox/refund/${orderId}/reject/`;
      const method = approved ? 'post' : 'delete';
      await httpService[method](url);
      fetchRefundRequests();
    } catch (error) {
      console.error('Error handling refund:', error);
    }
  };

  const handleDeleteRefund = async () => {
    if (!selectedRefund) return;
    try {
      await httpService.delete(`/api/admin/paybox/refund/${selectedRefund.order.id}/delete/`);
      fetchRefundRequests();
    } catch (error) {
      console.error('Error deleting refund request:', error);
    } finally {
      setShowModal(false);
      setSelectedRefund(null);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  return (
    <AdminLayout>
      <div className="admin-refund-requests">
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Refund Requests</h5>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Order</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Requested At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refunds.map((refund) => (
                        <tr key={`refund-${refund.id}`}>
                          <td>{refund.id}</td>
                          <td>{refund.user?.username || 'Unknown'}</td>
                          <td>#{refund.order?.id}</td>
                          <td>{refund.reason}</td>
                          <td>
                            <Badge bg={
                              refund.isApproved === null
                                ? 'secondary'
                                : refund.isApproved
                                ? 'success'
                                : 'danger'
                            }>
                              {refund.isApproved === null
                                ? 'Pending'
                                : refund.isApproved
                                ? 'Approved'
                                : 'Rejected'}
                            </Badge>
                          </td>
                          <td>{formatDate(refund.createdAt)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              {refund.isApproved === null && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline-success"
                                    onClick={() => handleRefundAction(refund.order.id, true)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleRefundAction(refund.order.id, false)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setShowModal(true);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Confirm Delete Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Xác nhận xoá</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Bạn có chắc chắn muốn xoá yêu cầu hoàn tiền của đơn hàng #{selectedRefund?.order?.id} không?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Huỷ
            </Button>
            <Button variant="danger" onClick={handleDeleteRefund}>
              Xoá
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminRefund;
