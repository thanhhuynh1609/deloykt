import React, { useState, useEffect, useRef, useContext } from 'react';
import { Button, Form, Card, Badge, Spinner } from 'react-bootstrap';
import { FaComments, FaPaperPlane, FaMinus, FaTimes, FaUser, FaUserShield } from 'react-icons/fa';
import UserContext from '../context/userContext';
import httpService from '../services/httpService';
import './AdminChatWidget.css';

const AdminChatWidget = ({ show, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // Thêm state này
  const messagesEndRef = useRef(null);
  const { userInfo, authTokens } = useContext(UserContext);

  const adminId = 1; // ID admin
  const userId = userInfo?.id;
  const token = authTokens?.access;
  const userName = userInfo?.username;

  const roomName = [adminId, userId].sort().join("_");

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (show && userId && token) {
      initializeChat();
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [show, userId, token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getWebSocketURL = () => {
    if (process.env.NODE_ENV === 'production') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws/chat/${roomName}/`;
    }
    return `ws://localhost:8000/ws/chat/${roomName}/`;
  };

  const initializeChat = async () => {
    try {
      // Load existing messages using httpService
      const response = await httpService.get(`/api/chat/messages/${roomName}/`);
      if (response.status >= 200 && response.status < 300) {
        const existingMessages = response.data;
        setMessages(existingMessages);
      }

      // Initialize WebSocket
      const wsUrl = getWebSocketURL();
      console.log('Admin Chat WebSocket connecting to:', wsUrl);

      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('Admin Chat WebSocket connected successfully');
        setWs(websocket);
        setIsConnected(true); // Đặt connected = true
      };

      websocket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setMessages((prev) => [...prev, data]);
      };

      websocket.onerror = (error) => {
        console.error('Admin Chat WebSocket error:', error);
        setIsConnected(false);
      };

      websocket.onclose = (event) => {
        console.log('Admin Chat WebSocket closed:', event.code, event.reason);
        setWs(null);
        setIsConnected(false);
      };

      setWs(websocket);
    } catch (error) {
      console.error('Error initializing admin chat:', error);
      setIsConnected(false);
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !isConnected) { // Sử dụng isConnected thay vì kiểm tra ws
      console.error('Admin Chat WebSocket is not connected');
      return;
    }

    ws.send(JSON.stringify({ message: inputMessage, sender_id: userId }));
    setInputMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!show || !userId || !token) return null;

  return (
    <div className={`admin-chat-widget ${isMinimized ? 'minimized' : ''}`}>
      <div className="admin-chat-header">
        <div>
          <FaUserShield className="me-2" />
          Chat với Admin
          <Badge bg={isConnected ? "success" : "warning"} className="ms-2">
            {isConnected ? "Online" : "Connecting..."}
          </Badge>
        </div>
        <div className="admin-chat-header-buttons">
          <button 
            className="admin-chat-header-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Phóng to" : "Thu nhỏ"}
          >
            <FaMinus />
          </button>
          <button 
            className="admin-chat-header-btn"
            onClick={onToggle}
            title="Đóng"
          >
            <FaTimes />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          <div className="admin-chat-body">
            <div className="admin-messages-container">
              {messages.length === 0 ? (
                <div className="admin-empty-state">
                  <div className="admin-empty-icon">💬</div>
                  <p className="admin-empty-title">Chưa có tin nhắn nào</p>
                  <p className="admin-empty-subtitle">Hãy bắt đầu cuộc trò chuyện với Admin!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMyMessage = msg.sender_id === userId;
                  const senderName = isMyMessage ? userName || "Bạn" : "Admin";
                  
                  return (
                    <div
                      key={idx}
                      className={`admin-message ${isMyMessage ? 'my-message' : 'admin-message'}`}
                    >
                      <div className="admin-message-avatar">
                        {isMyMessage ? <FaUser /> : <FaUserShield />}
                      </div>
                      
                      <div className="admin-message-content">
                        <div className="admin-message-bubble">
                          {msg.message}
                        </div>
                        
                        <div className="admin-message-time">
                          {formatTime(new Date())}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {isTyping && (
                <div className="admin-message admin-message">
                  <div className="admin-message-avatar">
                    <FaUserShield />
                  </div>
                  <div className="admin-message-content">
                    <div className="admin-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <div className="admin-chat-footer">
            <Form className="admin-message-form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
              <div className="admin-input-group">
                <Form.Control
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!isConnected} // Sử dụng isConnected
                />
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={!isConnected || !inputMessage.trim()} // Sử dụng isConnected
                >
                  {isConnected ? <FaPaperPlane /> : <Spinner size="sm" />}
                </Button>
              </div>
            </Form>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminChatWidget;
