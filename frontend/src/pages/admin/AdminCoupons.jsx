import React, { useEffect, useState } from "react";
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../services/couponService";
import { Table, Button, Modal, Form } from "react-bootstrap";
import AdminLayout from '../../components/admin/AdminLayout';

function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_amount: "",
    min_order_amount: "",
    valid_from: "",
    valid_to: "",
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons().then(res => setCoupons(res.data));
  }, []);

  const handleShowModal = (coupon = null) => {
    setEditingCoupon(coupon);
    setForm(
      coupon
        ? { ...coupon }
        : {
            code: "",
            description: "",
            discount_amount: "",
            min_order_amount: "",
            valid_from: "",
            valid_to: "",
            is_active: true,
          }
    );
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editingCoupon) {
      await updateCoupon(editingCoupon.id, form);
    } else {
      await createCoupon(form);
    }
    setShowModal(false);
    fetchCoupons().then(res => setCoupons(res.data));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xóa mã giảm giá này?")) {
      await deleteCoupon(id);
      fetchCoupons().then(res => setCoupons(res.data));
    }
  };

  return (
    <AdminLayout>
    <div>
      <h2>Quản lý mã giảm giá</h2>
      <Button onClick={() => handleShowModal()}>Thêm mã giảm giá</Button>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Mô tả</th>
            <th>Giảm</th>
            <th>Đơn tối thiểu</th>
            <th>Ngày bắt đầu</th>
            <th>Ngày kết thúc</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id}>
              <td>{c.code}</td>
              <td>{c.description}</td>
              <td>{c.discount_amount} VND</td>
              <td>{c.min_order_amount} VND</td>
              <td>{c.valid_from}</td>
              <td>{c.valid_to}</td>
              <td>{c.is_active ? "Hoạt động" : "Tắt"}</td>
              <td>
                <Button size="sm" onClick={() => handleShowModal(c)}>Sửa</Button>{" "}
                <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>Xóa</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingCoupon ? "Sửa" : "Thêm"} mã giảm giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Mã</Form.Label>
              <Form.Control value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Mô tả</Form.Label>
              <Form.Control value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Số tiền giảm (VND)</Form.Label>
              <Form.Control type="number" value={form.discount_amount} onChange={e => setForm({ ...form, discount_amount: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Đơn tối thiểu (VND)</Form.Label>
              <Form.Control type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Ngày bắt đầu</Form.Label>
              <Form.Control type="datetime-local" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Ngày kết thúc</Form.Label>
              <Form.Control type="datetime-local" value={form.valid_to} onChange={e => setForm({ ...form, valid_to: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Check label="Hoạt động" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSave}>Lưu</Button>
        </Modal.Footer>
      </Modal>
    </div>
    </AdminLayout>
  );
}

export default AdminCoupons;