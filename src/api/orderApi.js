// orderApi.js – API gọi món (Order)
// ---------------------------------------------------------------
// Chứa toàn bộ API của Module 08:
//  - Tạo order
//  - Lấy danh sách order
//  - Lấy chi tiết order
//  - Cập nhật trạng thái
//  - Tiêu kho / khôi phục kho
//  - Xoá order
// ---------------------------------------------------------------

import api from "./axiosConfig";

// ===========================
// Tạo order mới
// ===========================
export const createOrder = async (data) => {
  const res = await api.post("/api/orders", data);
  return res.data;
};

// ===========================
// Lấy danh sách order
// ===========================
export const getOrders = async () => {
  const res = await api.get("/api/orders");
  return res.data;
};

// ===========================
// Lấy chi tiết order theo ID
// ===========================
export const getOrderDetail = async (id) => {
  const res = await api.get(`/api/orders/${id}`);
  return res.data;
};

// ===========================
// Cập nhật trạng thái order
// ===========================
export const updateOrderStatus = async (id, status) => {
  const res = await api.put(`/api/orders/${id}/status`, null, {
    params: { status },
  });
  return res.data;
};

// ===========================
// Tiêu kho cho order
// ===========================
export const consumeStock = async (id) => {
  const res = await api.post(`/api/orders/${id}/consume-stock`);
  return res.data;
};

// ===========================
// Khôi phục kho cho order
// ===========================
export const restoreStock = async (id) => {
  const res = await api.post(`/api/orders/${id}/restore-stock`);
  return res.data;
};

// ===========================
// Xoá order
// ===========================
export const deleteOrder = async (id) => {
  const res = await api.delete(`/api/orders/${id}`);
  return res.data;
};

/**
 * Lấy order đang mở theo tableId cho POS.
 * ---------------------------------------------------------
 * BE: GET /api/orders/by-table/{tableId}
 * 
 * Kết quả:
 *  - Nếu có order đang mở → trả về OrderResponse
 *  - Nếu không có order → data = null
 */
export const getOrderByTableId = (tableId) =>
  api.get(`/api/orders/by-table/${tableId}`);

// PUT update lại danh sách món
export const updateOrderItems = (orderId, payload) => {
  return api.put(`/api/orders/${orderId}`, payload);
};
