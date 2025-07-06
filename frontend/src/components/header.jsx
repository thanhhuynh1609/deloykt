import React, { useContext } from "react";
import { Navbar, Nav, Container, NavDropdown, Badge } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import UserContext from "../context/userContext";
import { FavoriteContext } from "../context/favoriteContext";
import SearchBox from "./searchBox";
import "./Header.css";

function Header({ keyword, setKeyword }) {
  const { userInfo, logout } = useContext(UserContext);

  let favorites = [];
  try {
    const favoriteContext = useContext(FavoriteContext);
    favorites = favoriteContext?.favorites || [];
  } catch (error) {
    console.warn("FavoriteContext not available:", error);
  }

  return (
    <header className="header-border">
      <Navbar bg="light" variant="light" expand="lg" collapseOnSelect>
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand className="fw-bold text-primary">TNBHStore</Navbar.Brand>
          </LinkContainer>

          {/* Cho SearchBox vào div để canh flex và margin */}
          <div className="search-container">
            <SearchBox keyword={keyword} setKeyword={setKeyword} />
          </div>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="no-flex-grow">
            <Nav className="ms-auto align-items-center">
              <LinkContainer to="/cart">
                <Nav.Link className="text-dark nav-icon-link">
                  <i className="fas fa-shopping-cart me-1" /> Giỏ hàng
                </Nav.Link>
              </LinkContainer>

              {userInfo && (
                <>
                  <LinkContainer to="/favorites">
                    <Nav.Link className="text-dark nav-icon-link">
                      <i className="fas fa-heart me-1" /> Yêu thích
                      {favorites.length > 0 && (
                        <Badge pill bg="danger" className="ms-1">
                          {favorites.length}
                        </Badge>
                      )}
                    </Nav.Link>
                  </LinkContainer>

                  <LinkContainer to="/paybox">
                    <Nav.Link className="text-dark nav-icon-link">
                      <i className="fas fa-wallet me-1" /> Paybox
                    </Nav.Link>
                  </LinkContainer>
                </>
              )}

              {userInfo ? (
                <NavDropdown title={userInfo.username} id="username" className="nav-dropdown-custom">
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>Trang cá nhân</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/user/chat">
                    <NavDropdown.Item>Tư vấn</NavDropdown.Item>
                  </LinkContainer>
                  <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
                  {userInfo.isAdmin && (
                    <>
                      <NavDropdown.Divider />
                      <LinkContainer to="/admin/users">
                        <NavDropdown.Item>Users</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/products">
                        <NavDropdown.Item>Products</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/orders">
                        <NavDropdown.Item>Orders</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/paybox">
                        <NavDropdown.Item>Paybox Admin</NavDropdown.Item>
                      </LinkContainer>
                    </>
                  )}
                </NavDropdown>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link className="text-dark nav-icon-link">
                    <i className="fas fa-user me-1" /> Login
                  </Nav.Link>
                </LinkContainer>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}

export default Header;
