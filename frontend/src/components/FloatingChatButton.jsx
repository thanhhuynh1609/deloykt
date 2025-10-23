import React, { useState, useContext } from 'react';
import { Button } from 'react-bootstrap';
import { FaRobot, FaTimes } from 'react-icons/fa';
import AIChatbox from './AIChatbox';
import UserContext from "../context/userContext";
import './AIChatbox.css';

const FloatingChatButton = () => {
  const [showChatbox, setShowChatbox] = useState(false);
  const { userInfo } = useContext(UserContext);

  const handleToggleChatbox = () => {
    setShowChatbox(!showChatbox);
  };

  return (
    <>
      <Button
        className="floating-chat-btn ai-chat"
        onClick={handleToggleChatbox}
        title="Trợ lý AI"
      >
        {showChatbox ? <FaTimes /> : <FaRobot />}
      </Button>

      <AIChatbox
        show={showChatbox}
        onHide={() => setShowChatbox(false)}
        userInfo={userInfo}
      />
    </>
  );
};

export default FloatingChatButton;
