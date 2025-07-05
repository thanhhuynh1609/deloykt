import React, { useContext } from "react";
import { Navbar, Nav, Container, NavDropdown, Badge } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import UserContext from "../context/userContext";
import { FavoriteContext } from "../context/favoriteContext";
import SearchBox from "./searchBox";

function Header({ keyword, setKeyword }) {
  const { userInfo, logout } = useContext(UserContext);
  
  // Sử dụng try-catch để tránh lỗi khi FavoriteContext chưa được khởi tạo
  let favorites = [];
  try {
    const favoriteContext = useContext(FavoriteContext);
    favorites = favoriteContext?.favorites || [];
  } catch (error) {
    console.warn("FavoriteContext not available:", error);
  }

  return (
    <header>
      <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect>
        <Container className="">
          <LinkContainer to="/">
            <Navbar.Brand>Proshop</Navbar.Brand>
          </LinkContainer>
          <SearchBox keyword={keyword} setKeyword={setKeyword}/>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <LinkContainer to="/cart">
                <Nav.Link>
                  <i className="fas fa-shopping-cart" /> Cart
                </Nav.Link>
              </LinkContainer>
              
              {userInfo && (
                <>
                  <LinkContainer to="/favorites">
                    <Nav.Link>
                      <i className="fas fa-heart" /> Favorites
                      {favorites.length > 0 && (
                        <Badge pill bg="danger" className="ms-1">
                          {favorites.length}
                        </Badge>
                      )}
                    </Nav.Link>
                  </LinkContainer>
                  
                  <LinkContainer to="/paybox">
                    <Nav.Link>
                      <i className="fas fa-wallet" /> Paybox
                    </Nav.Link>
                  </LinkContainer>
                </>
              )}
              
              {userInfo ? (
                <NavDropdown title={userInfo.username} id="username">
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>Profile</NavDropdown.Item>
                  </LinkContainer>
                  {userInfo.isAdmin && (
                    <>
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
                  <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
                </NavDropdown>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link>
                    <i className="fas fa-user" /> Login
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
