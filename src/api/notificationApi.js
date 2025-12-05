// src/api/notificationApi.js
// --------------------------------------------------------------
// API gọi Backend cho MODULE 14 – Notification
// --------------------------------------------------------------
// Chức năng chính:
//  - Lấy danh sách thông báo của USER đang đăng nhập
//  - Đánh dấu 1 thông báo đã đọc
//  - Đánh dấu tất cả thông báo đã đọc
//  - (Tùy chọn) Tạo thông báo nội bộ – dùng cho admin / hệ thống
// --------------------------------------------------------------
// Quy ước:
//  - KHÔNG truyền userId từ FE (đúng theo thiết kế mới)
//    → Backend tự lấy user hiện tại từ JWT (SecurityContext).
//  - Dùng axios instance chung: api (axiosConfig.js)
//  - Toàn bộ comment dùng tiếng Việt (Rule 13)
// --------------------------------------------------------------

import api from "./axiosConfig";

/**
 * Lấy danh sách thông báo của user hiện tại.
 * ----------------------------------------------------------
 * Backend:
 *  - Method: GET
 *  - URL   : /api/notifications
 *
 * Backend sẽ dựa vào JWT (Authorization: Bearer <token>)
 * để xác định userId, sau đó trả về danh sách NotificationResponse.
 *
 * Response (ví dụ):
 *  [
 *    {
 *      "id": 1,
 *      "title": "Đơn hàng mới",
 *      "message": "Order #123 vừa được tạo",
 *      "type": "ORDER",
 *      "status": "UNREAD",
 *      "createdAt": "2025-12-02T21:30:00",
 *      "readAt": null
 *    },
 *    ...
 *  ]
 */
export const getMyNotifications = async () => {
  const res = await api.get("/api/notifications");
  return res.data;
};

/**
 * Đánh dấu 1 thông báo là ĐÃ ĐỌC cho user hiện tại.
 * ----------------------------------------------------------
 * Backend:
 *  - Method: POST
 *  - URL   : /api/notifications/{id}/read
 *
 * Lưu ý:
 *  - Không cần truyền userId, backend tự lấy từ JWT.
 *  - FE chỉ cần truyền id của thông báo.
 */
export const markNotificationRead = async (notificationId) => {
  await api.post(`/api/notifications/${notificationId}/read`);
};

/**
 * Đánh dấu TẤT CẢ thông báo của user hiện tại là ĐÃ ĐỌC.
 * ----------------------------------------------------------
 * Backend:
 *  - Method: POST
 *  - URL   : /api/notifications/read-all
 *
 * Dùng cho:
 *  - Nút "Đánh dấu tất cả là đã đọc" ở popup chuông thông báo
 *  - Hoặc màn hình danh sách thông báo.
 */
export const markAllNotificationsRead = async () => {
  await api.post("/api/notifications/read-all");
};

/**
 * (TÙY CHỌN) Tạo thông báo nội bộ từ FE.
 * ----------------------------------------------------------
 * Backend:
 *  - Method: POST
 *  - URL   : /api/notifications
 *
 * Body (CreateNotificationRequest dự kiến):
 *  {
 *    "title": "Tiêu đề",
 *    "message": "Nội dung thông báo",
 *    "type": "SYSTEM" | "ORDER" | "STOCK" ...,
 *    "targetUserIds": [1, 2, 3]  // nếu null → gửi cho tất cả?
 *  }
 *
 * Ghi chú:
 *  - Tùy vào thiết kế nghiệp vụ, có thể:
 *      + Chỉ ADMIN được gọi API này
 *      + Hoặc chỉ sử dụng từ backend (service nội bộ)
 *  - Nếu chưa dùng tới, có thể để sẵn để sau dùng.
 */
export const createNotification = async (payload) => {
  const res = await api.post("/api/notifications", payload);
  return res.data;
};

/*
API lấy unread notifications
*/
export const getUnreadNotifications = async () => {
  const res = await api.get("/api/notifications/unread");
  return res.data;
};
