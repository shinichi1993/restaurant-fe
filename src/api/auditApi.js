// src/api/auditApi.js
// ====================================================================
// auditApi.js – Gọi API cho Module 15: Audit Log
// --------------------------------------------------------------------
// Chức năng chính:
//   - searchAuditLogs(params):
//        Gọi BE GET /api/audit-logs với filter + phân trang
//   - getAuditActions():
//        Gọi BE GET /api/audit-actions để lấy danh sách enum AuditAction
//
// Quy ước:
//   - Dùng axios instance chung: api (axiosConfig.js)
//   - Toàn bộ comment dùng tiếng Việt (Rule 13)
//   - Tuân thủ Rule 26: data chuẩn, rõ ràng
// ====================================================================

import api from "./axiosConfig";

/**
 * Gọi API tìm kiếm Audit Log với filter + phân trang.
 *
 * BE:
 *   - Method: GET
 *   - URL   : /api/audit-logs
 *   - Query param ví dụ:
 *       ?page=0&size=20&entity=user&userId=1&action=USER_UPDATE
 *
 * @param {Object} params
 *   - page   : số trang (0-based)
 *   - size   : số bản ghi mỗi trang
 *   - entity : (optional) tên entity (vd: "user", "order"...)
 *   - userId : (optional) id user thực hiện
 *   - action : (optional) enum AuditAction (USER_CREATE, ORDER_CREATE...)
 *
 * @returns Page<AuditLogResponse> dạng JSON từ BE:
 *   {
 *     content: [...],
 *     totalElements: 123,
 *     totalPages: 7,
 *     ...
 *   }
 */
export const searchAuditLogs = async (params) => {
  const res = await api.get("/api/audit-logs", { params });
  return res.data;
};

/**
 * Lấy danh sách các AuditAction từ BE.
 *
 * BE:
 *   - Method: GET
 *   - URL   : /api/audit-actions
 *
 * Response:
 *   [
 *     "USER_CREATE",
 *     "USER_UPDATE",
 *     "ORDER_CREATE",
 *     ...
 *   ]
 *
 * Dùng để đổ vào dropdown filter Action ở FE,
 * tránh hard-code enum ở phía FE.
 */
export const getAuditActions = async () => {
  const res = await api.get("/api/audit-actions");
  return res.data;
};