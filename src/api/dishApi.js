// dishApi.js – API gọi backend cho món ăn (Dish)
// ---------------------------------------------------------------
// Cung cấp các hàm:
//  - getDishes(): lấy toàn bộ món ăn
//  - getDishesByCategory(categoryId): lọc món theo category
//  - createDish(data): tạo món mới
//  - updateDish(id, data): cập nhật món
//  - deleteDish(id): xóa mềm món
// ---------------------------------------------------------------

import api from "./axiosConfig";

// Lấy toàn bộ món ăn
export const getDishes = async () => {
  const res = await api.get("/api/dishes");
  return res.data;
};

// Lấy món theo category
export const getDishesByCategory = async (categoryId) => {
  const res = await api.get(`/api/dishes/by-category/${categoryId}`);
  return res.data;
};

// Tạo món mới
export const createDish = async (data) => {
  const res = await api.post("/api/dishes", data);
  return res.data;
};

// Cập nhật món
export const updateDish = async (id, data) => {
  const res = await api.put(`/api/dishes/${id}`, data);
  return res.data;
};

// Xóa (mềm) món
export const deleteDish = async (id) => {
  const res = await api.delete(`/api/dishes/${id}`);
  return res.data;
};
