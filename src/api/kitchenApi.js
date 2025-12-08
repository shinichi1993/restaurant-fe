// src/api/kitchenApi.js
// ============================================================================
// kitchenApi.js
// ----------------------------------------------------------------------------
// API gọi lên BE cho màn hình BẾP (Kitchen).
//
// Chức năng chính:
//  - Lấy danh sách món cần chế biến: GET /api/kitchen/items
//  - Cập nhật trạng thái 1 món:     PUT /api/kitchen/items/{id}/status
//
// Lưu ý:
//  - Toàn bộ comment tiếng Việt theo Rule 13.
//  - Dùng axios instance chung của dự án (thay thế import cho đúng).
// ============================================================================

import axiosInstance from "./axiosConfig"; 
// ⚠️ Nếu dự án bạn đang dùng tên khác (vd: apiClient) thì sửa lại cho khớp

/**
 * Lấy danh sách món hiển thị trên màn hình bếp.
 * ----------------------------------------------------------------------------
 * @param {string|null} status  - Trạng thái filter:
 *    - null       → lấy mặc định {NEW, SENT_TO_KITCHEN, COOKING}
 *    - "NEW"
 *    - "SENT_TO_KITCHEN"
 *    - "COOKING"
 *    - "DONE"
 *
 * BE: KitchenController.getKitchenItems(OrderItemStatus statusParam)
 */
export const getKitchenItems = (status) => {
  const params = {};

  if (status) {
    // Nếu có chọn trạng thái → gửi lên query param
    params.status = status;
  }

  return axiosInstance.get("/api/kitchen/items", { params });
};

/**
 * Cập nhật trạng thái 1 món trong bếp.
 * ----------------------------------------------------------------------------
 * @param {number} orderItemId  - ID bản ghi OrderItem
 * @param {string} newStatus    - Trạng thái mới (enum OrderItemStatus):
 *    "NEW", "SENT_TO_KITCHEN", "COOKING", "DONE", "CANCELED"
 * @param {string} note         - Ghi chú (có thể null/undefined)
 *
 * BE: KitchenController.updateItemStatus(Long id, UpdateKitchenItemStatusRequest req)
 *      → req gồm: { newStatus, note }
 */
export const updateKitchenItemStatus = (orderItemId, newStatus, note) => {
  return axiosInstance.put(`/api/kitchen/items/${orderItemId}/status`, {
    newStatus,
    note: note || null,
  });
};
// Lấy danh sách ORDER cho màn hình bếp (đã group theo order)
export function getKitchenOrders() {
  return axiosInstance.get("/api/kitchen/orders");
}