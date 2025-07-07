import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Form } from "react-bootstrap";
import Message from "../components/message";
import UserContext from "../context/userContext";
import "../styles/loginPage.css"; // Sử dụng cùng file CSS với trang login

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { userInfo, register, error } = useContext(UserContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect')
    ? "/" + searchParams.get('redirect')
    : "/";

  useEffect(() => {
    if (userInfo && userInfo.username) navigate(redirect);
  }, [userInfo, navigate, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const status = await register(username, email, password);
    if (status) navigate(redirect);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="breadcrumb-nav">
          <Link to="/">Home</Link> / <span>Account</span>
        </div>
        
        <div className="auth-tabs">
          <div className="auth-tab">
            <Link to={redirect ? `/login?redirect=${redirect}` : "/login"}>
              SIGN IN
            </Link>
          </div>
          <div className="auth-tab active">
            <Link to="/register">CREATE ACCOUNT</Link>
          </div>
        </div>
        
        <div className="auth-content">
          <div className="auth-benefits">
            <p>Create an account to enjoy a personalized shopping experience, faster checkout, order tracking and exclusive offers.</p>
          </div>
          
          {error.register && error.register.detail && (
            <Message variant="danger">
              <h4>{error.register.detail}</h4>
            </Message>
          )}
          
          <Form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className="form-control"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              {error.register && error.register.username && (
                <Message variant="danger">{error.register.username}</Message>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error.register && error.register.email && (
                <Message variant="danger">{error.register.email}</Message>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error.register && error.register.password && (
                <Message variant="danger">{error.register.password}</Message>
              )}
            </div>
            
            <button type="submit" className="auth-button btn-primary">
              CREATE ACCOUNT
            </button>
            
            <div className="auth-separator">
              <span>OR</span>
            </div>
            
            <div className="social-login">
              <button type="button" className="btn social-btn google">
                <i className="fab fa-google"></i> Sign up with Google
              </button>
              <button type="button" className="btn social-btn facebook">
                <i className="fab fa-facebook-f"></i> Sign up with Facebook
              </button>
            </div>
            
            <div className="auth-info">
              <p>By creating an account, you agree to our <a href="/terms">Terms of Use</a> and <a href="/privacy">Privacy Policy</a>.</p>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
