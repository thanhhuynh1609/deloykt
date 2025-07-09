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
import { FavoriteContext } from "../context/favoriteContext";
import ProductsContext from "../context/productsContext";
import { formatVND } from "../utils/currency";
import "../styles/profilePage.css";

function ProfilePage(props) {
  const { userInfo, updateProfile, logout, uploadAvatar } =
    useContext(UserContext);
  const {
    favorites,
    loading: favoritesLoading,
    removeFromFavorites,
  } = useContext(FavoriteContext);
  const { loadProduct } = useContext(ProductsContext);
  const [username, setUsername] = useState(
    userInfo && userInfo.username ? userInfo.username : ""
  );
  const [email, setEmail] = useState(
    userInfo && userInfo.email ? userInfo.email : ""
  );
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState(
    userInfo && userInfo.first_name ? userInfo.first_name : ""
  );
  const [lastName, setLastName] = useState(
    userInfo && userInfo.last_name ? userInfo.last_name : ""
  );
  const [phone, setPhone] = useState(
    userInfo && userInfo.phone ? userInfo.phone : ""
  );
  const [gender, setGender] = useState(
    userInfo && userInfo.gender ? userInfo.gender : ""
  );
  const [birthDate, setBirthDate] = useState(
    userInfo && userInfo.birth_date ? userInfo.birth_date : ""
  );
  const [address, setAddress] = useState(
    userInfo && userInfo.address ? userInfo.address : ""
  );
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [activeTab, setActiveTab] = useState("personal-info");
  const [status, setStatus] = useState({ show: false, success: false });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loadingFavoriteProducts, setLoadingFavoriteProducts] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userInfo == null || !userInfo.username) navigate("/");
  }, []);

  // Update form fields when userInfo changes
  useEffect(() => {
    if (userInfo) {
      console.log("Updating form fields with userInfo:", userInfo);
      setUsername(userInfo.username || "");
      setEmail(userInfo.email || "");
      setFirstName(userInfo.first_name || "");
      setLastName(userInfo.last_name || "");
      setPhone(userInfo.phone || "");
      setGender(userInfo.gender || "");
      setBirthDate(userInfo.birth_date || "");
      setAddress(userInfo.address || "");

      // Set avatar preview - prioritize userInfo.avatar, fallback to sample
      const currentAvatar =
        userInfo.avatar && userInfo.avatar !== "/image/sample.jpg"
          ? userInfo.avatar
          : "/image/sample.jpg";
      setAvatarPreview(currentAvatar);

      // Check if user has completed profile info
      const hasProfileInfo = !!(
        (userInfo.first_name && userInfo.first_name.trim()) ||
        (userInfo.last_name && userInfo.last_name.trim()) ||
        (userInfo.phone && userInfo.phone.trim()) ||
        (userInfo.address && userInfo.address.trim())
      );
      console.log("Has profile info:", hasProfileInfo, {
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        phone: userInfo.phone,
        address: userInfo.address,
        profileFetched: userInfo.profileFetched,
        fullUserInfo: userInfo,
      });

      // Only auto-enter edit mode if no profile info
      if (!hasProfileInfo) {
        console.log("No profile info found, entering edit mode");
        setIsEditMode(true);
      } else {
        console.log("Profile info exists, staying in view mode");
        setIsEditMode(false);
      }
    }
  }, [userInfo]);

  // Check if user has basic profile information
  const hasProfileInfo =
    userInfo &&
    (userInfo.first_name ||
      userInfo.last_name ||
      userInfo.phone ||
      userInfo.address);

  // Load favorite products details
  useEffect(() => {
    const loadFavoriteProducts = async () => {
      if (favorites && favorites.length > 0) {
        setLoadingFavoriteProducts(true);
        try {
          console.log("Favorites data:", favorites); // Debug log
          const productPromises = favorites.map((fav) => {
            // Handle both cases: fav.product_id or fav.id
            const productId = fav.product_id || fav.id;
            console.log("Loading product ID:", productId); // Debug log
            return loadProduct(productId);
          });
          const products = await Promise.all(productPromises);
          console.log("Loaded products:", products); // Debug log
          setFavoriteProducts(products.filter((product) => product)); // Filter out null/undefined
        } catch (error) {
          console.error("Error loading favorite products:", error);
        } finally {
          setLoadingFavoriteProducts(false);
        }
      } else {
        setFavoriteProducts([]);
        setLoadingFavoriteProducts(false);
      }
    };

    loadFavoriteProducts();
  }, [favorites, loadProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const profileData = {
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
        gender,
        birthDate,
        address,
      };

      console.log("Submitting profile data:", profileData);
      const updatedStatus = await updateProfile(profileData);
      console.log("Update status:", updatedStatus);

      setStatus({ show: true, success: updatedStatus });
      if (updatedStatus) {
        console.log("Update successful, switching to view mode");
        // Clear password field after successful update
        setPassword("");
        // Switch to view mode after successful update
        setIsEditMode(false);
        setTimeout(() => {
          setStatus({ show: false, success: false });
        }, 3000);
      } else {
        console.log("Update failed, staying in edit mode");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setStatus({ show: true, success: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Selected file:", file);

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
      setUploadProgress(10);

      try {
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log("File read successfully, showing preview");
          const previewUrl = e.target.result;
          setAvatarPreview(previewUrl);
          console.log("Avatar preview set to:", previewUrl);
        };
        reader.readAsDataURL(file);

        setUploadProgress(30);

        // Upload to server
        console.log("Starting upload to server...");
        const avatarUrl = await uploadAvatar(file);
        console.log("Upload completed, avatar URL:", avatarUrl);
        setUploadProgress(90);

        // Update preview with server URL if available
        if (avatarUrl) {
          console.log("Updating avatar preview with server URL:", avatarUrl);
          setAvatarPreview(avatarUrl);
        }

        // Always show success message
        setStatus({
          show: true,
          success: true,
          message: "Cập nhật ảnh đại diện thành công!",
        });
        setTimeout(() => {
          setStatus({ show: false, success: false });
        }, 3000);

        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      } catch (error) {
        console.error("Avatar upload error:", error);
        alert("Upload ảnh thất bại: " + error.message);
        setUploadProgress(0);
        // Reset to original avatar
        const originalAvatar =
          userInfo && userInfo.avatar ? userInfo.avatar : "/image/sample.jpg";
        console.log("Resetting to original avatar:", originalAvatar);
        setAvatarPreview(originalAvatar);
      }
    }

    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handlePasswordChange = () => {
    setActiveTab("change-password");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      alert("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    if (!password) {
      alert("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);
    try {
      const profileData = {
        password: password,
        current_password: currentPassword,
      };

      const updatedStatus = await updateProfile(profileData);
      if (updatedStatus) {
        setStatus({
          show: true,
          success: true,
          message: "Đổi mật khẩu thành công!",
        });
        // Clear password fields
        setCurrentPassword("");
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setStatus({ show: false, success: false });
        }, 3000);
      } else {
        setStatus({
          show: true,
          success: false,
          message:
            "Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại!",
        });
      }
    } catch (error) {
      console.error("Change password error:", error);
      setStatus({
        show: true,
        success: false,
        message: "Đổi mật khẩu thất bại. Vui lòng thử lại!",
      });
    } finally {
      setIsLoading(false);
    }
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
                <div
                  className="avatar-upload-btn"
                  onClick={() =>
                    document.getElementById("avatar-upload").click()
                  }
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={avatarPreview || "/image/sample.jpg"}
                    alt="Avatar"
                    className="profile-avatar"
                    onError={(e) => {
                      console.log("Avatar load error, falling back to sample");
                      e.target.src = "/image/sample.jpg";
                    }}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="avatar-upload-input"
                    id="avatar-upload"
                    style={{ display: "none" }}
                  />
                </div>

                {uploadProgress > 0 && (
                  <div className="upload-progress">
                    <div className="progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <small className="text-muted">
                      Đang tải ảnh lên... {Math.round(uploadProgress)}%
                    </small>
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
                  <span className="stat-number">0</span>
                  <div className="stat-label">Đơn hàng</div>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {favorites ? favorites.length : 0}
                  </span>
                  <div className="stat-label">Yêu thích</div>
                </div>
                <div className="stat-item">
                  <span className="stat-number">0</span>
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
                    <span>
                      {status.message || "Cập nhật thông tin thành công!"}
                    </span>
                  </div>
                )}

                {status.show && !status.success && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>Cập nhật thông tin thất bại. Vui lòng thử lại!</span>
                  </div>
                )}

                {/* Personal Info Tab */}
                {activeTab === "personal-info" && (
                  <div className="personal-info-section">
                    {!isEditMode && hasProfileInfo ? (
                      // View Mode
                      <div className="profile-view-mode">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5>Thông tin cá nhân</h5>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setIsEditMode(true)}
                          >
                            <i className="fas fa-edit"></i> Chỉnh sửa
                          </Button>
                        </div>

                        <div className="profile-info-grid">
                          <div className="info-row">
                            <div className="info-item">
                              <label className="info-label">
                                Tên đăng nhập
                              </label>
                              <div className="info-value">
                                {userInfo?.username || "Chưa cập nhật"}
                              </div>
                            </div>
                            <div className="info-item">
                              <label className="info-label">Email</label>
                              <div className="info-value">
                                {userInfo?.email || "Chưa cập nhật"}
                              </div>
                            </div>
                          </div>

                          <div className="info-row">
                            <div className="info-item">
                              <label className="info-label">Họ</label>
                              <div className="info-value">
                                {userInfo?.last_name || "Chưa cập nhật"}
                              </div>
                            </div>
                            <div className="info-item">
                              <label className="info-label">Tên</label>
                              <div className="info-value">
                                {userInfo?.first_name || "Chưa cập nhật"}
                              </div>
                            </div>
                          </div>

                          <div className="info-row">
                            <div className="info-item">
                              <label className="info-label">
                                Số điện thoại
                              </label>
                              <div className="info-value">
                                {userInfo?.phone || "Chưa cập nhật"}
                              </div>
                            </div>
                            <div className="info-item">
                              <label className="info-label">Giới tính</label>
                              <div className="info-value">
                                {userInfo?.gender === "male"
                                  ? "Nam"
                                  : userInfo?.gender === "female"
                                  ? "Nữ"
                                  : userInfo?.gender === "other"
                                  ? "Khác"
                                  : "Chưa cập nhật"}
                              </div>
                            </div>
                          </div>

                          <div className="info-row">
                            <div className="info-item">
                              <label className="info-label">Ngày sinh</label>
                              <div className="info-value">
                                {userInfo?.birth_date
                                  ? new Date(
                                      userInfo.birth_date
                                    ).toLocaleDateString("vi-VN")
                                  : "Chưa cập nhật"}
                              </div>
                            </div>
                          </div>

                          <div className="info-row">
                            <div className="info-item full-width">
                              <label className="info-label">Địa chỉ</label>
                              <div className="info-value">
                                {userInfo?.address || "Chưa cập nhật"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Edit Mode
                      <div className="personal-info-form">
                        {!hasProfileInfo && (
                          <div className="alert alert-info mb-4">
                            <i className="fas fa-info-circle"></i>
                            <strong> Hoàn thiện thông tin cá nhân</strong>
                            <p className="mb-0 mt-2">
                              Vui lòng cập nhật thông tin cá nhân để có trải
                              nghiệm tốt hơn.
                            </p>
                          </div>
                        )}

                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5>
                            {hasProfileInfo
                              ? "Chỉnh sửa thông tin cá nhân"
                              : "Cập nhật thông tin cá nhân"}
                          </h5>
                          {hasProfileInfo && (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => setIsEditMode(false)}
                            >
                              <i className="fas fa-times"></i> Hủy
                            </Button>
                          )}
                        </div>

                        <Form onSubmit={handleSubmit}>
                          <div className="form-section">
                            <h5 className="form-section-title">
                              <i className="fas fa-user-circle"></i> Thông tin
                              tài khoản
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
                                    onChange={(e) =>
                                      setUsername(e.target.value)
                                    }
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
                              <i className="fas fa-id-card"></i> Thông tin cá
                              nhân
                            </h5>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="form-group">
                                  <Form.Label className="form-label">
                                    Họ
                                  </Form.Label>
                                  <Form.Control
                                    type="text"
                                    placeholder="Nhập họ"
                                    value={lastName}
                                    onChange={(e) =>
                                      setLastName(e.target.value)
                                    }
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
                                    onChange={(e) =>
                                      setFirstName(e.target.value)
                                    }
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
                                    onChange={(e) =>
                                      setBirthDate(e.target.value)
                                    }
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
                                  <i className="fas fa-spinner fa-spin"></i>{" "}
                                  Đang cập nhật...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-save"></i> Cập nhật thông
                                  tin
                                </>
                              )}
                            </Button>
                          </div>
                        </Form>
                      </div>
                    )}
                  </div>
                )}

                {/* Change Password Tab */}
                {activeTab === "change-password" && (
                  <div className="personal-info-form">
                    <Form onSubmit={handleChangePassword}>
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
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="form-control"
                            required
                          />
                        </Form.Group>
                        <Form.Group className="form-group">
                          <Form.Label className="form-label">
                            Mật khẩu mới
                          </Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control"
                            minLength={6}
                            required
                          />
                        </Form.Group>
                        <Form.Group className="form-group">
                          <Form.Label className="form-label">
                            Xác nhận mật khẩu mới
                          </Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Nhập lại mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-control"
                            required
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
                              đổi mật khẩu...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-key"></i> Đổi mật khẩu
                            </>
                          )}
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

                    {/* Real Orders List */}
                    <div className="orders-wrapper">
                      <OrdersList />
                    </div>
                  </div>
                )}

                {/* Favorites Tab */}
                {activeTab === "favorites" && (
                  <div>
                    {loadingFavoriteProducts ? (
                      <div className="text-center py-5">
                        <i
                          className="fas fa-spinner fa-spin"
                          style={{ fontSize: "2rem", color: "#007bff" }}
                        ></i>
                        <p className="mt-3">Đang tải sản phẩm yêu thích...</p>
                      </div>
                    ) : favoriteProducts.length > 0 ? (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <div>
                            <h5>
                              Sản phẩm yêu thích ({favoriteProducts.length})
                            </h5>
                            <p className="text-muted mb-0">
                              Danh sách các sản phẩm bạn đã yêu thích
                            </p>
                          </div>
                        </div>

                        <Row>
                          {favoriteProducts.map((product) => (
                            <Col
                              key={product.id}
                              xs={12}
                              sm={6}
                              lg={4}
                              className="mb-4"
                            >
                              <Card className="favorite-product-card h-100">
                                <div className="position-relative">
                                  <Card.Img
                                    variant="top"
                                    src={product.image}
                                    alt={product.name}
                                    style={{
                                      height: "200px",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="position-absolute top-0 end-0 m-2"
                                    onClick={() => {
                                      console.log(
                                        "Removing product from favorites:",
                                        product.id
                                      );
                                      removeFromFavorites(product.id);
                                    }}
                                    title="Xóa khỏi yêu thích"
                                  >
                                    <i className="fas fa-heart"></i>
                                  </Button>
                                </div>
                                <Card.Body className="d-flex flex-column">
                                  <Card.Title
                                    className="h6 mb-2"
                                    style={{ minHeight: "48px" }}
                                  >
                                    {product.name}
                                  </Card.Title>
                                  <div className="mt-auto">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <span className="text-danger fw-bold fs-5">
                                        {formatVND(product.price)}
                                      </span>
                                      <div className="text-warning">
                                        <i className="fas fa-star"></i>{" "}
                                        {product.rating || 0}
                                      </div>
                                    </div>
                                    <div className="d-grid gap-2">
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() =>
                                          navigate(`/products/${product.id}`)
                                        }
                                      >
                                        <i className="fas fa-eye"></i> Xem chi
                                        tiết
                                      </Button>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    ) : (
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
                          Hãy thêm những sản phẩm bạn yêu thích để dễ dàng tìm
                          lại sau này
                        </p>
                        <Button
                          variant="primary"
                          onClick={() => navigate("/search")}
                        >
                          <i className="fas fa-shopping-bag"></i> Khám phá sản
                          phẩm
                        </Button>
                      </div>
                    )}
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
