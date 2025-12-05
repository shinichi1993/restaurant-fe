// src/components/payment/PaymentDetailModal.jsx
// ======================================================================
// PaymentDetailModal
// ----------------------------------------------------------------------
// Modal hiển thị chi tiết 1 payment.
// Được dùng trong PaymentPage.jsx khi user bấm nút "Chi tiết".
//
// Props:
//  - open: boolean – trạng thái mở/đóng modal
//  - onClose: function – hàm đóng modal
//  - payment: object PaymentResponse – dữ liệu payment được chọn
//
// Ghi chú:
//  - Chỉ hiển thị dữ liệu đã có sẵn từ PaymentPage (props.payment)
//    Nếu sau này cần detail nâng cao → có thể gọi API getPaymentDetail()
//    trong useEffect của component này.
//  - Format ngày giờ theo dd/MM/yyyy HH:mm (Rule 26)
//  - Toàn bộ comment tiếng Việt theo Rule 13
// ======================================================================

import { Modal, Descriptions, Tag } from "antd";
import dayjs from "dayjs";

// Hàm format datetime theo rule chuẩn
const formatDateTime = (value) => {
  if (!value) return "";
  return dayjs(value).format("DD/MM/YYYY HH:mm");
};

export default function PaymentDetailModal({ open, onClose, payment }) {
  // Nếu chưa có dữ liệu payment → không render nội dung (tránh lỗi undefined)
  const p = payment;

  // Hàm render tag phương thức thanh toán cho đẹp
  const renderMethod = (method) => {
    if (!method) return "-";

    switch (method) {
      case "CASH":
        return <Tag color="green">Tiền mặt</Tag>;
      case "MOMO":
        return <Tag color="purple">Momo</Tag>;
      case "BANKING":
        return <Tag color="blue">Chuyển khoản</Tag>;
      default:
        return <Tag>{method}</Tag>;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      title="Chi tiết thanh toán"
      okText="Đóng"
      cancelButtonProps={{ style: { display: "none" } }} // Ẩn nút Hủy, chỉ dùng nút Đóng
      destroyOnClose
    >
      {/* Nếu chưa có payment → hiển thị thông báo đơn giản */}
      {!p ? (
        <p>Không có dữ liệu thanh toán.</p>
      ) : (
        <Descriptions
          column={1}
          size="middle"
          labelStyle={{ width: 160, fontWeight: 500 }}
        >
          {/* Thông tin chung */}
          <Descriptions.Item label="Mã payment">
            #{p.id}
          </Descriptions.Item>

          <Descriptions.Item label="Mã order">
            {p.orderId ? `#${p.orderId}` : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Mã hóa đơn (Invoice)">
            {p.invoiceId ? `#${p.invoiceId}` : "Chưa có hóa đơn"}
          </Descriptions.Item>

          <Descriptions.Item label="Số tiền thanh toán">
            {p.amount != null
              ? `${p.amount.toLocaleString("vi-VN")} đ`
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Phương thức">
            {renderMethod(p.method)}
          </Descriptions.Item>

          <Descriptions.Item label="Ghi chú">
            {p.note || "-"}
          </Descriptions.Item>

          {/* Thông tin thời gian & người tạo */}
          <Descriptions.Item label="Thời gian thanh toán">
            {formatDateTime(p.paidAt)}
          </Descriptions.Item>

          <Descriptions.Item label="Người tạo">
            {p.createdBy ? `User #${p.createdBy}` : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Ngày tạo bản ghi">
            {formatDateTime(p.createdAt)}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
