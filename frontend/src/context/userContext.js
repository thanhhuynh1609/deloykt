import { createContext, useState, useEffect } from "react";
import httpService from "../services/httpService";
import Loader from "../components/loader";

const UserContext = createContext();

export default UserContext;

export const UserProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null
  );
  const [userInfo, setUserInfo] = useState(
    localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo"))
      : null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    try {
      const { data } = await httpService.post("/auth/jwt/create/", {
        username,
        password,
      });
      setAuthTokens({ access: data.access, refresh: data.refresh });
      localStorage.setItem(
        "authTokens",
        JSON.stringify({ access: data.access, refresh: data.refresh })
      );

      // Gọi tiếp API lấy thông tin user đầy đủ
      httpService.setJwt(data.access); // Đảm bảo token đã set cho request tiếp theo
      const { data: userData } = await httpService.get("/auth/users/me/");

      console.log("Login - User data from server:", userData);

      // Get existing profile data from localStorage if available
      const existingUserInfo = localStorage.getItem("userInfo")
        ? JSON.parse(localStorage.getItem("userInfo"))
        : {};

      console.log(
        "Login - Existing user info from localStorage:",
        existingUserInfo
      );

      const fullUserInfo = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        isAdmin: data.isAdmin,
        // Merge server data with existing localStorage data
        first_name: userData.first_name || existingUserInfo.first_name || "",
        last_name: userData.last_name || existingUserInfo.last_name || "",
        phone: userData.phone || existingUserInfo.phone || "",
        gender: userData.gender || existingUserInfo.gender || "",
        birth_date: userData.birth_date || existingUserInfo.birth_date || "",
        address: userData.address || existingUserInfo.address || "",
        avatar: userData.avatar || existingUserInfo.avatar || null,
        profileFetched: true, // Mark as fetched to prevent infinite loop
      };

      console.log("Login - Setting full user info:", fullUserInfo);

      setUserInfo(fullUserInfo);
      localStorage.setItem("userInfo", JSON.stringify(fullUserInfo));
      setError("");
      return true;
    } catch (ex) {
      setError({ login: ex.response?.data });
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      const { data } = await httpService.post("/auth/users/", {
        username,
        email,
        password,
      });
      await login(username, password);
      return true;
    } catch (ex) {
      setError({ register: ex.response.data });
      return false;
    }
  };

  const logout = () => {
    setAuthTokens(null);
    setUserInfo(null);
    localStorage.removeItem("authTokens");
    // Keep userInfo in localStorage for next login - only remove auth tokens
    // localStorage.removeItem("userInfo"); // Comment this out to preserve profile data
    console.log("Logout - Keeping userInfo in localStorage for next login");
    // httpService.setJwt(undefined)
  };

  const refresh = async () => {
    try {
      const { data } = await httpService.post("/auth/jwt/refresh/", {
        refresh: authTokens.refresh,
      });
      // httpService.setJwt(data.access)
      setAuthTokens({ access: data.access, refresh: data.refresh });
      localStorage.setItem(
        "authTokens",
        JSON.stringify({ access: data.access, refresh: data.refresh })
      );
    } catch (ex) {
      // ✅ Chỉ logout khi refresh token thực sự hết hạn
      console.error("Token refresh failed:", ex.response?.status);
      if (ex.response?.status === 401) {
        logout();
      }
    }
  };

  useEffect(() => {
    if (authTokens) {
      refresh();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    httpService.setJwt(
      authTokens && authTokens.access ? authTokens.access : null
    );
  }, [loading, authTokens]);

  // Separate useEffect for fetching profile to avoid infinite loop
  useEffect(() => {
    // If userInfo exists but missing profile fields, fetch from server
    if (
      authTokens &&
      userInfo &&
      userInfo.id &&
      (!userInfo.first_name || userInfo.first_name === "") &&
      (!userInfo.last_name || userInfo.last_name === "") &&
      (!userInfo.phone || userInfo.phone === "") &&
      !userInfo.profileFetched // Add flag to prevent infinite loop
    ) {
      console.log("UserInfo missing profile data, fetching from server...");
      fetchUserProfile();
    }
  }, [authTokens, userInfo]);

  // Helper function to fetch user profile
  const fetchUserProfile = async () => {
    try {
      const { data: userData } = await httpService.get("/auth/users/me/");
      console.log("Fetched user profile:", userData);

      const updatedUserInfo = {
        ...userInfo,
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        phone: userData.phone || "",
        gender: userData.gender || "",
        birth_date: userData.birth_date || "",
        address: userData.address || "",
        avatar: userData.avatar || userInfo?.avatar || null,
        profileFetched: true, // Add flag to prevent infinite loop
      };

      console.log("Updated user info with profile:", updatedUserInfo);
      setUserInfo(updatedUserInfo);
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // Set flag even on error to prevent infinite retry
      const updatedUserInfo = {
        ...userInfo,
        profileFetched: true,
      };
      setUserInfo(updatedUserInfo);
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
    }
  };

  useEffect(() => {
    let timeInterval = 1000 * 60 * 60; // Refresh tokens after every 1 hour
    const interval = setInterval(() => {
      if (authTokens) refresh();
    }, timeInterval);
    return () => clearInterval(interval);
  }, [authTokens]);

  const updateProfile = async (profileData) => {
    try {
      console.log("Updating profile with data:", profileData);
      console.log("Current userInfo:", userInfo);

      let payload = {};

      // Always include profile fields (allow empty strings)
      payload.first_name = profileData.firstName || "";
      payload.last_name = profileData.lastName || "";
      payload.phone = profileData.phone || "";
      payload.gender = profileData.gender || "";
      payload.birth_date = profileData.birthDate || "";
      payload.address = profileData.address || "";

      // Only include username/email/password if they have values and are different
      if (profileData.username && profileData.username !== userInfo.username) {
        payload.username = profileData.username;
      }
      if (profileData.email && profileData.email !== userInfo.email) {
        payload.email = profileData.email;
      }
      if (profileData.password && profileData.password !== "") {
        payload.password = profileData.password;
      }

      console.log("Sending payload:", payload);

      const { data } = await httpService.patch("/auth/users/me/", payload);
      console.log("Update response:", data);

      // Update userInfo with new data - preserve existing data if server doesn't return it
      const updatedUserInfo = {
        ...userInfo,
        username: data.username || userInfo.username,
        email: data.email || userInfo.email,
        first_name:
          data.first_name !== undefined ? data.first_name : payload.first_name,
        last_name:
          data.last_name !== undefined ? data.last_name : payload.last_name,
        phone: data.phone !== undefined ? data.phone : payload.phone,
        gender: data.gender !== undefined ? data.gender : payload.gender,
        birth_date:
          data.birth_date !== undefined ? data.birth_date : payload.birth_date,
        address: data.address !== undefined ? data.address : payload.address,
        profileFetched: true, // Mark as having profile data
      };

      console.log("Updated userInfo:", updatedUserInfo);
      setUserInfo(updatedUserInfo);
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
      setError("");
      return true;
    } catch (ex) {
      console.error("Update profile error:", ex);
      console.error("Error response:", ex.response?.data);
      setError(ex.response?.data?.message || "Cập nhật thông tin thất bại");
      return false;
    }
  };

  const uploadAvatar = async (avatarFile) => {
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      console.log("Uploading avatar file:", avatarFile);
      console.log("FormData:", formData);

      // Try different endpoints for avatar upload
      let response;
      let avatarUrl;

      try {
        // First try dedicated avatar upload endpoint
        response = await httpService.post("/auth/users/avatar/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        const { data } = response;
        console.log("Avatar upload response:", data);
        avatarUrl = data.avatar || data.user?.avatar || data.profile_picture;
      } catch (error) {
        console.log("Avatar endpoint failed, trying profile update:", error);
        try {
          // Fallback to profile update endpoint
          response = await httpService.patch("/auth/users/me/", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          const { data } = response;
          console.log("Profile update response:", data);
          avatarUrl = data.avatar || data.user?.avatar || data.profile_picture;
        } catch (error2) {
          console.log(
            "Profile update endpoint also failed, using local preview:",
            error2
          );
          // If both endpoints fail, we'll use the local preview
          // Create a blob URL for the uploaded file
          avatarUrl = URL.createObjectURL(avatarFile);
          console.log("Created blob URL for avatar:", avatarUrl);
        }
      }

      // If no avatar URL from server, create blob URL for local preview
      if (!avatarUrl) {
        avatarUrl = URL.createObjectURL(avatarFile);
        console.log("No avatar URL from server, created blob URL:", avatarUrl);
      }

      // Update userInfo with new avatar
      const updatedUserInfo = {
        ...userInfo,
        avatar: avatarUrl,
      };

      setUserInfo(updatedUserInfo);
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
      console.log("Updated userInfo with avatar:", updatedUserInfo);

      return avatarUrl;
    } catch (ex) {
      console.error("Upload avatar error:", ex);
      console.error("Error response:", ex.response?.data);

      // As a last resort, create a blob URL
      try {
        const blobUrl = URL.createObjectURL(avatarFile);
        console.log("Created fallback blob URL:", blobUrl);

        const updatedUserInfo = {
          ...userInfo,
          avatar: blobUrl,
        };

        setUserInfo(updatedUserInfo);
        localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));

        return blobUrl;
      } catch (blobError) {
        console.error("Failed to create blob URL:", blobError);
        throw new Error("Upload ảnh thất bại");
      }
    }
  };

  const contextData = {
    authTokens,
    userInfo,
    error,
    login,
    register,
    refresh,
    logout,
    updateProfile,
    uploadAvatar,
  };

  return (
    <UserContext.Provider value={contextData}>
      {loading && <Loader />}
      {!loading && children}
    </UserContext.Provider>
  );
};
