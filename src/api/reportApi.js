// reportApi.js – API gọi BE Report
// --------------------------------------------------------------
// Các API:
//  - getRevenueReport(fromDate?, toDate?)
//  - getTopDishes(fromDate?, toDate?, limit?)
//  - getIngredientUsage(fromDate?, toDate?)
//  - getStockEntryReport(fromDate?, toDate?)
// --------------------------------------------------------------
// Tất cả comment tiếng Việt theo Rule 13
// --------------------------------------------------------------

import api from "./axiosConfig";

// Lấy báo cáo doanh thu
export const getRevenueReport = async (fromDate, toDate) => {
  const params = {};
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const res = await api.get("/api/reports/revenue", { params });
  return res.data;
};

// Top món bán chạy
export const getTopDishes = async (fromDate, toDate, limit = 10) => {
  const params = { limit };
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const res = await api.get("/api/reports/top-dishes", { params });
  return res.data;
};

// Báo cáo nguyên liệu tiêu hao
export const getIngredientUsage = async (fromDate, toDate) => {
  const params = {};
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const res = await api.get("/api/reports/ingredient-usage", { params });
  return res.data;
};

// Báo cáo nhập kho
export const getStockEntryReport = async (fromDate, toDate) => {
  const params = {};
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const res = await api.get("/api/reports/stock-entry", { params });
  return res.data;
};


// ======================= EXPORT REVENUE =======================

// Xuất Excel báo cáo doanh thu
export const exportRevenueExcel = (from, to) => {
  return api.get("/api/reports/revenue/export-excel", {
    params: { from, to },
    responseType: "blob", // rất quan trọng để nhận file
  });
};

// Xuất PDF báo cáo doanh thu
export const exportRevenuePdf = (from, to) => {
  return api.get("/api/reports/revenue/export-pdf", {
    params: { from, to },
    responseType: "blob",
  });
};

// ======================= EXPORT TOP DISH ======================

export const exportTopDishesExcel = (from, to, limit = 10) => {
  return api.get("/api/reports/top-dishes/export-excel", {
    params: { from, to, limit },
    responseType: "blob",
  });
};

export const exportTopDishesPdf = (from, to, limit = 10) => {
  return api.get("/api/reports/top-dishes/export-pdf", {
    params: { from, to, limit },
    responseType: "blob",
  });
};

// =================== EXPORT INGREDIENT USAGE ==================

export const exportIngredientUsageExcel = (from, to) => {
  return api.get("/api/reports/ingredients/export-excel", {
    params: { from, to },
    responseType: "blob",
  });
};

export const exportIngredientUsagePdf = (from, to) => {
  return api.get("/api/reports/ingredients/export-pdf", {
    params: { from, to },
    responseType: "blob",
  });
};

// =============== EXPORT NHẬP KHO NGUYÊN LIỆU ===============

export const exportStockEntryExcel = (from, to) => {
  return api.get("/api/reports/stock-entry/export-excel", {
    params: { from, to },
    responseType: "blob",
  });
};

export const exportStockEntryPdf = (from, to) => {
  return api.get("/api/reports/stock-entry/export-pdf", {
    params: { from, to },
    responseType: "blob",
  });
};