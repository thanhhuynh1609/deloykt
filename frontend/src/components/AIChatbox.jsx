import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Card, Badge, Spinner } from 'react-bootstrap';
import { FaRobot, FaPaperPlane, FaTimes, FaUser } from 'react-icons/fa';
import './AIChatbox.css';

const AIChatbox = ({ show, onHide, userInfo }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (show && messages.length === 0) {
      // Gửi tin nhắn chào mừng khi mở chatbox
      handleWelcomeMessage();
    }
  }, [show]);

  const handleWelcomeMessage = async () => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: `Xin chào${userInfo?.first_name ? ` ${userInfo.first_name}` : ''}! 🤖 Tôi là Smart AI của shop. Tôi có thể:\n\n🔍 Tìm kiếm sản phẩm thông minh\n📊 Cung cấp thống kê database\n💡 Gợi ý sản phẩm phù hợp\n📋 Trả lời mọi câu hỏi về shop\n\nBạn muốn làm gì?`,
      timestamp: new Date(),
      quickReplies: ['Tìm sản phẩm', 'Thống kê shop', 'Gợi ý cho tôi', 'Có bao nhiêu sản phẩm?', 'Hỗ trợ']
    };
    setMessages([welcomeMessage]);
  };

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authTokens') ?
        JSON.parse(localStorage.getItem('authTokens')).access : null;

      if (!token) {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: 'Bạn cần đăng nhập để sử dụng AI chatbox. Vui lòng đăng nhập và thử lại.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
        setIsLoading(false);
        return;
      }

      const requestData = {
        message: message,
        ...(sessionId && { session_id: sessionId }),
        context: {}
      };

      console.log('Sending request data:', requestData);

      const response = await fetch('http://localhost:8000/ai/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${token}`
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        
        if (!sessionId) {
          setSessionId(data.session_id);
        }

        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.message,
          timestamp: new Date(),
          quickReplies: data.quick_replies || [],
          suggestedProducts: data.suggested_products || [],
          actionsTaken: data.actions_taken || []
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      let errorContent = 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.';

      if (error.message.includes('Failed to fetch')) {
        errorContent = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.message.includes('401')) {
        errorContent = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.message.includes('400')) {
        errorContent = 'Dữ liệu không hợp lệ. Vui lòng thử lại.';
      } else if (error.message.includes('500')) {
        errorContent = 'Lỗi server. Vui lòng thử lại sau.';
      }

      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply) => {
    sendMessage(reply);
  };

  const handleProductClick = (product) => {
    // Mở sản phẩm trong tab mới
    window.open(`/#/products/${product.id}`, '_blank');
  };

  const renderMessageContent = (content) => {
    // Render message với markdown-style formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/👉 \[([^\]]+)\]\(([^)]+)\)/g, '👉 <a href="$2" target="_blank" style="color: #007bff; text-decoration: none;">$1</a>') // Links
      .split('\n').map((line, index) => (
        <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
      ));
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" className="ai-chatbox-modal">
      <Modal.Header closeButton className="ai-chatbox-header">
        <Modal.Title>
          <FaRobot className="me-2" />
          Trợ lý AI
          <Badge bg="success" className="ms-2">Online</Badge>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="ai-chatbox-body">
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-avatar">
                {message.type === 'ai' ? <FaRobot /> : <FaUser />}
              </div>
              
              <div className="message-content">
                <div className="message-bubble">
                  {message.type === 'ai' ? renderMessageContent(message.content) : message.content}
                </div>
                
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>

                {/* Quick Replies */}
                {message.quickReplies && message.quickReplies.length > 0 && (
                  <div className="quick-replies">
                    {message.quickReplies.map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline-primary"
                        size="sm"
                        className="quick-reply-btn"
                        onClick={() => handleQuickReply(reply)}
                      >
                        {reply}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Suggested Products */}
                {message.suggestedProducts && message.suggestedProducts.length > 0 && (
                  <div className="suggested-products">
                    <h6>Sản phẩm gợi ý:</h6>
                    <div className="products-grid">
                      {message.suggestedProducts.slice(0, 4).map((product) => (
                        <Card 
                          key={product.id} 
                          className="product-card"
                          onClick={() => handleProductClick(product)}
                        >
                          <Card.Img 
                            variant="top" 
                            src={product.image || '/placeholder.png'} 
                            className="product-image"
                          />
                          <Card.Body className="p-2">
                            <Card.Title className="product-name">
                              {product.name}
                            </Card.Title>
                            <Card.Text className="product-price">
                              {parseInt(product.price).toLocaleString('vi-VN')} VND
                            </Card.Text>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message ai">
              <div className="message-avatar">
                <FaRobot />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </Modal.Body>
      
      <Modal.Footer className="ai-chatbox-footer">
        <Form className="message-form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
          <div className="input-group">
            <Form.Control
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              variant="primary"
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? <Spinner size="sm" /> : <FaPaperPlane />}
            </Button>
          </div>
        </Form>
      </Modal.Footer>
    </Modal>
  );
};

export default AIChatbox;
