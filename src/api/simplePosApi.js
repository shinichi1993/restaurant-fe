// src/api/simplePosApi.js
// ============================================================================
// simplePosApi.js
// ----------------------------------------------------------------------------
// API dành riêng cho chế độ Simple POS Mode.
// Hiện tại chỉ cần 1 API:
//   - POST /api/orders/simple-create  → tạo order đơn giản (gọi món + thanh toán)
// ----------------------------------------------------------------------------
// LƯU Ý:
//  - Bạn cần import đúng instance axios đang dùng cho các API khác.
//    VD: nếu các file api khác đang dùng:
//       import api from "./apiClient";
//    thì sửa lại import bên dưới cho giống y hệt.
// ============================================================================

import apiClient from "./axiosConfig"; 
// TODO: 🔧 Nếu project bạn dùng tên khác (vd: "./axios" hoặc "./request")
//       → hãy sửa lại dòng import này cho ĐÚNG với các file api hiện tại.


// ----------------------------------------------------------------------------
// Tạo order đơn giản (Simple POS)
// ----------------------------------------------------------------------------
// payload dạng:
// {
//   tableId: 1 | null,
//   items: [
//     { dishId: 1, quantity: 2, note: "ít cay" },
//     ...
//   ]
// }
// BE sẽ trả về OrderResponse (id, orderCode, totalPrice, items...)
// ----------------------------------------------------------------------------
export const simpleCreateOrder = (payload) => {
  return apiClient.post("/api/orders/simple-create", payload);
};
