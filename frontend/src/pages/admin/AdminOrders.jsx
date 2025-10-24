import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal } from 'react-bootstrap';
import AdminLayout from '../../components/admin/AdminLayout';
import httpService from '../../services/httpService';
import './AdminOrders.css';
import { formatVND } from '../../utils/currency';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await httpService.get('/api/orders/');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await httpService.patch(`/api/orders/${orderId}/`, { 
        isDelivered: status === 'delivered' 
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (order) => {
    if (order.isDelivered) {
      return <Badge bg="success">Delivered</Badge>;
    } else if (order.isPaid) {
      return <Badge bg="warning">Processing</Badge>;
    } else {
      return <Badge bg="danger">Pending Payment</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-orders">
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Quản lý đơn hàng</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Người mua</th>
                      <th>Ngày</th>
                      <th>Tiền</th>
                      <th>thanh toán</th>
                      <th>trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>
                          <strong>#{order.id}</strong>
                        </td>
                        <td>
                          <div>
                            <strong>{order.user?.username || 'Guest'}</strong>
                            <br />
                            <small className="text-muted">
                              {order.user?.email}
                            </small>
                          </div>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>
                          <strong>{formatVND(order.totalPrice)}</strong>
                        </td>
                        <td>
                          <Badge bg={order.isPaid ? 'success' : 'danger'}>
                            {order.isPaid ? 'Paid' : 'Unpaid'}
                          </Badge>
                          {order.isPaid && (
                            <div>
                              <small className="text-muted">
                                {formatDate(order.paidAt)}
                              </small>
                            </div>
                          )}
                        </td>
                        <td>{getStatusBadge(order)}</td>
                        <td>
                          <div className="action-buttons">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleShowOrderDetails(order)}
                              className="me-1"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            {order.isPaid && !order.isDelivered && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                              >
                                <i className="fas fa-check"></i>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Order Details Modal */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Order Details - #{selectedOrder?.id}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedOrder && (
              <div>
                <Row className="mb-3">
                  <Col md={6}>
                    <h6>Customer Information</h6>
                    <p>
                      <strong>Name:</strong> {selectedOrder.user?.username}<br />
                      <strong>Email:</strong> {selectedOrder.user?.email}
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6>Order Information</h6>
                    <p>
                      <strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}<br />
                      <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
                    </p>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <h6>Shipping Address</h6>
                    {selectedOrder.shippingAddress ? (
                      <p>
                        {selectedOrder.shippingAddress.address}<br />
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}<br />
                        {selectedOrder.shippingAddress.country}
                      </p>
                    ) : (
                      <p className="text-muted">No shipping address</p>
                    )}
                  </Col>
                  <Col md={6}>
                    <h6>Order Status</h6>
                    <p>
                      <strong>Payment:</strong> {getStatusBadge(selectedOrder)}<br />
                      <strong>Delivery:</strong> {selectedOrder.isDelivered ? 
                        <Badge bg="success">Delivered</Badge> : 
                        <Badge bg="warning">Not Delivered</Badge>
                      }
                    </p>
                  </Col>
                </Row>

                <h6>Order Items</h6>
                <Table striped>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.orderItems?.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={item.image || '/api/placeholder/40/40'}
                              alt={item.productName}
                              className="order-item-image me-2"
                            />
                            <div>
                              {item.productName}
                              {item.variant_info && (
                                <div className="text-muted small">
                                  <i className="fas fa-tag"></i> {item.variant_info}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{item.qty}</td>
                        <td>{formatVND(item.price)}</td>
                        <td>{formatVND(item.qty * item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <Row className="mt-3">
                  <Col md={6} className="ms-auto">
                    <Table borderless>
                      <tbody>
                        <tr>
                          <td><strong>Subtotal:</strong></td>
                          <td>{formatVND(selectedOrder.totalPrice - selectedOrder.taxPrice - selectedOrder.shippingPrice)}</td>
                        </tr>
                        <tr>
                          <td><strong>Shipping:</strong></td>
                          <td>{formatVND(selectedOrder.shippingPrice)}</td>
                        </tr>
                        <tr>
                          <td><strong>Tax:</strong></td>
                          <td>{formatVND(selectedOrder.taxPrice)}</td>
                        </tr>
                        <tr className="border-top">
                          <td><strong>Total:</strong></td>
                          <td><strong>{formatVND(selectedOrder.totalPrice)}</strong></td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
            {selectedOrder?.isPaid && !selectedOrder?.isDelivered && (
              <Button 
                variant="success" 
                onClick={() => {
                  updateOrderStatus(selectedOrder.id, 'delivered');
                  handleCloseModal();
                }}
              >
                Mark as Delivered
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
