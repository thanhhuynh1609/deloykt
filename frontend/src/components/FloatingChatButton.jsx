import React, { useState } from 'react';
import { Button, Badge } from 'react-bootstrap';
import { FaRobot, FaTimes } from 'react-icons/fa';
import AIChatWidget from './AIChatWidget';
import './FloatingChatButton.css';

const FloatingChatButton = () => {
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setUnreadCount(0); // Reset unread count when opening
    }
  };

  return (
    <>
      <button 
        className="floating-chat-btn"
        variant="none"
        onClick={toggleChat}
        title="Chat với AI"
      >
        {showChat ? <FaTimes /> : <FaRobot />}
        {unreadCount > 0 && !showChat && (
          <Badge pill bg="danger" className="unread-badge">
            {unreadCount}
          </Badge>
        )}
      </button>
      
      <AIChatWidget 
        show={showChat} 
        onToggle={toggleChat}
        userInfo={{first_name: 'User'}} // Thay bằng user info thực
      />
    </>
  );
};

export default FloatingChatButton;
