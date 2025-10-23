import React, { useState, useContext } from 'react';
import { Button, Badge } from 'react-bootstrap';
import { FaComments, FaTimes } from 'react-icons/fa';
import AdminChatWidget from './AdminChatWidget';
import UserContext from "../context/userContext";
import './FloatingAdminChatButton.css';

const FloatingAdminChatButton = () => {
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userInfo, authTokens } = useContext(UserContext);
  
  const userId = userInfo?.id;
  const token = authTokens?.access;

  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setUnreadCount(0); // Reset unread count when opening
    }
  };

  // Không hiển thị nếu chưa đăng nhập
  if (!userId || !token) return null;

  return (
    <>
      <Button 
        className="floating-admin-chat-btn"
        onClick={toggleChat}
        title="Chat với Admin"
      >
        {showChat ? <FaTimes /> : <FaComments />}
        {unreadCount > 0 && !showChat && (
          <Badge pill bg="danger" className="admin-unread-badge">
            {unreadCount}
          </Badge>
        )}
      </Button>
      
      <AdminChatWidget 
        show={showChat} 
        onToggle={toggleChat}
      />
    </>
  );
};

export default FloatingAdminChatButton;
