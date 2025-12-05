// categoryApi.js – API gọi backend cho danh mục món ăn (Category)
// ---------------------------------------------------------------
// Dùng axios instance chung (axiosConfig)
// Cung cấp các hàm:
//  - getCategories(): lấy danh sách tất cả category
//  - createCategory(data): tạo category mới
//  - updateCategory(id, data): cập nhật category
//  - deleteCategory(id): xóa mềm category
// ---------------------------------------------------------------

import api from "./axiosConfig";

// Lấy toàn bộ danh mục
export const getCategories = async () => {
  const res = await api.get("/api/categories");
  return res.data;
};

// Tạo danh mục mới
export const createCategory = async (data) => {
  const res = await api.post("/api/categories", data);
  return res.data;
};

// Cập nhật danh mục
export const updateCategory = async (id, data) => {
  const res = await api.put(`/api/categories/${id}`, data);
  return res.data;
};

// Xóa (mềm) danh mục
export const deleteCategory = async (id) => {
  const res = await api.delete(`/api/categories/${id}`);
  return res.data;
};
