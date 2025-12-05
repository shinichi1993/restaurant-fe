// src/api/permissionApi.js
// --------------------------------------------------------------
// API cho MODULE 13 – Permission (màn hình chỉ đọc)
// - Lấy danh sách toàn bộ quyền trong hệ thống
// --------------------------------------------------------------
// Backend (gợi ý):
//  - GET /api/permissions
//    trả về: [{id, code, name, description}, ...]
// --------------------------------------------------------------

import api from "./axiosConfig";

/**
 * Lấy danh sách toàn bộ permission.
 * Dùng cho:
 *  - Form Role (checkbox chọn permissionIds)
 *  - Màn hình Permission read-only
 */
export const getPermissions = async () => {
  const res = await api.get("/api/permissions");
  return res.data;
};
