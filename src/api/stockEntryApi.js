// stockEntryApi.js – API nhập kho & điều chỉnh kho
// --------------------------------------------------------
// Rule 26: chuẩn format dữ liệu
// Rule 30: filter phải có reset
// Tự động gắn token (axiosConfig đã làm)

import api from "./axiosConfig";

// Lấy toàn bộ lịch sử nhập kho
export const getStockEntries = async () => {
  const res = await api.get("/api/stock-entries");
  return res.data;
};

// Lọc theo khoảng ngày
export const filterStockEntries = async (fromDate, toDate) => {
  const params = {};
  if (fromDate) params.from = fromDate;
  if (toDate) params.to = toDate;

  const res = await api.get("/api/stock-entries/filter", { params });
  return res.data;
};

// Nhập kho bình thường (quantity > 0)
export const createStockEntry = async (data) => {
  const res = await api.post("/api/stock-entries", data);
  return res.data;
};

// Điều chỉnh kho (quantity có thể âm)
export const adjustStock = async (data) => {
  const res = await api.post("/api/stock-entries/adjust", data);
  return res.data;
};
