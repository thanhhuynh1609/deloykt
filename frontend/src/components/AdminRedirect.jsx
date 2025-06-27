import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserContext from '../context/userContext';

const AdminRedirect = ({ children }) => {
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is admin, redirect to admin dashboard
    if (userInfo && userInfo.isAdmin) {
      navigate('/admin');
    }
  }, [userInfo, navigate]);

  // If user is admin, don't render children (they'll be redirected)
  if (userInfo && userInfo.isAdmin) {
    return null;
  }

  // For non-admin users, render the children (normal page content)
  return children;
};

export default AdminRedirect;
