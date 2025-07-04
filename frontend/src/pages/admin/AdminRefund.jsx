import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal } from 'react-bootstrap';
import AdminLayout from '../../components/admin/AdminLayout';
import httpService from '../../services/httpService';
import { formatVND } from '../../utils/currency';

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
      console.log('Refunds fetched:', response.data);
      setRefunds(response.data);
    } catch (error) {
      console.error('Error fetching refund requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefundAction = async (id, approved) => {
    try {
      await httpService.post(`/api/refunds/handle/`, {
        id,
        approved,
      });
      fetchRefundRequests();
      setShowModal(false);
    } catch (error) {
      console.error('Error handling refund:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

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
                        <tr key={refund.id}>
                          <td>{refund.id}</td>
                          <td>{refund.user?.username || 'Unknown'}</td>
                          <td>#{refund.order?.id}</td>
                          <td>{refund.reason}</td>
                          <td>
                            <Badge bg={refund.isApproved === null ? 'secondary' : refund.isApproved ? 'success' : 'danger'}>
                              {refund.isApproved === null ? 'Pending' : refund.isApproved ? 'Approved' : 'Rejected'}
                            </Badge>
                          </td>
                          <td>{formatDate(refund.createdAt)}</td>
                          <td>
                            {refund.isApproved === null && (
                              <div className="d-flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  onClick={() => handleRefundAction(refund.id, true)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleRefundAction(refund.id, false)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
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
      </div>
    </AdminLayout>
  );
};

export default AdminRefund;
