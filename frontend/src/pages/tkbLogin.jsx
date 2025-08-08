import React, { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button, Card, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./tkbLogin.css";

const TKBLoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    useEffect(() => {
            document.title = "Đăng nhập sinh viên | UDA";
        }, []);
    

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === "99022" && password === "Kimthanh.123") {
            navigate("/tkb");
        } else {
            setError("Sai tài khoản hoặc mật khẩu!");
        }
    };

    return (
        <Container className="login-pagee">
            <Row className="justify-content-center align-items-center vh-100">
                <Col xs={12} md={8} lg={6}>
                    <Card className="mb-3">
                        <Card.Header className="bg-success text-white fw-bold">
                            Hướng dẫn cho Sinh viên
                        </Card.Header>
                        <Card.Body>
                            <ul className="mb-0">
                                <li>Đăng nhập để học trực tuyến.</li>
                                <li>Không cho mượn tài khoản bất kỳ hình thức nào.</li>
                                <li>Mật khẩu lần đầu đăng nhập là ngày tháng năm sinh của em dd/mm/yyyy</li>
                                <li>Thay đổi pass word thường xuyên để bảo mật.</li>
                                <li>Nếu gặp bất cứ vấn đề gì vui lòng liên hệ trung tâm ICT để được hướng dẫn và giải quyết SĐT: email....</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header className="bg-success text-white fw-bold">
                            Khai báo đăng nhập
                        </Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleLogin}>
                                <Form.Group className="mb-3">
                                    <Form.Label>User Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Form.Group>

                                <Button type="submit" variant="success" className="me-2">
                                    Đăng nhập
                                </Button>
                                <Button variant="secondary">Quên pass</Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default TKBLoginPage;
