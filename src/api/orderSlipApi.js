// orderSlipApi.js
// ------------------------------------------------------
// API in PHIẾU GỌI MÓN (Order Slip)
// Dùng cho POS Tablet / POS Simple
// ------------------------------------------------------

import api from "./axiosConfig";

/**
 * Export Order Slip PDF
 * @param {number} orderId
 * @returns Blob PDF
 */
export const exportOrderSlipPdf = async (orderId) => {
  const res = await api.get(
    `/api/order-slips/${orderId}/export-pdf`,
    {
      responseType: "blob", // ⚠️ BẮT BUỘC
    }
  );
  return res.data;
};
