// dashboardApi.js
// ====================================================================
// API cho màn hình Dashboard (Module 11)
// --------------------------------------------------------------------
// Chức năng chính:
//  - Gọi BE để lấy số liệu tổng quan cho Dashboard:
//    + Tổng quan summary: doanh thu hôm nay, số order hôm nay...
//    + Doanh thu hôm nay (revenueToday)
//    + Số order hôm nay (ordersToday)
//    + Doanh thu 7 ngày gần nhất (dùng cho line chart)
//    + Top món bán chạy (dùng cho bảng / chart Top Dish)
// --------------------------------------------------------------------
// Lưu ý:
//  - Toàn bộ request đều dùng axios instance chung (axiosConfig)
//    → Tự gắn Authorization: Bearer <token>
//    → Tự xử lý refresh token nếu 401 (theo Module 01)
//  - Hàm FE chỉ trả về res.data, phần try/catch xử lý ở Component.
// ====================================================================

import api from "./axiosConfig";

// ====================================================================
// 1. LẤY TỔNG QUAN DASHBOARD (SUMMARY)
// ====================================================================

/**
 * Lấy số liệu tổng quan cho Dashboard.
 * ----------------------------------------------------------
 * Gọi API: GET /api/dashboard/summary
 *
 * Dữ liệu trả về (DashboardSummaryResponse):
 *  - revenueToday   : doanh thu hôm nay
 *  - ordersToday    : số order hôm nay
 *  - totalOrders    : tổng số order trong hệ thống
 *  - avgRevenue7Days: doanh thu trung bình 7 ngày gần nhất
 */
export const getDashboardSummary = async () => {
  const res = await api.get("/api/dashboard/summary");
  return res.data;
};

// ====================================================================
// 2. LẤY DOANH THU HÔM NAY
// ====================================================================

/**
 * Lấy doanh thu trong NGÀY HÔM NAY.
 * ----------------------------------------------------------
 * Gọi API: GET /api/dashboard/revenue-today
 *
 * Dữ liệu trả về: number (BigDecimal) – tổng doanh thu hôm nay.
 */
export const getRevenueToday = async () => {
  const res = await api.get("/api/dashboard/revenue-today");
  return res.data;
};

// ====================================================================
// 3. LẤY SỐ ORDER HÔM NAY
// ====================================================================

/**
 * Lấy số lượng ORDER được tạo trong NGÀY HÔM NAY.
 * ----------------------------------------------------------
 * Gọi API: GET /api/dashboard/orders-today
 *
 * Dữ liệu trả về: number – tổng số order hôm nay.
 */
export const getOrdersToday = async () => {
  const res = await api.get("/api/dashboard/orders-today");
  return res.data;
};

// ====================================================================
// 4. LẤY DOANH THU 7 NGÀY GẦN NHẤT
// ====================================================================

/**
 * Lấy danh sách doanh thu 7 ngày gần nhất.
 * ----------------------------------------------------------
 * Gọi API: GET /api/dashboard/revenue-last-7-days
 *
 * Dữ liệu trả về: mảng RevenueByDateResponse[]
 *  - Mỗi phần tử có:
 *    + date         : ngày (yyyy-MM-dd)
 *    + totalRevenue : tổng doanh thu của ngày đó
 *
 * Dùng trực tiếp cho line chart ở DashboardPage.
 */
export const getRevenueLast7Days = async () => {
  const res = await api.get("/api/dashboard/revenue-last-7-days");
  return res.data;
};

// ====================================================================
// 5. LẤY DANH SÁCH MÓN BÁN CHẠY (TOP DISHES)
// ====================================================================

/**
 * Lấy danh sách MÓN BÁN CHẠY.
 * ----------------------------------------------------------
 * Gọi API: GET /api/dashboard/top-dishes?limit={limit}
 *
 * Tham số:
 *  - limit: số lượng món muốn lấy (mặc định = 5)
 *
 * Dữ liệu trả về: mảng TopDishResponse[]
 *  - dishId        : ID món
 *  - dishName      : tên món
 *  - totalQuantity : tổng số lượng bán
 *  - totalRevenue  : tổng doanh thu từ món đó
 */
export const getTopDishes = async (limit = 5) => {
  const res = await api.get("/api/dashboard/top-dishes", {
    params: { limit },
  });
  return res.data;
};
