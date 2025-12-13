// src/api/memberApi.js
// -------------------------------------------------------------
// API dành cho Membership (Phase 3)
// -------------------------------------------------------------
// FE dùng cho PaymentModal:
//   - searchMemberByPhone(phone): tìm hội viên bằng SĐT
//   - getMemberById(id): load hội viên khi order đã có memberId
// -------------------------------------------------------------

import api from "./axiosConfig";

/**
 * Tìm hội viên theo số điện thoại.
 * BE: GET /api/members/by-phone?phone=...
 */
export const searchMemberByPhone = async (phone) => {
  const res = await api.get("/api/members/by-phone", {
    params: { phone },
  });
  return res.data; // MemberResponse
};

/**
 * Lấy hội viên theo ID.
 * BE: GET /api/members/{id}
 * Dùng khi:
 *  - order đã có memberId (FE mở PaymentModal → load hội viên)
 */
export const getMemberById = async (memberId) => {
  const res = await api.get(`/api/members/${memberId}`);
  return res.data; // MemberResponse
};
/**
 * Tạo hoặc cập nhật hội viên.
 * BE: POST /api/members
 * Nếu req.id != null → BE sẽ hiểu là update
 */
export const saveMember = async (data) => {
  const res = await api.post("/api/members", data);
  return res.data; // MemberResponse
};
/**
 * Lấy full thông tin hội viên.
 * BE: GET /api/members
 * Dùng khi:
 *  - FE mở PaymentModal → load hội viên
 */
export const getAllMembers = async () => {
  const res = await api.get("/api/members");
  return res.data;
};

/**
 * Tìm hội viên theo keyword (LIKE)
 * BE: GET /api/members/search?keyword=...
 * Trả về LIST<MemberResponse>
 */
export const searchMembers = async (keyword) => {
  const res = await api.get("/api/members/search", {
    params: { keyword },
  });
  return res.data;
};

/**
 * Vô hiệu hóa hội viên (soft delete).
 * BE: PATCH /api/members/{id}/disable
 */
export const disableMember = async (id) => {
  const res = await api.patch(`/api/members/${id}/disable`);
  return res.data;
};

/**
 * Khôi phục hội viên đã bị vô hiệu hóa.
 * BE: PATCH /api/members/{id}/restore
 */
export const restoreMember = async (id) => {
  const res = await api.patch(`/api/members/${id}/restore`);
  return res.data;
};

/**
 * Tìm hội viên ACTIVE theo SĐT (DÙNG CHO POS / PAYMENT)
 * BE: GET /api/members/active/by-phone?phone=...
 * Trả về: MemberResponse
 */
export const getActiveMemberByPhone = async (phone) => {
  const res = await api.get("/api/members/active/by-phone", {
    params: { phone },
  });
  return res.data;
};

