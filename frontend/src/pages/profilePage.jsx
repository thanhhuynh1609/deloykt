import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Button,
  Row,
  Col,
  Container,
  Tabs,
  Tab,
  Card,
} from "react-bootstrap";
import Message from "../components/message";
import UserContext from "../context/userContext";
import OrdersList from "../components/ordersList";
import "../styles/profilePage.css";

function ProfilePage(props) {
  const { userInfo, updateProfile, logout } = useContext(UserContext);
  const [username, setUsername] = useState(
    userInfo && userInfo.username ? userInfo.username : ""
  );
  const [email, setEmail] = useState(
    userInfo && userInfo.email ? userInfo.email : ""
  );
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("/image/sample.jpg");
  const [activeTab, setActiveTab] = useState("personal-info");
  const [status, setStatus] = useState({ show: false, success: false });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (userInfo == null || !userInfo.username) navigate("/");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedStatus = await updateProfile(username, email, password);
      setStatus({ show: true, success: updatedStatus });
      if (updatedStatus) {
        setTimeout(() => {
          setStatus({ show: false, success: false });
        }, 3000);
      }
    } catch (error) {
      setStatus({ show: true, success: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước file không được vượt quá 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Vui lòng chọn file hình ảnh");
        return;
      }

      setAvatar(file);
      setUploadProgress(0);

      const reader = new FileReader();
      reader.onloadstart = () => setUploadProgress(10);
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 90;
          setUploadProgress(progress);
        }
      };
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handlePasswordChange = () => {
    setActiveTab("change-password");
  };

  return (
    <div className="profile-page">
      <Container className="profile-container">
        <Row>
          {/* Profile Sidebar */}
          <Col lg={3} md={4} className="mb-4">
            <div className="profile-sidebar">
              {/* Avatar Section */}
              <div className="profile-avatar-section">
                <div className="avatar-upload-btn">
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="profile-avatar"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="avatar-upload-input"
                  />
                  <div className="avatar-change-overlay">
                    <i className="fas fa-camera"></i>
                    <br />
                    Đổi ảnh
                  </div>
                </div>
                {uploadProgress > 0 && (
                  <div className="upload-progress">
                    <div className="progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <h4 className="profile-user-name">
                  {userInfo?.username || "Người dùng"}
                </h4>
                <p className="profile-user-email">
                  {userInfo?.email || "email@example.com"}
                </p>
              </div>

              {/* Profile Stats */}
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">12</span>
                  <div className="stat-label">Đơn hàng</div>
                </div>
                <div className="stat-item">
                  <span className="stat-number">5</span>
                  <div className="stat-label">Yêu thích</div>
                </div>
                <div className="stat-item">
                  <span className="stat-number">8</span>
                  <div className="stat-label">Đánh giá</div>
                </div>
              </div>

              {/* Navigation Menu */}
              <ul className="profile-nav-menu">
                <li className="profile-nav-item">
                  <a
                    href="#personal-info"
                    className={`profile-nav-link ${
                      activeTab === "personal-info" ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("personal-info");
                    }}
                  >
                    <i className="fas fa-user"></i>
                    Thông tin cá nhân
                  </a>
                </li>
                <li className="profile-nav-item">
                  <a
                    href="#change-password"
                    className={`profile-nav-link ${
                      activeTab === "change-password" ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("change-password");
                    }}
                  >
                    <i className="fas fa-lock"></i>
                    Đổi mật khẩu
                  </a>
                </li>
                <li className="profile-nav-item">
                  <a
                    href="#orders"
                    className={`profile-nav-link ${
                      activeTab === "orders" ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("orders");
                    }}
                  >
                    <i className="fas fa-shopping-bag"></i>
                    Đơn hàng của tôi
                  </a>
                </li>
                <li className="profile-nav-item">
                  <a
                    href="#favorites"
                    className={`profile-nav-link ${
                      activeTab === "favorites" ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("favorites");
                    }}
                  >
                    <i className="fas fa-heart"></i>
                    Sản phẩm yêu thích
                  </a>
                </li>
                <li className="profile-nav-item">
                  <a
                    href="#logout"
                    className="profile-nav-link logout-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    Đăng xuất
                  </a>
                </li>
              </ul>
            </div>
          </Col>

          {/* Main Content */}
          <Col lg={9} md={8}>
            <div className="profile-main-content">
              <div className="profile-content-header">
                <h2 className="profile-content-title">
                  {activeTab === "personal-info" && "Thông tin cá nhân"}
                  {activeTab === "change-password" && "Đổi mật khẩu"}
                  {activeTab === "orders" && "Đơn hàng của tôi"}
                  {activeTab === "favorites" && "Sản phẩm yêu thích"}
                </h2>
                <p className="profile-content-subtitle">
                  {activeTab === "personal-info" &&
                    "Quản lý thông tin hồ sơ để bảo mật tài khoản"}
                  {activeTab === "change-password" &&
                    "Đảm bảo tài khoản của bạn đang sử dụng mật khẩu mạnh"}
                  {activeTab === "orders" &&
                    "Xem và theo dõi tất cả đơn hàng của bạn"}
                  {activeTab === "favorites" &&
                    "Danh sách các sản phẩm bạn đã yêu thích"}
                </p>
              </div>

              <div className="profile-tab-content">
                {status.show && status.success && (
                  <div className="success-message">
                    <i className="fas fa-check-circle"></i>
                    <span>Cập nhật thông tin thành công!</span>
                  </div>
                )}

                {/* Personal Info Tab */}
                {activeTab === "personal-info" && (
                  <div className="personal-info-form">
                    <Form onSubmit={handleSubmit}>
                      <div className="form-section">
                        <h5 className="form-section-title">
                          <i className="fas fa-user-circle"></i> Thông tin tài
                          khoản
                        </h5>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="form-group">
                              <Form.Label className="form-label">
                                Tên đăng nhập
                              </Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Nhập tên đăng nhập"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="form-control"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="form-group">
                              <Form.Label className="form-label">
                                Email
                              </Form.Label>
                              <Form.Control
                                type="email"
                                placeholder="Nhập địa chỉ email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-control"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>

                      <div className="form-section">
                        <h5 className="form-section-title">
                          <i className="fas fa-id-card"></i> Thông tin cá nhân
                        </h5>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="form-group">
                              <Form.Label className="form-label">Họ</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Nhập họ"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="form-control"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="form-group">
                              <Form.Label className="form-label">
                                Tên
                              </Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Nhập tên"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="form-control"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="form-group">
                              <Form.Label className="form-label">
                                Số điện thoại
                              </Form.Label>
                              <Form.Control
                                type="tel"
                                placeholder="Nhập số điện thoại"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="form-control"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="form-group">
                              <Form.Label className="form-label">
                                Giới tính
                              </Form.Label>
                              <Form.Select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="form-select"
                              >
                                <option value="">Chọn giới tính</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="form-group">
                              <Form.Label className="form-label">
                                Ngày sinh
                              </Form.Label>
                              <Form.Control
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="form-control"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Form.Group className="form-group">
                          <Form.Label className="form-label">
                            Địa chỉ
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Nhập địa chỉ đầy đủ"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="form-control"
                          />
                        </Form.Group>
                      </div>

                      <div className="text-end">
                        <Button
                          type="submit"
                          className={`btn-update-profile ${
                            isLoading ? "btn-loading" : ""
                          }`}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i> Đang
                              cập nhật...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save"></i> Cập nhật thông tin
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </div>
                )}

                {/* Change Password Tab */}
                {activeTab === "change-password" && (
                  <div className="personal-info-form">
                    <Form>
                      <div className="form-section">
                        <h5 className="form-section-title">
                          <i className="fas fa-shield-alt"></i> Đổi mật khẩu
                        </h5>
                        <Form.Group className="form-group">
                          <Form.Label className="form-label">
                            Mật khẩu hiện tại
                          </Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Nhập mật khẩu hiện tại"
                            className="form-control"
                          />
                        </Form.Group>
                        <Form.Group className="form-group">
                          <Form.Label className="form-label">
                            Mật khẩu mới
                          </Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Nhập mật khẩu mới"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control"
                          />
                        </Form.Group>
                        <Form.Group className="form-group">
                          <Form.Label className="form-label">
                            Xác nhận mật khẩu mới
                          </Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Nhập lại mật khẩu mới"
                            className="form-control"
                          />
                        </Form.Group>
                      </div>
                      <div className="text-end">
                        <Button type="submit" className="btn-update-profile">
                          <i className="fas fa-key"></i> Đổi mật khẩu
                        </Button>
                      </div>
                    </Form>
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === "orders" && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <h5>Danh sách đơn hàng</h5>
                        <p className="text-muted mb-0">
                          Quản lý và theo dõi đơn hàng của bạn
                        </p>
                      </div>
                      <Button variant="outline-primary" size="sm">
                        <i className="fas fa-filter"></i> Lọc đơn hàng
                      </Button>
                    </div>

                    {/* Sample Orders */}
                    <div className="orders-list">
                      {[
                        {
                          id: "DH001",
                          date: "2024-01-15",
                          total: 450000,
                          status: "delivered",
                          statusText: "Đã giao hàng",
                        },
                        {
                          id: "DH002",
                          date: "2024-01-10",
                          total: 280000,
                          status: "processing",
                          statusText: "Đang xử lý",
                        },
                        {
                          id: "DH003",
                          date: "2024-01-05",
                          total: 650000,
                          status: "shipped",
                          statusText: "Đang giao hàng",
                        },
                      ].map((order) => (
                        <div key={order.id} className="order-item">
                          <div className="order-header">
                            <div>
                              <span className="order-id">
                                Đơn hàng #{order.id}
                              </span>
                              <span className="order-date">
                                <i className="fas fa-calendar-alt"></i>{" "}
                                {new Date(order.date).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </span>
                            </div>
                            <div>
                              <span
                                className={`order-status status-${order.status}`}
                              >
                                {order.statusText}
                              </span>
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="order-total">
                              Tổng tiền:{" "}
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(order.total)}
                            </div>
                            <div>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                              >
                                <i className="fas fa-eye"></i> Xem chi tiết
                              </Button>
                              {order.status === "delivered" && (
                                <Button variant="outline-success" size="sm">
                                  <i className="fas fa-star"></i> Đánh giá
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Favorites Tab */}
                {activeTab === "favorites" && (
                  <div>
                    <div className="text-center py-5">
                      <i
                        className="fas fa-heart"
                        style={{
                          fontSize: "4rem",
                          color: "#ddd",
                          marginBottom: "20px",
                        }}
                      ></i>
                      <h5>Chưa có sản phẩm yêu thích</h5>
                      <p className="text-muted">
                        Hãy thêm những sản phẩm bạn yêu thích để dễ dàng tìm lại
                        sau này
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => navigate("/search")}
                      >
                        <i className="fas fa-shopping-bag"></i> Khám phá sản
                        phẩm
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default ProfilePage;
