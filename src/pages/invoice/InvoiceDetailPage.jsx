// InvoiceDetailPage.jsx – Trang xem chi tiết hóa đơn
// ---------------------------------------------------------------------
// Chức năng:
//  - Lấy chi tiết hóa đơn theo invoiceId trên URL
//  - Hiển thị thông tin hóa đơn + danh sách món
//
// Đã bổ sung hiển thị:
//  - Tổng tiền gốc (trước giảm giá)
//  - Số tiền giảm (discountAmount)
//  - Mã voucher đã áp dụng (voucherCode)
//  - Tổng tiền sau giảm (totalAmount)
//
// Quy chuẩn FE:
//  - Không bọc AdminLayout trực tiếp (Rule 14)
//  - Sử dụng Ant Design variant thay cho bordered (Rule 29)
//  - UI gọn gàng, dễ đọc (Rule 27)
//  - Mọi comment tiếng Việt (Rule 13)
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  Card,
  Table,
  Descriptions,
  Tag,
  Typography,
  Space,
  Button,
  message,
} from "antd";

import { ArrowLeftOutlined, DownloadOutlined, PrinterOutlined } from "@ant-design/icons";

import dayjs from "dayjs";
import { fetchSettingsByGroup } from "../../api/settingApi"; // gọi API cấu hình hệ thống

// API xuất PDF
import { getInvoiceDetail, exportInvoicePdf, exportInvoiceHtml } from "../../api/invoiceApi";

const { Title } = Typography;

// Hàm format datetime theo chuẩn chung: dd/MM/yyyy HH:mm
const formatDateTime = (value) => {
  if (!value) return "";
  return dayjs(value).format("DD/MM/YYYY HH:mm");
};

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Thông tin nhà hàng lấy từ System Setting (Module 20)
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: "",
    address: "",
    phone: "",
    taxId: "",
  });

  // -------------------------------------------------------------------
  // Gọi API lấy chi tiết hóa đơn
  // -------------------------------------------------------------------
  const loadInvoice = async () => {
    try {
      setLoading(true);
      const res = await getInvoiceDetail(invoiceId);
      setInvoice(res);
    } catch (err) {
      console.error(err);
      //message.error("Không thể tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // Gọi API lấy thông tin cấu hình nhà hàng (Module 20 - RESTAURANT)
  // -------------------------------------------------------------------
  const loadRestaurantInfo = async () => {
    try {
      // Gọi API group RESTAURANT: restaurant.name, .address, .phone, .tax_id
      const res = await fetchSettingsByGroup("RESTAURANT");
      const data = res.data || [];

      // Map settingKey -> settingValue cho dễ dùng
      const map = {};
      data.forEach((item) => {
        if (!item.settingKey) return;
        map[item.settingKey] = item.settingValue;
      });

      setRestaurantInfo({
        name: map["restaurant.name"] || "",
        address: map["restaurant.address"] || "",
        phone: map["restaurant.phone"] || "",
        taxId: map["restaurant.tax_id"] || "",
      });
    } catch (err) {
      console.error("Lỗi tải thông tin nhà hàng:", err);
      // Không cần //message.error để tránh làm phiền user, vẫn hiển thị hóa đơn bình thường
    }
  };

    // -------------------------------------------------------------------
  // Xử lý IN HÓA ĐƠN ra máy POS
  // -------------------------------------------------------------------
  const handlePrintInvoice = async () => {
    if (!invoiceId) {
      //message.error("Không tìm thấy mã hóa đơn để in.");
      return;
    }

    try {
      // 1) Gọi BE lấy HTML hóa đơn
      const html = await exportInvoiceHtml(invoiceId);

      // 2) Mở cửa sổ mới để in
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        //message.error("Trình duyệt chặn popup, vui lòng cho phép mở cửa sổ mới.");
        return;
      }

      // Ghi HTML vào cửa sổ mới
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      // 3) Đợi DOM render xong rồi gọi print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // Có thể KHÔNG đóng để user xem lại, hoặc đóng tùy ý:
        // printWindow.close();
      }, 300);
    } catch (error) {
      console.error("Lỗi in hóa đơn:", error);
      //message.error("In hóa đơn thất bại, vui lòng thử lại.");
    }
  };

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
    // Load thông tin nhà hàng 1 lần khi mở trang
    loadRestaurantInfo();
  }, [invoiceId]);

  // -------------------------------------------------------------------
  // HÀM XUẤT PDF HÓA ĐƠN
  // -------------------------------------------------------------------
  // Quy trình:
  //  1. FE gọi API exportInvoicePdf(invoice.id)
  //  2. Nhận blob + filename từ BE
  //  3. FE tạo URL tạm → trigger download
  //  4. Dọn URL tạm tránh leak bộ nhớ
  // -------------------------------------------------------------------
  const handleExportPdf = async () => {
    try {
      message.loading({
        content: "Đang xuất PDF...",
        key: "exportInvoicePdf",
        duration: 0,
      });

      // Gọi API BE lấy file PDF dạng blob
      const { blob, filename } = await exportInvoicePdf(invoice.id);

      // Tạo URL tạm từ blob
      const url = window.URL.createObjectURL(blob);

      // Tạo thẻ <a> để tải file
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "invoice.pdf";
      document.body.appendChild(link);
      link.click();

      // Dọn dẹp
      window.URL.revokeObjectURL(url);
      link.remove();

      message.success({
        content: "Xuất PDF thành công!",
        key: "exportInvoicePdf",
      });
    } catch (err) {
      console.error(err);
      message.error({
        content: "Xuất PDF thất bại!",
        key: "exportInvoicePdf",
      });
    }
  };

  // -------------------------------------------------------------------
  // Cấu hình cột bảng món ăn
  // -------------------------------------------------------------------
  const columns = [
    {
      title: "Món ăn",
      dataIndex: "dishName",
      key: "dishName",
    },
    {
      title: "Đơn giá",
      dataIndex: "dishPrice",
      key: "dishPrice",
      render: (price) =>
        typeof price === "number"
          ? price.toLocaleString("vi-VN")
          : Number(price || 0).toLocaleString("vi-VN"),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Thành tiền",
      dataIndex: "subtotal",
      key: "subtotal",
      render: (value) =>
        typeof value === "number"
          ? value.toLocaleString("vi-VN")
          : Number(value || 0).toLocaleString("vi-VN"),
    },
  ];

  const headerTitle = invoice
    ? `Hóa đơn #${invoice.id} (Order #${invoice.orderId})`
    : "Chi tiết hóa đơn";

  return (
    <Card
      variant="outlined"
      style={{ margin: 20 }}
      loading={loading && !invoice}
    >
      {/* Header */}
      <Space
        style={{
          width: "100%",
          marginBottom: 16,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {headerTitle}
        </Title>

        <Space>
          {/* ---------------------------------------------------- */}
          {/* NÚT XUẤT PDF – gọi handleExportPdf()                 */}
          {/* ---------------------------------------------------- */}
          <Button
            type="primary"
            variant="solid"
            icon={<DownloadOutlined />}
            onClick={handleExportPdf}
            disabled={!invoice}
          >
            Xuất PDF
          </Button>

          {/* Nút IN HÓA ĐƠN ra máy POS */}
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrintInvoice}
          >
            In hóa đơn
          </Button>

          {/* Nút quay lại */}
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </Space>
      </Space>

      {/* =============================== */}
      {/*  THÔNG TIN NHÀ HÀNG (HEADER)   */}
      {/* =============================== */}
      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          {/* Tên nhà hàng */}
          <Title level={4} style={{ marginBottom: 4 }}>
            {restaurantInfo.name || "Tên nhà hàng"}
          </Title>

          {/* Địa chỉ */}
          {restaurantInfo.address && (
            <div style={{ marginBottom: 2 }}>
              <strong>Địa chỉ:</strong> {restaurantInfo.address}
            </div>
          )}

          {/* Số điện thoại */}
          {restaurantInfo.phone && (
            <div style={{ marginBottom: 2 }}>
              <strong>Điện thoại:</strong> {restaurantInfo.phone}
            </div>
          )}

          {/* Mã số thuế */}
          {restaurantInfo.taxId && (
            <div style={{ marginBottom: 2 }}>
              <strong>Mã số thuế:</strong> {restaurantInfo.taxId}
            </div>
          )}
        </div>
      </Card>

      {/* =============================== */}
      {/*    THÔNG TIN HÓA ĐƠN + VOUCHER  */}
      {/* =============================== */}

      {invoice && (
        <Card variant="borderless" style={{ marginBottom: 16 }}>
          <Descriptions title="Thông tin hóa đơn" bordered={false} column={2}>
            <Descriptions.Item label="Order ID">
              {invoice.orderId}
            </Descriptions.Item>

            {/* 🔵 TỔNG TIỀN GỐC TRƯỚC GIẢM */}
            {Number(invoice.originalTotalAmount || 0) > 0 && (
              <Descriptions.Item label="Tổng gốc (trước giảm)">
                <span style={{ textDecoration: "line-through", color: "#888" }}>
                  {Number(invoice.originalTotalAmount || 0).toLocaleString("vi-VN")} ₫
                </span>
              </Descriptions.Item>
            )}

            {/* 🔵 GIẢM VOUCHER */}
            {Number(invoice.voucherDiscountAmount || 0) > 0 && (
              <Descriptions.Item label="Giảm voucher">
                <Tag color="red">
                  -{Number(invoice.voucherDiscountAmount || 0).toLocaleString("vi-VN")} ₫
                </Tag>
              </Descriptions.Item>
            )}

            {/* 🔵 GIẢM MẶC ĐỊNH */}
            {Number(invoice.defaultDiscountAmount || 0) > 0 && (
              <Descriptions.Item label="Giảm mặc định">
                <Tag color="orange">
                  -{Number(invoice.defaultDiscountAmount || 0).toLocaleString("vi-VN")} ₫
                </Tag>
              </Descriptions.Item>
            )}

            {/* 🔵 TỔNG GIẢM */}
            {Number(invoice.discountAmount || 0) > 0 && (
              <Descriptions.Item label="Tổng giảm giá">
                <Tag color="red">
                  -{Number(invoice.discountAmount || 0).toLocaleString("vi-VN")} ₫
                </Tag>
              </Descriptions.Item>
            )}

            {/* 🔵 VAT */}
            {Number(invoice.vatPercent || 0) > 0 && (
              <Descriptions.Item label={`VAT (${Number(invoice.vatPercent)}%)`}>
                {Number(invoice.vatAmount || 0).toLocaleString("vi-VN")} ₫
              </Descriptions.Item>
            )}

            {/* 🔵 TỔNG TIỀN SAU GIẢM + VAT */}
            <Descriptions.Item label="Tổng thanh toán">
              <Tag color="green" style={{ fontSize: 14 }}>
                {invoice.totalAmount
                  ? Number(invoice.totalAmount).toLocaleString("vi-VN")
                  : 0}{" "}
                ₫
              </Tag>
            </Descriptions.Item>

            {/* 🔵 KHÁCH TRẢ */}
            {invoice.customerPaid && (
              <Descriptions.Item label="Khách trả">
                {Number(invoice.customerPaid || 0).toLocaleString("vi-VN")} ₫
              </Descriptions.Item>
            )}

            {/* 🔵 TIỀN THỪA */}
            {invoice.changeAmount && (
              <Descriptions.Item label="Tiền thừa trả khách">
                {Number(invoice.changeAmount || 0).toLocaleString("vi-VN")} ₫
              </Descriptions.Item>
            )}

            {/* 🔵 MÃ VOUCHER */}
            {invoice.voucherCode && (
              <Descriptions.Item label="Voucher áp dụng">
                <Tag color="blue">{invoice.voucherCode}</Tag>
              </Descriptions.Item>
            )}

            {/* 🔵 ĐIỂM THƯỞNG */}
            <Descriptions.Item label="Điểm nhận được">
              <Tag color="green" style={{ fontSize: 14 }}>
                {invoice.loyaltyEarnedPoint ?? 0} điểm
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Phương thức thanh toán">
              {invoice.paymentMethod || "Chưa cập nhật"}
            </Descriptions.Item>

            <Descriptions.Item label="Thanh toán lúc">
              {formatDateTime(invoice.paidAt)}
            </Descriptions.Item>

            <Descriptions.Item label="Tạo lúc">
              {formatDateTime(invoice.createdAt)}
            </Descriptions.Item>

            <Descriptions.Item label="Cập nhật lúc">
              {formatDateTime(invoice.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* =============================== */}
      {/*    DANH SÁCH MÓN TRONG HÓA ĐƠN  */}
      {/* =============================== */}

      <Card variant="borderless" title="Danh sách món trong hóa đơn">
        <Table
          rowKey={(record, index) => `${record.dishId}-${index}`}
          dataSource={invoice?.items || []}
          columns={columns}
          pagination={false}
          variant="borderless"
        />
      </Card>
    </Card>
  );
}
