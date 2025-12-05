// src/api/paymentApi.js
// ====================================================================
// API cho module Thanh toán (Payment)
// Sử dụng axios instance có token (axiosConfig)
// Tất cả comment viết tiếng Việt theo Rule 13
// ====================================================================

import api from "./axiosConfig";

// --------------------------------------------------------------------
// Lấy danh sách payment theo khoảng ngày
// from, to: format yyyy-MM-dd
// Nếu null → BE tự hiểu là không filter
// --------------------------------------------------------------------
export const getPayments = async (fromDate, toDate) => {
  const params = {};
  if (fromDate) params.from = fromDate;
  if (toDate) params.to = toDate;

  const res = await api.get("/api/payments", { params });
  return res.data;
};

// --------------------------------------------------------------------
// Lấy chi tiết 1 payment theo ID (bao gồm cả invoice snapshot)
// --------------------------------------------------------------------
export const getPaymentDetail = async (id) => {
  const res = await api.get(`/api/payments/${id}`);
  return res.data;
};

// --------------------------------------------------------------------
// Tạo payment cho 1 order
// request:
//  {
//     orderId: number,
//     amount: BigDecimal,
//     method: "CASH" | "MOMO" | "BANKING",
//     note: string
//  }
// BE sẽ tự động tạo invoice & cập nhật trạng thái order → PAID
// --------------------------------------------------------------------
export const createPayment = async (data) => {
  const res = await api.post("/api/payments", data);
  return res.data;
};

// --------------------------------------------------------------------
// 🧮 calcPayment – API TÍNH THỬ SỐ TIỀN THANH TOÁN (KHÔNG LƯU DB)
// --------------------------------------------------------------------
// Mục đích:
//  - Cho FE gọi trước khi bấm "Xác nhận thanh toán"
//  - BE sẽ tính:
//      + originalTotal        : Tổng tiền gốc của order
//      + voucherDiscount      : Số tiền giảm do voucher
//      + defaultDiscount      : Số tiền giảm do discount mặc định (system_setting)
//      + totalDiscount        : Tổng giảm (voucher + default)
//      + vatPercent           : % VAT đang áp dụng
//      + vatAmount            : Số tiền VAT
//      + finalAmount          : Số tiền cuối cùng phải trả
//      + appliedVoucherCode   : Mã voucher thực sự áp dụng (nếu hợp lệ)
//
// request:
//  {
//    orderId: number,
//    voucherCode?: string  // nếu không nhập → gửi "" hoặc không gửi
//  }
//
// response (ví dụ):
//  {
//    orderId: 1,
//    originalTotal: 100000,
//    voucherDiscount: 10000,
//    defaultDiscount: 5000,
//    totalDiscount: 15000,
//    vatPercent: 10,
//    vatAmount: 8500,
//    finalAmount: 93500,
//    appliedVoucherCode: "KM10"
//  }
// --------------------------------------------------------------------
export const calcPayment = async (data) => {
  const res = await api.post("/api/payments/calc", data);
  return res.data; // Trả thẳng data cho PaymentModal xử lý
};
