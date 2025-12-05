// src/api/ingredientApi.js
// --------------------------------------------------------------
// Gọi API backend cho module Nguyên liệu (Ingredient)
// Chuẩn hóa theo Rule 19:
//  - Luôn return res.data
//  - Không trả về res thô
// --------------------------------------------------------------

import api from "./axiosConfig";

// Lấy toàn bộ nguyên liệu
export const getIngredients = async () => {
  const res = await api.get("/api/ingredients");
  return res.data;
};

// Tạo mới nguyên liệu
export const createIngredient = async (payload) => {
  const res = await api.post("/api/ingredients", payload);
  return res.data;
};

// Cập nhật nguyên liệu
export const updateIngredient = async (id, payload) => {
  const res = await api.put(`/api/ingredients/${id}`, payload);
  return res.data;
};

// Xóa nguyên liệu (xóa mềm)
export const deleteIngredient = async (id) => {
  await api.delete(`/api/ingredients/${id}`);
};
