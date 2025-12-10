// OrderDetailModal.jsx – Hiển thị thông tin chi tiết Order
// -------------------------------------------------------------------
// Nhận props: open, onClose, order
// order phải theo đúng cấu trúc OrderResponse từ BE:
// {
//   id, orderCode, totalPrice, status, createdAt, items: [
//     { dishId, dishName, dishPrice, quantity, subtotal }
//   ]
// }
// -------------------------------------------------------------------

import { Modal, Table, Tag } from "antd";
import dayjs from "dayjs";

export default function OrderDetailModal({ open, onClose, order }) {
  
  // Nếu chưa có dữ liệu thì không render nội dung modal
  if (!order) return null;
  // Lọc bỏ các món đã hủy – KHÔNG hiển thị trong Order Detail
  const visibleItems = order.items.filter(item => item.status !== "CANCELED");

  // --------------------------------------------
  // Màu trạng thái
  // --------------------------------------------
  const statusTag = (st) => {
    if (st === "NEW") return <Tag color="blue">Mới</Tag>;
    if (st === "SERVING") return <Tag color="orange">Đang phục vụ</Tag>;
    if (st === "PAID") return <Tag color="green">Đã thanh toán</Tag>;
    return st;
  };

  // --------------------------------------------
  // Cột các món ăn trong order
  // --------------------------------------------
  const itemColumns = [
    {
      title: "Món ăn",
      dataIndex: "dishName",
    },
    {
      title: "Đơn giá",
      dataIndex: "dishPrice",
      render: (value) => value.toLocaleString() + " đ",
    },
    {
      title: "SL",
      dataIndex: "quantity",
    },
    {
      title: "Thành tiền",
      dataIndex: "subtotal",
      render: (value) => value.toLocaleString() + " đ",
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Chi tiết Order – ${order.orderCode}`}
      footer={null}
    >
      <p><b>Mã Order:</b> {order.orderCode}</p>
      <p><b>Trạng thái:</b> {statusTag(order.status)}</p>
      <p>
        <b>Ngày tạo:</b>{" "}
        {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}
      </p>

      <h3 style={{ marginTop: 20 }}>Danh sách món ăn</h3>

      <Table
        rowKey="dishId"
        dataSource={visibleItems}
        columns={itemColumns}
        pagination={false}
      />

      <h3 style={{ textAlign: "right", marginTop: 20 }}>
        Tổng tiền:{" "}
        <span style={{ color: "red", fontSize: 20 }}>
          {order.totalPrice.toLocaleString()} đ
        </span>
      </h3>
    </Modal>
  );
}
