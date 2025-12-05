// src/main.jsx
// --------------------------------------------------------------
// Điểm vào chính của FE (React + Vite)
//  - Render toàn bộ ứng dụng vào #root
//  - Bọc AppRoutes bằng NotificationProvider (Module 14)
//  - NotificationProvider tự kiểm tra token, chưa login thì
//    KHÔNG gọi API, nên không lo spam /auth/refresh
// --------------------------------------------------------------

import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./router/AppRoutes";
import "./index.css";

import NotificationProvider from "./context/NotificationContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Provider dùng chung cho toàn hệ thống */}
    <NotificationProvider>
      <AppRoutes />
    </NotificationProvider>
  </React.StrictMode>
);
