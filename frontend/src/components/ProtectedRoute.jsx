import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import UserContext from '../context/userContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { userInfo } = useContext(UserContext);

  // Check if user is logged in
  if (!userInfo || !userInfo.username) {
    return <Navigate to="/login" replace />;
  }

  // Check if admin access is required
  if (adminOnly && !userInfo.isAdmin) {
    console.log("ProtectedRoute - Admin check failed:", {
      userInfo: userInfo,
      isAdmin: userInfo.isAdmin,
      adminOnly: adminOnly
    });
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
