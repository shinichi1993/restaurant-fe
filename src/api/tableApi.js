// tableApi.js – API quản lý Bàn (Module 16)
// ---------------------------------------------------------------------
// Chứa toàn bộ API thao tác với Bàn (restaurant_table):
//   - Lấy danh sách bàn
//   - Tạo bàn mới
//   - Cập nhật thông tin bàn
//   - Xóa bàn
//   - Gộp bàn (merge)
//   - Tách bàn (split)
//   - Chuyển order từ bàn này sang bàn khác (change)
//   - (Tuỳ chọn) Cập nhật trạng thái bàn thủ công
//
// Quy ước:
//  - Sử dụng instance api từ axiosConfig (đã cấu hình sẵn baseURL, token...)
//  - Tất cả hàm đều trả về res.data để FE xử lý cho gọn
//  - Comment hoàn toàn bằng tiếng Việt (Rule 13)
// ---------------------------------------------------------------------

import api from "./axiosConfig";

// =====================================================================
// 0. LẤY THÔNG TIN 1 BÀN THEO ID
// GET /api/tables/{id}
// ---------------------------------------------------------------------
// Trả về:
//   {
//     id: number,
//     name: string,
//     capacity: number,
//     status: "AVAILABLE" | "OCCUPIED" | ...
//   }
// =====================================================================
export const getTableDetail = async (id) => {
  const res = await api.get(`/api/tables/${id}`);
  return res.data;
};

// =====================================================================
// 1. LẤY DANH SÁCH BÀN
// GET /api/tables
// ---------------------------------------------------------------------
// Dùng cho:
//  - TablePage.jsx: hiển thị grid toàn bộ bàn
//  - OrderCreatePage.jsx: hiển thị dropdown chọn bàn (tableId)
// =====================================================================
export const fetchTables = async () => {
  const res = await api.get("/api/tables");
  return res.data;
};

// =====================================================================
// 2. TẠO BÀN MỚI
// POST /api/tables
// ---------------------------------------------------------------------
// body data:
// {
//   name: string,      // Tên bàn (VD: B1, B2, VIP-1...)
//   capacity: number   // Số khách tối đa
// }
// =====================================================================
export const createTable = async (data) => {
  const res = await api.post("/api/tables", data);
  return res.data;
};

// =====================================================================
// 3. CẬP NHẬT THÔNG TIN BÀN
// PUT /api/tables/{id}
// ---------------------------------------------------------------------
// Dùng khi sửa tên bàn, số ghế trong TableFormModal.
// body data tương tự createTable.
// =====================================================================
export const updateTable = async (id, data) => {
  const res = await api.put(`/api/tables/${id}`, data);
  return res.data;
};

// =====================================================================
// 4. XÓA BÀN
// DELETE /api/tables/{id}
// ---------------------------------------------------------------------
// Backend chỉ cho xóa khi bàn KHÔNG có order đang mở.
// FE nên bắt lỗi và hiển thị message nếu BE trả về lỗi.
// =====================================================================
export const deleteTable = async (id) => {
  const res = await api.delete(`/api/tables/${id}`);
  return res.data;
};

// =====================================================================
// 5. GỘP BÀN (MERGE TABLE)
// POST /api/tables/merge
// ---------------------------------------------------------------------
// body data:
// {
//   sourceTableId: number,  // Bàn bị gộp (sẽ chuyển sang MERGED)
//   targetTableId: number   // Bàn gốc giữ order (OCCUPIED)
// }
// Dùng trong TableActionModal khi chọn "Gộp bàn".
// =====================================================================
export const mergeTable = async (data) => {
  const res = await api.post("/api/tables/merge", data);
  return res.data;
};

// =====================================================================
// 6. TÁCH BÀN (SPLIT TABLE)
// POST /api/tables/split/{id}
// ---------------------------------------------------------------------
// id: ID của bàn đang ở trạng thái MERGED.
// Sau khi tách: bàn sẽ về trạng thái AVAILABLE.
// =====================================================================
export const splitTable = async (id) => {
  const res = await api.post(`/api/tables/split/${id}`);
  return res.data;
};

// =====================================================================
// 7. CHUYỂN ORDER SANG BÀN KHÁC (CHANGE TABLE)
// POST /api/tables/change
// ---------------------------------------------------------------------
// body data:
// {
//   oldTableId: number,   // Bàn hiện tại đang có order mở
//   newTableId: number    // Bàn mới muốn chuyển order sang
// }
// Nghiệp vụ:
//  - Order đang mở ở oldTable sẽ gán sang newTable
//  - oldTable → AVAILABLE
//  - newTable → OCCUPIED
// =====================================================================
export const changeTable = async (data) => {
  const res = await api.post("/api/tables/change", data);
  return res.data;
};

// =====================================================================
// 8. (TÙY CHỌN) CẬP NHẬT TRẠNG THÁI BÀN THỦ CÔNG
// POST /api/tables/status
// ---------------------------------------------------------------------
// body data:
// {
//   tableId: number,
//   newStatus: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MERGED"
// }
// Thông thường trạng thái bàn sẽ do OrderService tự set,
// nhưng API này hữu ích nếu sau này cần màn hình admin chỉnh tay.
// =====================================================================
export const updateTableStatus = async (data) => {
  const res = await api.post("/api/tables/status", data);
  return res.data;
};

/**
 * API riêng cho POS TABLE PAGE.
 * ------------------------------------------------------------
 * Gọi BE: GET /api/tables/pos-status
 * Trả về: List<PosTableStatusResponse>
 */
export function fetchPosTableStatuses() {
  return api.get("/api/tables/pos-status");
}