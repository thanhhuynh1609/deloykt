import React, { useState, useContext } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FaComments, FaTimes } from 'react-icons/fa';
import ChatBox from './chat';
import UserContext from "../context/userContext";
import './AIChatbox.css';

const FloatingAdminChatButton = () => {
  const [showChatbox, setShowChatbox] = useState(false);
  const { userInfo, authTokens } = useContext(UserContext);
  
  const adminId = 1; // ID admin
  const userId = userInfo?.id;
  const token = authTokens?.access;
  const userName = userInfo?.username;

  const handleToggleChatbox = () => {
    setShowChatbox(!showChatbox);
  };

  // Không hiển thị nếu chưa đăng nhập
  if (!userId || !token) return null;

  return (
    <>
      <Button
        className="floating-chat-btn admin-chat"
        onClick={handleToggleChatbox}
        title="Chat với Admin"
      >
        {showChatbox ? <FaTimes /> : <FaComments />}
      </Button>

      <Modal show={showChatbox} onHide={() => setShowChatbox(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chat với Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px' }}>
          <ChatBox
            userId={adminId}
            currentUserId={userId}
            token={token}
            userName={userName}
            isAdmin={false}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default FloatingAdminChatButton;
