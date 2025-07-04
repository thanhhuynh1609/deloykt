import React, { useState, useEffect, useContext } from "react";
import ChatBox from "../../components/chat";
import UserContext from "../../context/userContext";
import httpService from "../../services/httpService";
import AdminLayout from "../../components/admin/AdminLayout";

function AdminChat() {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const { userInfo, authTokens } = useContext(UserContext);
  const adminId = userInfo?.id;
  const token = authTokens?.access;

  useEffect(() => {
    if (token) {
      httpService.setJwt(token);
      httpService.get("/auth/users/").then((res) => {
        const filtered = res.data.filter((u) => u.id !== adminId);
        setUsers(filtered);
      });
    }
  }, [token, adminId]);

  return (
    <AdminLayout>
      <div
        style={{
          display: "flex",
          gap: 24,
          padding: 24,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Danh sách user */}
        <div
          style={{
            width: 220,
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            backgroundColor: "#fafafa",
          }}
        >
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>Danh sách User</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  border:
                    selectedUserId === user.id
                      ? "2px solid #4CAF50"
                      : "1px solid #ccc",
                  backgroundColor:
                    selectedUserId === user.id ? "#e8f5e9" : "white",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
              >
                {user.username || user.name}
              </button>
            ))}
          </div>
        </div>

        {/* Khung chat */}
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: 16 }}>Admin Chat</h2>
          {selectedUserId && adminId && token ? (
            <ChatBox
              userId={selectedUserId}
              currentUserId={adminId}
              token={token}
              userName={
                users.find((u) => u.id === selectedUserId)?.username || "User"
              }
              isAdmin={true}
            />
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                border: "1px dashed #ccc",
                borderRadius: 8,
                color: "#888",
              }}
            >
              Vui lòng chọn một user để bắt đầu chat.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminChat;
