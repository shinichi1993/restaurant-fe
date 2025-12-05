// recipeApi.js – Các hàm gọi API cho Module 07: Recipe (Định lượng món)
// ----------------------------------------------------------------------
// Mục đích:
//  - Đóng gói toàn bộ request liên quan đến định lượng món ăn
//  - FE chỉ dùng các hàm này, không gọi axios trực tiếp
//
// Gồm các hàm:
//  - getRecipeByDish(dishId)        : Lấy danh sách định lượng của 1 món
//  - addRecipeItem(payload)         : Thêm mới 1 dòng định lượng
//  - updateRecipeItem(id, payload)  : Cập nhật 1 dòng định lượng
//  - deleteRecipeItem(id)           : Xóa 1 dòng định lượng
//  - resetRecipeByDish(dishId)      : Reset toàn bộ định lượng của 1 món
//
// Áp dụng:
//  - Rule 26: Chuẩn hóa dữ liệu vào/ra (dùng DTO từ BE)
//  - Rule 14: Dùng axiosConfig chung (tự gắn token, refresh token)
// ----------------------------------------------------------------------

import api from "./axiosConfig";

/**
 * Lấy danh sách định lượng nguyên liệu của 1 món ăn.
 * --------------------------------------------------------------
 * BE: GET /api/recipes/dish/{dishId}
 *
 * @param {number} dishId - ID món ăn cần lấy định lượng
 * @returns {Promise<Array>} Danh sách RecipeItemResponse
 */
export const getRecipeByDish = async (dishId) => {
  const res = await api.get(`/api/recipes/dish/${dishId}`);
  return res.data;
};

/**
 * Thêm mới 1 dòng định lượng cho món.
 * --------------------------------------------------------------
 * BE: POST /api/recipes/add
 *
 * payload có dạng:
 *  {
 *    dishId: number,
 *    ingredientId: number,
 *    quantity: number
 *  }
 *
 * @param {Object} payload - Dữ liệu định lượng gửi lên BE
 * @returns {Promise<Object>} RecipeItemResponse vừa tạo
 */
export const addRecipeItem = async (payload) => {
  const res = await api.post("/api/recipes/add", payload);
  return res.data;
};

/**
 * Cập nhật 1 dòng định lượng.
 * --------------------------------------------------------------
 * BE: PUT /api/recipes/update/{id}
 *
 * payload giống như addRecipeItem:
 *  {
 *    dishId: number,
 *    ingredientId: number,
 *    quantity: number
 *  }
 *
 * @param {number} id - ID dòng định lượng cần cập nhật
 * @param {Object} payload - Dữ liệu mới
 * @returns {Promise<Object>} RecipeItemResponse sau khi cập nhật
 */
export const updateRecipeItem = async (id, payload) => {
  const res = await api.put(`/api/recipes/update/${id}`, payload);
  return res.data;
};

/**
 * Xóa 1 dòng định lượng (1 nguyên liệu khỏi món).
 * --------------------------------------------------------------
 * BE: DELETE /api/recipes/delete/{id}
 *
 * @param {number} id - ID dòng định lượng cần xóa
 * @returns {Promise<void>}
 */
export const deleteRecipeItem = async (id) => {
  await api.delete(`/api/recipes/delete/${id}`);
};

/**
 * Reset toàn bộ định lượng của 1 món ăn.
 * --------------------------------------------------------------
 * BE: DELETE /api/recipes/reset/{dishId}
 *
 * @param {number} dishId - ID món ăn cần reset định lượng
 * @returns {Promise<void>}
 */
export const resetRecipeByDish = async (dishId) => {
  await api.delete(`/api/recipes/reset/${dishId}`);
};
