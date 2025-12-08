// src/api/axiosConfig.js
// --------------------------------------------------------------
// Cấu hình axios cho toàn bộ FE
//  - Gắn accessToken vào header Authorization
//  - Tự động gọi /api/auth/refresh khi gặp 401 (token hết hạn)
//  - CHỐNG vòng lặp vô hạn khi /refresh cũng trả về 401
//  - Toàn bộ comment tiếng Việt (Rule 13)
// --------------------------------------------------------------

import axios from "axios";
import { message } from "antd";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Lấy token từ localStorage
const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");

// ===============================
// REQUEST INTERCEPTOR
// ===============================
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      // Gắn accessToken vào header cho mọi request
      config.headers["Authorization"] = "Bearer " + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// RESPONSE INTERCEPTOR – XỬ LÝ 401
// ===============================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu không có response (lỗi mạng...) thì trả về luôn
    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const msg = error.response.data?.message;

    // ================================
    // 1) HIỂN THỊ LỖI TỪ BE CHO TẤT CẢ NON-401
    // ================================
    if (status !== 401) {
      if (msg) {
        message.error(msg); // ⚡ FE sẽ hiển thị đúng lỗi BE throw
      }
      return Promise.reject(error);
    }

    // ❗Nếu lỗi 401 xảy ra ở login → không logout, không redirect
    if (originalRequest.url.includes("/api/auth/login")) {
        return Promise.reject(error);
    }

    // Nếu chính request /api/auth/refresh bị 401
    // → KHÔNG được retry nữa, logout luôn để tránh vòng lặp vô hạn
    if (originalRequest?.url?.includes("/api/auth/refresh")) {
      console.error("Refresh token không hợp lệ, tiến hành logout.");

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // Chuyển về trang login
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Đã thử refresh rồi thì không thử lại nữa
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Đánh dấu là đang retry
    originalRequest._retry = true;

    try {
      const refreshToken = getRefreshToken();

      // Nếu không còn refreshToken → logout thẳng
      if (!refreshToken) {
        console.warn("Không tìm thấy refreshToken, logout.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // Gọi API refresh để xin accessToken mới
      const res = await api.post("/api/auth/refresh", {
        refreshToken,
      });

      // Lưu accessToken mới
      localStorage.setItem("accessToken", res.data.accessToken);

      // Cập nhật header mặc định
      api.defaults.headers["Authorization"] =
        "Bearer " + res.data.accessToken;

      // Gọi lại request ban đầu với token mới
      return api(originalRequest);
    } catch (refreshErr) {
      console.error("Refresh token lỗi:", refreshErr);

      // Refresh thất bại → xóa token và chuyển về login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";

      return Promise.reject(refreshErr);
    }
  }
);

export default api;
