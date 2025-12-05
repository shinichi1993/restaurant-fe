// src/api/voucherApi.js
// API dùng cho Module 17 – Quản lý Voucher (Mã giảm giá)

import axiosClient from "./axiosConfig";

/**
 * Lấy danh sách toàn bộ voucher
 * ----------------------------------------------------
 * FE dùng để hiển thị bảng danh sách trong VoucherPage.
 */
export const getVouchers = () => {
  return axiosClient.get("/api/vouchers");
};

/**
 * Tạo voucher mới
 * ----------------------------------------------------
 * request = {
 *   code, description, discountType, discountValue,
 *   minOrderAmount, maxDiscountAmount, usageLimit,
 *   startDate, endDate, status
 * }
 */
export const createVoucher = (request) => {
  return axiosClient.post("/api/vouchers", request);
};

/**
 * Cập nhật voucher
 * ----------------------------------------------------
 * Không được thay đổi code (backend sẽ validate).
 */
export const updateVoucher = (id, request) => {
  return axiosClient.put(`/api/vouchers/${id}`, request);
};

/**
 * Vô hiệu hóa voucher
 * ----------------------------------------------------
 * Chỉ đổi trạng thái sang INACTIVE, không xóa vật lý.
 */
export const deactivateVoucher = (id) => {
  return axiosClient.put(`/api/vouchers/${id}/deactivate`);
};

/**
 * Áp dụng voucher lên 1 order cụ thể
 * ----------------------------------------------------
 * request = { orderId, voucherCode }
 * Backend sẽ trả:
 *  - originalAmount
 *  - discountAmount
 *  - finalAmount
 */
export const applyVoucher = (request) => {
  return axiosClient.post("/api/vouchers/apply", request);
};
