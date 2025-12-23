// src/context/NotificationContext.jsx
// ======================================================================
// NotificationContext – Quản lý thông báo realtime cho toàn hệ thống
// ======================================================================
// Chức năng chính:
//   ✔ Polling 5 giây để gọi API lấy danh sách thông báo CHƯA ĐỌC
//   ✔ Hiển thị toast (Ant Design) khi có thông báo mới
//   ✔ Tránh hiển thị trùng nhiều lần (ghi nhớ ID đã show)
//   ✔ KHÔNG gọi API nếu chưa login (không có accessToken)
//   ✔ KHÔNG gọi API và KHÔNG show toast khi đang ở chế độ POS (/pos/...)
// ======================================================================

import { createContext, useContext, useEffect, useState } from "react";
import { notification as antdNotification } from "antd";
import { createNotificationSocket } from "../utils/notificationSocket";

// Tạo context, default = null
const NotificationContext = createContext(null);

// Hook tiện dùng trong component
export const useNotificationContext = () => useContext(NotificationContext);

/**
 * Hàm helper kiểm tra hiện tại có đang ở chế độ POS hay không.
 * --------------------------------------------------------------
 *  - Dùng window.location.pathname để tránh phụ thuộc vào Router
 *  - Trả về true nếu path bắt đầu bằng "/pos"
 */
const isPOSPage = () => {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/pos");
};

export function NotificationProvider({ children }) {
  // Danh sách thông báo chưa đọc
  const [unread, setUnread] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Tạo socket realtime cho notification
    const client = createNotificationSocket((payload) => {
      // 1. Update danh sách unread (push đầu list)
      setUnread((prev) => {
        const exists = prev.some((n) => n.id === payload.id);
        if (exists) return prev;
        return [payload, ...prev];
      });

      // 2. Show toast DUY NHẤT cho notification mới
      antdNotification.open({
        message: payload.title,
        description: payload.message,
        placement: "bottomRight",
        duration: 4,
      });
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

  // ============================================================
  // PROVIDER
  // ============================================================
  return (
    <NotificationContext.Provider
      value={{
        unread,    // danh sách thông báo chưa đọc
        setUnread, // cho phép NotificationBell cập nhật khi mark read
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Xuất default để import dễ trong main.jsx
export default NotificationProvider;
