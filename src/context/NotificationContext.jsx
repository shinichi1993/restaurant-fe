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
import { notification } from "antd";
import { getUnreadNotifications } from "../api/notificationApi";

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

  // ID của các thông báo đã show toast (để tránh show lại)
  const [shownIds, setShownIds] = useState([]);

  // ============================================================
  // HÀM GỌI API LẤY UNREAD
  //  - Không chạy nếu:
  //      + Chưa đăng nhập (không có token)
  //      + Đang ở chế độ POS (/pos/...)
  // ============================================================
  const loadUnread = async () => {
    // Nếu đang ở POS → không gọi API, không show toast
    if (isPOSPage()) {
      return;
    }

    // Nếu chưa login → không gọi API, clear state rồi thoát
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUnread([]);
      return;
    }

    try {
      const data = await getUnreadNotifications();
      setUnread(data || []);

      // Lọc những thông báo mới chưa được hiển thị toast
      const newNoti = (data || []).filter((n) => !shownIds.includes(n.id));

      newNoti.forEach((n) => {
        notification.open({
          message: n.title,
          description: n.message,
          placement: "bottomRight",
          duration: 4,
        });

        setShownIds((prev) => [...prev, n.id]);
      });
    } catch (e) {
      console.error("Lỗi load unread notifications:", e);
    }
  };

  // ============================================================
  // POLLING – mỗi 5 giây
  //  - Lúc mount: gọi loadUnread()
  //  - Sau đó cứ 5 giây lại check:
  //      + Không gọi gì nếu đang ở POS
  //      + Có token thì gọi API, không có token thì clear unread
  // ============================================================
  useEffect(() => {
    // Gọi lần đầu nếu không ở POS
    if (!isPOSPage()) {
      loadUnread();
    }

    const timer = setInterval(() => {
      if (!isPOSPage()) {
        loadUnread();
      }
    }, 5000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ set timer 1 lần khi app mount

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
