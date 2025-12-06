// invoiceApi.js – API gọi BE cho hóa đơn
// ---------------------------------------------------------------------
// Chức năng chính:
//   - Lấy hóa đơn theo orderId
//   - Lấy chi tiết hóa đơn theo invoiceId
//
// Quy chuẩn:
//   - Sử dụng axios từ axiosConfig.js (đã tự đính kèm token + auto refresh)
//   - Toàn bộ comment tiếng Việt theo Rule 13
//   - Tên hàm đúng chuẩn RESTful FE
// ---------------------------------------------------------------------

import api from "./axiosConfig";

/**
 * Lấy hóa đơn dựa theo orderId
 * --------------------------------------------------------------
 * Dùng khi:
 *  - FE sau khi thanh toán xong → muốn xem hóa đơn
 *  - Hoặc từ OrderPage → mở hóa đơn của order
 *
 * @param {number} orderId  ID đơn hàng gốc
 * @returns {Promise<InvoiceResponse>}
 */
export const getInvoiceByOrderId = async (orderId) => {
  const res = await api.get(`/api/invoices/order/${orderId}`);
  return res.data; // Trả về JSON InvoiceResponse
};

/**
 * Lấy chi tiết hóa đơn dựa theo invoiceId
 * --------------------------------------------------------------
 * Dùng cho InvoiceDetailPage
 * FE chỉ cần invoiceId là lấy được đầy đủ:
 *  - Tổng tiền
 *  - Danh sách các invoice_item
 *  - Phương thức thanh toán
 *  - Thời gian thanh toán
 *
 * @param {number} invoiceId
 * @returns {Promise<InvoiceResponse>}
 */
export const getInvoiceDetail = async (invoiceId) => {
  const res = await api.get(`/api/invoices/${invoiceId}`);
  return res.data;
};

// --------------------------------------------------------------
// API EXPORT PDF HÓA ĐƠN
// --------------------------------------------------------------
// Trả về file PDF dạng blob để FE xử lý download
export const exportInvoicePdf = async (invoiceId) => {
  const res = await api.get(`/api/invoices/${invoiceId}/export-pdf`, {
    responseType: "blob", // quan trọng!!!
  });

  // Convert blob
  const blob = new Blob([res.data], { type: "application/pdf" });

  // Lấy tên file từ header Content-Disposition
  let filename = "invoice.pdf";
  const disposition = res.headers["content-disposition"];
  if (disposition) {
    const match = disposition.match(/filename="?(.+)"?/);
    if (match) filename = match[1];
  }

  return { blob, filename };
};

// --------------------------------------------------------------
// API EXPORT HTML HÓA ĐƠN (DÙNG ĐỂ IN POS)
// --------------------------------------------------------------
// BE trả về String HTML → FE mở window mới và gọi window.print()
export const exportInvoiceHtml = async (invoiceId) => {
  // Gọi axios chung, baseURL = VITE_API_BASE_URL
  const res = await api.get(`/api/invoices/${invoiceId}/export-html`, {
    // Kiểu dữ liệu trả về là text/HTML
    responseType: "text",
  });

  // res.data chính là String HTML trả từ BE
  return res.data;
};
