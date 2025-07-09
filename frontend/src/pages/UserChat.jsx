import React, { useContext } from "react";
import ChatBox from "../components/chat";
import UserContext from "../context/userContext";

function UserChat() {
  const { userInfo, authTokens } = useContext(UserContext);
  const adminId = 1; // ID admin, có thể lấy từ backend hoặc config
  const userId = userInfo?.id;
  const token = authTokens?.access;
  const userName = userInfo?.username;

  if (!userId || !token)
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontSize: 16,
          color: "#555",
        }}
      >
        Vui lòng đăng nhập để sử dụng chức năng chat.
      </div>
    );

  return (
    <div
      style={{
        maxWidth: "auto",
        margin: "0 auto",
        padding: 24,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Chat với Admin</h2>

      <ChatBox
        userId={adminId}
        currentUserId={userId}
        token={token}
        userName={userName}
        isAdmin={false}
      />
    </div>
  );
}

export default UserChat;
