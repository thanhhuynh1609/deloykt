import React, { useEffect } from "react";
import { Container, Row, Col, Table, Alert, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const TKBPage = () => {
    useEffect(() => {
        document.title = "Thời khóa biểu sinh viên | UDA";
    }, []);

    const today = new Date();
    const daysOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const weekday = daysOfWeek[today.getDay()];
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    return (
        <div style={{ textTransform: 'none' }}> {/* Toàn bộ trang KHÔNG in hoa */}
            {/* Header */}
            <div className="w-100">
                <Row className="align-items-center m-0 p-2" style={{ backgroundColor: '#009933' }}>
                    <Col xs={4} className="d-flex align-items-center">
                        <img
                            src="https://my.uda.edu.vn/filetailen/anhsv/99022.jpg"
                            alt="Avatar"
                            className="rounded-circle me-2"
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        />
                        <p style={{ margin: 0, color: 'white', fontSize: '18px' }}>Huỳnh Nguyễn Kim Thanh</p>
                    </Col>
                    <Col className="text-end">
                        <Link to="https://my.uda.edu.vn/sv/test_dk" className="btn btn-link text-white text-decoration-none me-2" style={{ textTransform: 'none', fontSize: '18px' }}>Đánh giá</Link>
                        <Link to="https://my.uda.edu.vn/sv/sv_ctdt" className="btn btn-link text-white text-decoration-none me-2" style={{ textTransform: 'none', fontSize: '18px' }}>Thông tin Lớp</Link>
                        <Link to="https://my.uda.edu.vn/sv/thongtinsv" className="btn btn-link text-white text-decoration-none me-2" style={{ textTransform: 'none', fontSize: '18px' }}>Góc sinh viên</Link>
                        <Link to="https://my.uda.edu.vn/sv/doipass" className="btn btn-link text-white text-decoration-none" style={{ textTransform: 'none', fontSize: '18px' }}>Hệ thống</Link>

                    </Col>
                </Row>
            </div>

            <Container className="mt-4">
                <h5>
                    <i className="bi bi-calendar-check"></i> Hôm nay {weekday} ngày: {formattedDate}
                </h5>

                {/* TKB hiện tại */}
                <div className="p-3 bg-success bg-opacity-10 mt-3 rounded">
                    <h6 style={{ textTransform: 'none', fontSize: '18px' }}><i className="bi bi-calendar3"></i> Thời khóa biểu hiện tại</h6>
                    <Table striped bordered hover className="mt-3">
                        <thead>
                            <tr>
                                <th style={{ textTransform: 'none' }}>Buổi</th>
                                <th style={{ textTransform: 'none' }}>Thứ</th>
                                <th style={{ textTransform: 'none' }}>Tiết</th>
                                <th style={{ textTransform: 'none' }}>Phòng</th>
                                <th style={{ textTransform: 'none' }}>Học phần</th>
                                <th style={{ textTransform: 'none' }}>Giảng viên</th>
                                <th style={{ textTransform: 'none' }}>Lớp học tập</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '14px' }}>
                            <tr>
                                <td>Sáng</td>
                                <td>2</td>
                                <td>1-6</td>
                                <td>707</td>
                                <td>Chủ nghĩa xã hội khoa học 1 (1tc)</td>
                                <td>ThS. Nguyễn Thị Thu Vân</td>
                                <td>6555(ST22D,ST22C,GD22A)</td>
                            </tr>
                            <tr>
                                <td>Chiều</td>
                                <td>2</td>
                                <td>4-6</td>
                                <td>602</td>
                                <td>Đồ án công nghệ phần mềm (1tc)</td>
                                <td>ThS. Nguyễn Quốc Vương</td>
                                <td>6555(ST22D,ST22C,GD22A)</td>
                            </tr>
                            <tr>
                                <td>Sáng</td>
                                <td>3</td>
                                <td>4-6</td>
                                <td>101</td>
                                <td>Đa văn hóa (1tc)</td>
                                <td>ThS. Lê Thị Hồng Thúy</td>
                                <td>7203(ST22C,ST22D,GD22B,HR22A)</td>
                            </tr>
                            <tr>
                                <td>Chiều</td>
                                <td>3</td>
                                <td>1-3</td>
                                <td>101</td>
                                <td>Machine learning 2 (3tc)</td>
                                <td>ThS. Lê Nân</td>
                                <td>ST22D</td>
                            </tr>
                            <tr>
                                <td>Sáng</td>
                                <td>5</td>
                                <td>4-6</td>
                                <td>707</td>
                                <td>Lập trình IoT (3tc)</td>
                                <td>TS. Trần Quang Khương</td>
                                <td>ST22D</td>
                            </tr>
                            <tr>
                                <td>Chiều</td>
                                <td>5</td>
                                <td>1-6</td>
                                <td>714</td>
                                <td>Quản Trị Mạng 2 (3tc)</td>
                                <td>ThS. Trần Văn Giáp</td>
                                <td>ST22D</td>
                            </tr>
                            <tr>
                                <td>Sáng</td>
                                <td>6</td>
                                <td>1-3</td>
                                <td>906</td>
                                <td>Điện toán đám mây (3tc)</td>
                                <td>ThS. Lê Hữu Lập</td>
                                <td>ST22D</td>
                            </tr>
                            <tr>
                                <td>Chiều</td>
                                <td>6</td>
                                <td>4-6</td>
                                <td>103</td>
                                <td>DevOps (3tc)</td>
                                <td>TS. Lê Nở</td>
                                <td>ST22D</td>
                            </tr>
                        </tbody>
                    </Table>

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
                    <h6><i className="bi bi-calendar4"></i> Thời khóa biểu sắp tới</h6>
                    <Alert variant="danger" className="mt-3">
                        <i className="bi bi-exclamation-triangle-fill"></i> TKB sắp tới chưa có, xem TKB hiện tại!
                    </Alert>
                </div>
            </Container>
        </div>
    );
};

export default TKBPage;
