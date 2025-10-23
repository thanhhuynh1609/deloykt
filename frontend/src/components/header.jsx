import React, { useContext, useState, useEffect  } from "react";
import { Navbar, Nav, Container, NavDropdown, Badge, Button } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import UserContext from "../context/userContext";
import { FavoriteContext } from "../context/favoriteContext";
import SearchBox from "./searchBox";
import AISearch from './AISearch';
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

  const [showAISearch, setShowAISearch] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Cuộn xuống và đã cuộn quá 100px -> ẩn header
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Cuộn lên -> hiện header
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header className={`header-border ${!isVisible ? 'header-hidden' : ''}`}>
      <Navbar bg="white" expand="lg" className="py-3">
        <Container>
          {/* Logo */}
          <LinkContainer to="/">
            <Navbar.Brand className="navbar-brand text-dark">TNBH.ONLINE</Navbar.Brand>
          </LinkContainer>

          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            {/* Menu Center */}
           
            {/* Search Box */}
            <div className="search-container d-flex align-items-center">
              <SearchBox keyword={keyword} setKeyword={setKeyword} />
              <Button 
                variant="outline-primary" 
                className="ms-2 ai-search-btn"
                onClick={() => setShowAISearch(true)}
                title="Tìm kiếm bằng AI"
              >
                <i className="fas fa-camera"></i>
              </Button>
            </div>

            {/* Icon Right */}
            <Nav className="ms-auto align-items-center">
              <LinkContainer to="/cart">
                <Nav.Link className="text-dark nav-icon-link">
                  <i className="fas fa-shopping-cart" />
                </Nav.Link>
              </LinkContainer>

              {userInfo && (
                <>
                  <LinkContainer to="/favorites">
                    <Nav.Link className="text-dark nav-icon-link">
                      <i className="fas fa-heart" />
                      {favorites.length > 0 && (
                        <Badge pill bg="danger" className="ms-1">
                          {favorites.length}
                        </Badge>
                      )}
                    </Nav.Link>
                  </LinkContainer>

                  <LinkContainer to="/paybox">
                    <Nav.Link className="text-dark nav-icon-link">
                      <i className="fas fa-wallet" />
                    </Nav.Link>
                  </LinkContainer>
                </>
              )}

              {userInfo ? (
                <NavDropdown
                  title={<i className="fas fa-user" />}
                  id="user-menu"
                  className="nav-dropdown-custom"
                >
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>Profile</NavDropdown.Item>
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
                    <i className="fas fa-user" />
                  </Nav.Link>
                </LinkContainer>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <AISearch 
        show={showAISearch} 
        onHide={() => setShowAISearch(false)} 
      />
    </header>
  );
}

export default Header;
