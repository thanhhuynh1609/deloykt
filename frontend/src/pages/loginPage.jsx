import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Form, Button, Row, Col } from "react-bootstrap";
import Message from "../components/message";
import UserContext from "../context/userContext";
import "../styles/loginPage.css";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { userInfo, login, error } = useContext(UserContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect')
    ? "/" + searchParams.get('redirect')
    : "/";

  useEffect(() => {
    if (userInfo && userInfo.username) {
      if (userInfo.isAdmin) {
        navigate('/admin');
      } else {
        navigate(redirect);
      }
    }
  }, [userInfo, navigate, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const status = await login(username, password);
    if (status) {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo && userInfo.isAdmin) {
        navigate('/admin');
      } else {
        navigate(redirect);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="breadcrumb-nav">
          <Link to="/">Home</Link> / <span>Account</span>
        </div>
        
        <div className="auth-tabs">
          <div className="auth-tab active">
            <Link to="/login">SIGN IN</Link>
          </div>
          <div className="auth-tab">
            <Link to={redirect ? `/register?redirect=${redirect}` : "/register"}>
              CREATE ACCOUNT
            </Link>
          </div>
        </div>
        
        <div className="auth-content">
          <div className="auth-benefits">
            <p>Sign in to access your account, track orders, save products to your wishlist, and enjoy a personalized shopping experience.</p>
          </div>
          
          {error.login && error.login.detail && (
            <Message variant="danger">
              <h4>{error.login.detail}</h4>
            </Message>
          )}
          
          <Form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className="form-control"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {error.login && error.login.username && (
                <Message variant="danger">{error.login.username}</Message>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error.login && error.login.password && (
                <Message variant="danger">{error.login.password}</Message>
              )}
            </div>
            
            <div className="forgot-password">
              <Link to="/forgot-password">Forgot your password?</Link>
            </div>
            
            <button type="submit" className="auth-button btn-primary">
              SIGN IN
            </button>
            
            <div className="auth-separator">
              <span>OR</span>
            </div>
            
            <div className="social-login">
              <button type="button" className="btn social-btn google">
                <i className="fab fa-google"></i> Sign in with Google
              </button>
              <button type="button" className="btn social-btn facebook">
                <i className="fab fa-facebook-f"></i> Sign in with Facebook
              </button>
            </div>
            
            <div className="auth-info">
              <p>By signing in, you agree to our <a href="/terms">Terms of Use</a> and <a href="/privacy">Privacy Policy</a>.</p>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
