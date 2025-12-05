import api from "./axiosConfig";

// -------------------------------------------------------------
// Lấy toàn bộ danh sách người dùng
// GET /api/users
// -------------------------------------------------------------
export const getUsers = async () => {
  const res = await api.get("/api/users");
  return res.data;
};
// -------------------------------------------------------------
// Lấy thông tin chi tiết 1 user theo ID
// GET /api/users/{id}
// -------------------------------------------------------------
export const getUser = async (id) => {
  const res = await api.get(`/api/users/${id}`);
  return res.data;
};

// Lấy thông tin user hiện tại
export const getMyInfo = async () => {
  const res = await api.get("/api/users/me");
  return res.data;
};

// -------------------------------------------------------------
// Tạo người dùng mới
// POST /api/users
// -------------------------------------------------------------
export const createUser = async (data) => {
  const res = await api.post("/api/users", data);
  return res.data;
};

// -------------------------------------------------------------
// Cập nhật người dùng
// PUT /api/users/{id}
// -------------------------------------------------------------
export const updateUser = async (id, data) => {
  const res = await api.put(`/api/users/${id}`, data);
  return res.data;
};

// -------------------------------------------------------------
// Xóa người dùng (xóa mềm – đổi trạng thái INACTIVE)
// DELETE /api/users/{id}
// -------------------------------------------------------------
export const deleteUser = async (id) => {
  const res = await api.delete(`/api/users/${id}`);
  return res.data;
};

// Đổi mật khẩu
export const changePassword = async (data) => {
  const res = await api.put("/api/users/change-password", data);
  return res.data;
};
