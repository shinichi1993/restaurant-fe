// src/api/roleApi.js
// --------------------------------------------------------------
// API gọi Backend cho MODULE 13 – Role
// - Lấy danh sách role
// - Lấy chi tiết 1 role (kèm permissionIds)
// - Tạo mới / Cập nhật / Xóa role
// --------------------------------------------------------------
// Lưu ý:
//  - Dùng axios instance chung: api (axiosConfig.js)
//  - Toàn bộ comment dùng tiếng Việt (Rule 13)
// --------------------------------------------------------------

import api from "./axiosConfig";

/**
 * Lấy danh sách tất cả vai trò.
 * Backend: GET /api/roles
 */
export const getRoles = async () => {
  const res = await api.get("/api/roles");
  return res.data; // mong đợi: [{id, name, code, description, ...}]
};

/**
 * Lấy chi tiết 1 vai trò theo id.
 * Backend: GET /api/roles/{id}
 * Dùng khi mở form Sửa để load permissionIds hiện tại.
 */
export const getRoleDetail = async (id) => {
  const res = await api.get(`/api/roles/${id}`);
  return res.data; // mong đợi: {id, name, code, description, permissionIds: []}
};

/**
 * Tạo mới vai trò.
 * Backend: POST /api/roles
 * body: { name, code, description, permissionIds }
 */
export const createRole = async (payload) => {
  const res = await api.post("/api/roles", payload);
  return res.data;
};

/**
 * Cập nhật vai trò.
 * Backend: PUT /api/roles/{id}
 * body: { name, code, description, permissionIds }
 */
export const updateRole = async (id, payload) => {
  const res = await api.put(`/api/roles/${id}`, payload);
  return res.data;
};

/**
 * Xóa vai trò.
 * Backend: DELETE /api/roles/{id}
 */
export const deleteRole = async (id) => {
  await api.delete(`/api/roles/${id}`);
};
