import React, { useEffect, useState, useRef } from "react";

function ChatBox({ userId, currentUserId, token, userName, isAdmin }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const ws = useRef(null);
  const bottomRef = useRef(null);

  const roomName = [userId, currentUserId].sort().join("_");

  useEffect(() => {
    fetch(`/api/chat/messages/${roomName}/`, {
      headers: { Authorization: `JWT ${token}` },
    })
      .then((res) => res.json())
      .then(setMessages);

    // Get WebSocket URL based on environment
    const getWebSocketURL = () => {
      if (process.env.NODE_ENV === 'production') {
        // In production, use wss:// and current domain
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws/chat/${roomName}/`;
      }
      // In development, use localhost
      return `ws://localhost:8000/ws/chat/${roomName}/`;
    };

    const wsUrl = getWebSocketURL();
    console.log('WebSocket connecting to:', wsUrl);

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected successfully');
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [...prev, data]);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomName, token]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest", // 💥 CHÌA KHOÁ ở đây!
      });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    // Check WebSocket state before sending
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({ message: input, sender_id: currentUserId })
      );
      setInput("");
    } else {
      console.error('WebSocket is not connected. State:', ws.current?.readyState);
      // Optionally show user notification
      alert('Kết nối chat bị gián đoạn. Vui lòng tải lại trang.');
    }
  };

  const styles = {
    container: {
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#e5e7eb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px 24px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      position: 'relative',
      zIndex: 1
    },
    headerBg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: 'bold',
      backdropFilter: 'blur(10px)',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: 'rgba(255,255,255,0.3)'
    },
    headerText: {
      flex: 1
    },
    headerTitle: {
      fontSize: '18px',
      fontWeight: '600',
      margin: '0 0 4px 0',
      lineHeight: 1.2
    },
    headerSubtitle: {
      fontSize: '14px',
      opacity: 0.8,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    onlineIndicator: {
      width: '8px',
      height: '8px',
      backgroundColor: '#10b981',
      borderRadius: '50%',
      animation: 'pulse 2s infinite'
    },
    messagesContainer: {
      height: '400px',
      overflowY: 'auto',
      background: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
      padding: '20px',
      position: 'relative'
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#6b7280',
      textAlign: 'center'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px',
      opacity: 0.5
    },
    messageGroup: {
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '20px',
      animation: 'slideInUp 0.3s ease-out'
    },
    messageHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    messageAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
      color: 'white'
    },
    messageName: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#6b7280'
    },
    messageBubble: {
      position: 'relative',
      padding: '12px 16px',
      borderRadius: '18px',
      maxWidth: '75%',
      wordBreak: 'break-word',
      lineHeight: 1.4,
      fontSize: '14px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease'
    },
    myMessage: {
      alignItems: 'flex-end'
    },
    myMessageHeader: {
      flexDirection: 'row-reverse'
    },
    myMessageBubble: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderBottomRightRadius: '6px',
      marginLeft: 'auto'
    },
    otherMessage: {
      alignItems: 'flex-start'
    },
    otherMessageBubble: {
      backgroundColor: '#ffffff',
      color: '#374151',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#e5e7eb',
      borderBottomLeftRadius: '6px'
    },
    timestamp: {
      fontSize: '11px',
      marginTop: '4px',
      opacity: 0.7
    },
    inputContainer: {
      padding: '20px',
      backgroundColor: '#ffffff',
      borderTopWidth: '1px',
      borderTopStyle: 'solid',
      borderTopColor: '#f3f4f6'
    },
    inputWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '25px',
      padding: '8px 20px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#e5e7eb',
      transition: 'all 0.2s ease'
    },
    input: {
      flex: 1,
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      fontSize: '14px',
      color: '#374151',
      lineHeight: 1.5
    },
    sendButton: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      position: 'relative',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
    }
  };

  return (
    <div>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .messages-scroll::-webkit-scrollbar {
            width: 6px;
          }
          
          .messages-scroll::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          
          .messages-scroll::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
          }
          
          .messages-scroll::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        `}
      </style>
      
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerBg} />
          <div style={styles.headerContent}>
            <div style={styles.avatar}>
              💬
            </div>
            <div style={styles.headerText}>
              <h2 style={styles.headerTitle}>
                Chat với {userName || "User"}
              </h2>
              <p style={styles.headerSubtitle}>
                <span style={styles.onlineIndicator}></span>
                Đang trực tuyến
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          style={styles.messagesContainer} 
          className="messages-scroll"
        >
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💬</div>
              <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>
                Chưa có tin nhắn nào
              </p>
              <p style={{ fontSize: '14px', margin: 0, opacity: 0.7 }}>
                Hãy bắt đầu cuộc trò chuyện!
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMyMessage = msg.sender_id === currentUserId;
              const senderName = isMyMessage
                ? (isAdmin ? "Admin" : userName || "User")
                : (isAdmin ? userName || "User" : "Admin");
              
              return (
                <div
                  key={idx}
                  style={{
                    ...styles.messageGroup,
                    ...(isMyMessage ? styles.myMessage : styles.otherMessage)
                  }}
                >
                  <div style={{
                    ...styles.messageHeader,
                    ...(isMyMessage ? styles.myMessageHeader : {})
                  }}>
                    <div style={{
                      ...styles.messageAvatar,
                      background: isMyMessage 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    }}>
                      👤
                    </div>
                    <span style={styles.messageName}>{senderName}</span>
                  </div>
                  
                  <div style={{
                    ...styles.messageBubble,
                    ...(isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble)
                  }}>
                    {msg.message}
                    <div style={{
                      ...styles.timestamp,
                      textAlign: isMyMessage ? 'right' : 'left'
                    }}>
                      {new Date().toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputContainer}>
          <div style={styles.inputWrapper}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              style={styles.input}
              placeholder="Nhập tin nhắn của bạn..."
            />
            
            <button
              onClick={sendMessage}
              style={styles.sendButton}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;