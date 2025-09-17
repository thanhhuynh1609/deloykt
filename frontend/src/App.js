import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/header";
import Footer from "./components/footer";
import { ToastContainer } from "react-toastify";

// User pages
import HomePage from "./pages/homePage";
import ProductPage from "./pages/productPage";
import CartPage from "./pages/cartPage";
import LoginPage from "./pages/loginPage";
import RegisterPage from "./pages/registerPage";
import ProfilePage from "./pages/profilePage";
import Logout from "./pages/logout";
import ShippingPage from "./pages/shippingPage";
import PlacerOrderPage from "./pages/placeOrderPage";
import OrderDetailsPage from "./pages/orderDetailsPage";
import ConfirmationPage from "./pages/confirmationPage";
import PaymentPage from "./pages/paymentPage";
import SearchPage from "./pages/searchPage";
import PayboxPage from "./pages/PayboxPage";
import FavoritesPage from "./pages/favoritesPage";
import TKBPage from "./pages/tkb";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminPaybox from "./pages/admin/AdminPaybox";
import AdminRefund from "./pages/admin/AdminRefund";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminChat from "./pages/admin/AdminChat";

import FloatingAdminChatButton from './components/FloatingAdminChatButton';

// Context providers
import { ProductsProvider } from "./context/productsContext";
import { CartProvider } from "./context/cartContext";
import { UserProvider } from "./context/userContext";
import { PayboxProvider } from "./context/payboxContext";
import { FavoriteProvider } from "./context/favoriteContext";

// Other components
import ProtectedRoute from "./components/ProtectedRoute";
import UserChat from "./pages/UserChat";

import "./App.css";
import TKBLoginPage from "./pages/tkbLogin";

const AppContent = () => {
  const location = useLocation();
  const [keyword, setKeyword] = useState("");
  const queryParams = new URLSearchParams(window.location.search);
  const keywordParam = queryParams.get("keyword") || "";

  useEffect(() => {
    setKeyword(keywordParam);
  }, [keywordParam]);

  const isAdminRoute = location.pathname.startsWith("/admin")|| location.pathname === "/tkb" || location.pathname === "/tkblogin";

  return (
    <div>
       <ToastContainer position="top-right" autoClose={3000} />
      <UserProvider>
        <PayboxProvider>
          {!isAdminRoute && <Header keyword={keyword} setKeyword={setKeyword} />}
          <main className={isAdminRoute ? "" : "py-3"}>
            <ProductsProvider>
              <CartProvider>
                <FavoriteProvider>
                  {!isAdminRoute ? (
                    <Container>
                      <Routes>
                        <Route path="/" element={<HomePage />} exact />
                        <Route path="/search" element={<SearchPage keyword={keyword} />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/logout" element={<Logout />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/paybox" element={<PayboxPage />} />
                        <Route path="/products/:id" element={<ProductPage />} />
                        <Route path="/orders/:id" element={<OrderDetailsPage />} />
                        <Route path="/payment" element={<PaymentPage />} />
                        <Route path="/shipping" element={<ShippingPage />} />
                        <Route path="/confirmation" element={<ConfirmationPage />} />
                        <Route path="/placeorder" element={<PlacerOrderPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/user/chat" element={<UserChat />} />
                        <Route path="/favorites" element={<FavoritesPage />} />
                        <Route path="/tkb" element={<TKBPage />} />
                        <Route path="/tkblogin" element={<TKBLoginPage />} />
                      </Routes>
                    </Container>
                  ) : (
                    <Routes>
                      <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
                      <Route path="/admin/products" element={<ProtectedRoute adminOnly={true}><AdminProducts /></ProtectedRoute>} />
                      <Route path="/admin/orders" element={<ProtectedRoute adminOnly={true}><AdminOrders /></ProtectedRoute>} />
                      <Route path="/admin/categories" element={<ProtectedRoute adminOnly={true}><AdminCategories /></ProtectedRoute>} />
                      <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><AdminUsers /></ProtectedRoute>} />
                      <Route path="/admin/brands" element={<ProtectedRoute adminOnly={true}><AdminBrands /></ProtectedRoute>} />
                      <Route path="/admin/reviews" element={<ProtectedRoute adminOnly={true}><AdminReviews /></ProtectedRoute>} />
                      <Route path="/admin/chat" element={<ProtectedRoute adminOnly={true}><AdminChat /></ProtectedRoute>} />
                      <Route path="/admin/paybox" element={<ProtectedRoute adminOnly={true}><AdminPaybox /></ProtectedRoute>} />
                      <Route path="/admin/refunds" element={<ProtectedRoute adminOnly={true}><AdminRefund /></ProtectedRoute>} />
                      <Route path="/admin/coupons" element={<ProtectedRoute adminOnly={true}><AdminCoupons /></ProtectedRoute>} />
                      <Route path="/tkb" element={<TKBPage />} />
                      <Route path="/tkblogin" element={<TKBLoginPage />} />
                    </Routes>
                  )}
                </FavoriteProvider>
              </CartProvider>
            </ProductsProvider>
          </main>
          {!isAdminRoute && <Footer />}
          <FloatingAdminChatButton />
        </PayboxProvider>
      </UserProvider>
    </div>
  );
};

function App() {
  return <AppContent />;
}

export default App;
