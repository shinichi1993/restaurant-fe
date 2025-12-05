// src/api/settingApi.js
// ---------------------------------------------------------
// API cho Module 20 - System Settings (Advanced Settings)
//  - Gọi BE /api/settings để lấy & cập nhật cấu hình hệ thống
//  - Dùng chung axios instance của toàn project (apiClient)
// ---------------------------------------------------------

// ✅ TODO: Sửa lại đường dẫn & tên instance cho đúng với project hiện tại của bạn
// Ví dụ: import apiClient from "../config/axiosClient";
import apiClient from "./axiosConfig"; // <-- sửa lại nếu tên khác

/**
 * Lấy toàn bộ danh sách cấu hình hệ thống.
 * BE: GET /api/settings
 */
export const fetchAllSettings = () => {
  return apiClient.get("/api/settings");
};

/**
 * Lấy cấu hình theo group (RESTAURANT, POS, LOYALTY...)
 * BE: GET /api/settings/{group}
 */
export const fetchSettingsByGroup = (group) => {
  return apiClient.get(`/api/settings/${group}`);
};

/**
 * Cập nhật nhiều cấu hình cùng lúc.
 * BE: PUT /api/settings
 * Body: [{ settingKey, settingValue }, ...]
 */
export const updateSettings = (payload) => {
  return apiClient.put("/api/settings", payload);
};
