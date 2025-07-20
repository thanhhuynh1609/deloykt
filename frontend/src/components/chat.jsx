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

  return (
    <div style={{ maxWidth: "auto", margin: "0 auto" }}>
      <div
        style={{
          height: 350,
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          backgroundColor: "#f9f9f9",
          marginBottom: 12,
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems:
                msg.sender_id === currentUserId ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}
          >
            {/* Tên người gửi */}
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: "bold",
                marginBottom: 4,
                color: "#555",
              }}
            >
              {msg.sender_id === currentUserId
                ? isAdmin
                  ? "Admin"
                  : userName || "User"
                : isAdmin
                ? userName || "User"
                : "Admin"}
            </div>

            {/* Nội dung tin nhắn */}
            <div
              style={{
                backgroundColor:
                  msg.sender_id === currentUserId ? "#4CAF50" : "#e0e0e0",
                color: msg.sender_id === currentUserId ? "#fff" : "#000",
                padding: "8px 12px",
                borderRadius: 16,
                maxWidth: "75%",
                wordBreak: "break-word",
              }}
            >
              {msg.message}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Ô nhập và nút gửi */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 20,
            border: "1px solid #ccc",
            outline: "none",
            fontSize: 14,
          }}
          placeholder="Nhập tin nhắn..."
        />
        <button
          onClick={sendMessage}
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "10px 16px",
            border: "none",
            borderRadius: 20,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
