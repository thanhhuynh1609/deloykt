import React, { useEffect, useState } from "react";
import { Container, Row, Col, Table, Alert, Offcanvas, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./TKBPage.css";

const TKBPage = () => {
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        document.title = "Thời khóa biểu sinh viên | UDA";
    }, []);

    const today = new Date();
    const daysOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const weekday = daysOfWeek[today.getDay()];
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    return (
        <div style={{ textTransform: 'none' }}>
            {/* Header */}
            <div className="w-100">
                <Row className="align-items-center m-0 p-2" style={{ backgroundColor: '#009933' }}>
                    <Col xs={8} md={4} className="d-flex align-items-center">
                        <img
                            src="https://my.uda.edu.vn/filetailen/anhsv/99022.jpg"
                            alt="Avatar"
                            className="rounded-circle me-2"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                        <p className="m-0 text-white fs-6">Huỳnh Nguyễn Kim Thanh</p>
                    </Col>
                    <Col xs={4} md={8} className="d-flex justify-content-end align-items-center">
                        {/* Mobile Menu Icon */}
                        <Button variant="link" className="d-md-none text-white fs-3" onClick={() => setShowMenu(true)}>
                            <i className="bi bi-list"></i>
                        </Button>

                        {/* PC View Buttons */}
                        <div className="d-none d-md-flex flex-wrap justify-content-md-end gap-2">
                            <Link to="https://my.uda.edu.vn/sv/test_dk" className="btn btn-link header-btn">Đánh giá</Link>
                            <Link to="https://my.uda.edu.vn/sv/sv_ctdt" className="btn btn-link header-btn">Thông tin Lớp</Link>
                            <Link to="https://my.uda.edu.vn/sv/thongtinsv" className="btn btn-link header-btn">Góc sinh viên</Link>
                            <Link to="https://my.uda.edu.vn/sv/doipass" className="btn btn-link header-btn">Hệ thống</Link>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Offcanvas Menu */}
            <Offcanvas show={showMenu} onHide={() => setShowMenu(false)} placement="end">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Menu</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <div className="d-flex flex-column gap-3">
                        <Link to="https://my.uda.edu.vn/sv/test_dk" className="btn btn-outline-success">Đánh giá</Link>
                        <Link to="https://my.uda.edu.vn/sv/sv_ctdt" className="btn btn-outline-success">Thông tin Lớp</Link>
                        <Link to="https://my.uda.edu.vn/sv/thongtinsv" className="btn btn-outline-success">Góc sinh viên</Link>
                        <Link to="https://my.uda.edu.vn/sv/doipass" className="btn btn-outline-success">Hệ thống</Link>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>

            <Container className="mt-4">
                <h5 className="mb-3">
                    <i className="bi bi-calendar-check"></i> Hôm nay {weekday} ngày: {formattedDate}
                </h5>

                {/* TKB hiện tại */}
                <div className="p-3 bg-success bg-opacity-10 mt-3 rounded">
                    <h6 className="tkb-title"><i className="bi bi-calendar3"></i> Thời khóa biểu hiện tại</h6>
                    <div className="table-responsive">
                        <Table striped bordered hover className="mt-3">
                            <thead>
                                <tr>
                                    <th>Buổi</th>
                                    <th>Thứ</th>
                                    <th>Tiết</th>
                                    <th>Phòng</th>
                                    <th>Học phần</th>
                                    <th>Giảng viên</th>
                                    <th>Lớp học tập</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="tkb-cell">Sáng</td>
                                    <td className="tkb-cell">2</td>
                                    <td className="tkb-cell">1-6</td>
                                    <td className="tkb-cell">707</td>
                                    <td className="tkb-cell">Chủ nghĩa xã hội khoa học 1 (1tc)</td>
                                    <td className="tkb-cell">ThS. Nguyễn Thị Thu Vân</td>
                                    <td className="tkb-cell">6555(ST22D,ST22C,GD22A)</td>
                                </tr>
                                <tr>
                                    <td className="tkb-cell">Chiều</td>
                                    <td className="tkb-cell">2</td>
                                    <td className="tkb-cell">4-6</td>
                                    <td className="tkb-cell">602</td>
                                    <td className="tkb-cell">Đồ án công nghệ phần mềm (1tc)</td>
                                    <td className="tkb-cell">ThS. Nguyễn Quốc Vương</td>
                                    <td className="tkb-cell">6555(ST22D,ST22C,GD22A)</td>
                                </tr>
                                <tr>
                                    <td className="tkb-cell">Sáng</td>
                                    <td className="tkb-cell">3</td>
                                    <td className="tkb-cell">4-6</td>
                                    <td className="tkb-cell">101</td>
                                    <td className="tkb-cell">Đa văn hóa (1tc)</td>
                                    <td className="tkb-cell">ThS. Lê Thị Hồng Thúy</td>
                                    <td className="tkb-cell">7203(ST22C,ST22D,GD22B,HR22A)</td>
                                </tr>
                                <tr>
                                    <td className="tkb-cell">Chiều</td>
                                    <td className="tkb-cell">3</td>
                                    <td className="tkb-cell">1-3</td>
                                    <td className="tkb-cell">101</td>
                                    <td className="tkb-cell">Machine learning 2 (3tc)</td>
                                    <td className="tkb-cell">ThS. Lê Nân</td>
                                    <td className="tkb-cell">ST22D</td>
                                </tr>
                                <tr>
                                    <td className="tkb-cell">Sáng</td>
                                    <td className="tkb-cell">5</td>
                                    <td className="tkb-cell">4-6</td>
                                    <td className="tkb-cell">707</td>
                                    <td className="tkb-cell">Lập trình IoT (3tc)</td>
                                    <td className="tkb-cell">TS. Trần Quang Khương</td>
                                    <td className="tkb-cell">ST22D</td>
                                </tr>
                                <tr>
                                    <td className="tkb-cell">Chiều</td>
                                    <td className="tkb-cell">5</td>
                                    <td className="tkb-cell">1-6</td>
                                    <td className="tkb-cell">714</td>
                                    <td className="tkb-cell">Quản Trị Mạng 2 (3tc)</td>
                                    <td className="tkb-cell">ThS. Trần Văn Giáp</td>
                                    <td className="tkb-cell">ST22D</td>
                                </tr>
                                <tr>
                                    <td className="tkb-cell">Sáng</td>
                                    <td className="tkb-cell">6</td>
                                    <td className="tkb-cell">1-3</td>
                                    <td className="tkb-cell">906</td>
                                    <td className="tkb-cell">Điện toán đám mây (3tc)</td>
                                    <td className="tkb-cell">ThS. Lê Hữu Lập</td>
                                    <td className="tkb-cell">ST22D</td>
                                </tr>
                                <tr>
                                    <td className="tkb-cell">Chiều</td>
                                    <td className="tkb-cell">6</td>
                                    <td className="tkb-cell">4-6</td>
                                    <td className="tkb-cell">103</td>
                                    <td className="tkb-cell">DevOps (3tc)</td>
                                    <td className="tkb-cell">TS. Lê Nở</td>
                                    <td className="tkb-cell">ST22D</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>

                    <Alert variant="danger" className="mt-3">
                        <strong>Thông báo nghỉ!</strong>
                        <div className="mt-2">
                            <Alert variant="light">
                                <i className="bi bi-info-circle"></i> Chưa có thông báo nghỉ!
                            </Alert>
                        </div>
                    </Alert>
                </div>

                {/* TKB sắp tới */}
                <div className="p-3 bg-success bg-opacity-10 mt-3 rounded">
                    <h6 className="tkb-title"><i className="bi bi-calendar4"></i> Thời khóa biểu sắp tới</h6>
                    <Alert variant="danger" className="mt-3">
                        <i className="bi bi-exclamation-triangle-fill"></i> TKB sắp tới chưa có, xem TKB hiện tại!
                    </Alert>
                </div>
            </Container>
        </div>
    );
};

export default TKBPage;
