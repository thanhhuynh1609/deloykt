// import React, { useContext } from "react";
// import { Navbar, Nav, Container, NavDropdown, Badge } from "react-bootstrap";
// import { LinkContainer } from "react-router-bootstrap";
// import UserContext from "../context/userContext";
// import { FavoriteContext } from "../context/favoriteContext";
// import SearchBox from "./searchBox";
// import "./Header.css";

// function Header({ keyword, setKeyword }) {
//   const { userInfo, logout } = useContext(UserContext);

//   let favorites = [];
//   try {
//     const favoriteContext = useContext(FavoriteContext);
//     favorites = favoriteContext?.favorites || [];
//   } catch (error) {
//     console.warn("FavoriteContext not available:", error);
//   }

//   return (
//     <header className="header-border">
//       <Navbar bg="light" variant="light" expand="lg" collapseOnSelect>
//         <Container>
//           <LinkContainer to="/">
//             <Navbar.Brand className="fw-bold text-primary">TNBHStore</Navbar.Brand>
//           </LinkContainer>

//           {/* Cho SearchBox vào div để canh flex và margin */}
//           <div className="search-container">
//             <SearchBox keyword={keyword} setKeyword={setKeyword} />
//           </div>

//           <Navbar.Toggle aria-controls="basic-navbar-nav" />
//           <Navbar.Collapse id="basic-navbar-nav" className="no-flex-grow">
//             <Nav className="ms-auto align-items-center">
//               <LinkContainer to="/cart">
//                 <Nav.Link className="text-dark nav-icon-link">
//                   <i className="fas fa-shopping-cart me-1" /> 
//                 </Nav.Link>
//               </LinkContainer>

//               {userInfo && (
//                 <>
//                   <LinkContainer to="/favorites">
//                     <Nav.Link className="text-dark nav-icon-link">
//                       <i className="fas fa-heart me-1" /> 
//                       {favorites.length > 0 && (
//                         <Badge pill bg="danger" className="ms-1">
//                           {favorites.length}
//                         </Badge>
//                       )}
//                     </Nav.Link>
//                   </LinkContainer>

//                   <LinkContainer to="/paybox">
//                     <Nav.Link className="text-dark nav-icon-link">
//                       <i className="fas fa-wallet me-1" /> 
//                     </Nav.Link>
//                   </LinkContainer>
//                 </>
//               )}

//               {userInfo ? (
//                 <NavDropdown title={userInfo.username} id="username" className="nav-dropdown-custom">
//                   <LinkContainer to="/profile">
//                     <NavDropdown.Item>profile</NavDropdown.Item>
//                   </LinkContainer>
//                   <LinkContainer to="/user/chat">
//                     <NavDropdown.Item>Tư vấn</NavDropdown.Item>
//                   </LinkContainer>
//                   <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
//                   {userInfo.isAdmin && (
//                     <>
//                       <NavDropdown.Divider />
//                       <LinkContainer to="/admin/users">
//                         <NavDropdown.Item>Users</NavDropdown.Item>
//                       </LinkContainer>
//                       <LinkContainer to="/admin/products">
//                         <NavDropdown.Item>Products</NavDropdown.Item>
//                       </LinkContainer>
//                       <LinkContainer to="/admin/orders">
//                         <NavDropdown.Item>Orders</NavDropdown.Item>
//                       </LinkContainer>
//                       <LinkContainer to="/admin/paybox">
//                         <NavDropdown.Item>Paybox Admin</NavDropdown.Item>
//                       </LinkContainer>
//                     </>
//                   )}
//                 </NavDropdown>
//               ) : (
//                 <LinkContainer to="/login">
//                   <Nav.Link className="text-dark nav-icon-link">
//                     <i className="fas fa-user me-1" /> 
//                   </Nav.Link>
//                 </LinkContainer>
//               )}
//             </Nav>
//           </Navbar.Collapse>
//         </Container>
//       </Navbar>
//     </header>
//   );
// }

// export default Header;
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
      <Navbar bg="white" expand="lg" className="py-3">
        <Container>
          {/* Logo */}
          <LinkContainer to="/">
            <Navbar.Brand className="navbar-brand text-dark">TNB.COM</Navbar.Brand>
          </LinkContainer>

          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            {/* Menu Center */}
           
            {/* Search Box */}
            <div className="search-container">
              <SearchBox keyword={keyword} setKeyword={setKeyword} />
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
    </header>
  );
}

export default Header;
