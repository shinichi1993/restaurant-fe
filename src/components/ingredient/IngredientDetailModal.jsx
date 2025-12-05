// src/components/ingredient/IngredientDetailModal.jsx
// --------------------------------------------------------------------
// Modal xem chi tiết nguyên liệu
// - Không load API lại
// - Nhận dữ liệu từ props.item
// - Chỉ hiển thị, không cho sửa
// --------------------------------------------------------------------

import { Modal, Descriptions, Tag } from "antd";

export default function IngredientDetailModal({ open, onClose, item }) {
  if (!item) return null;

  const renderStatusTag = () => {
    return item.active ? (
      <Tag color="green">Hoạt động</Tag>
    ) : (
      <Tag color="default">Ngừng</Tag>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Thông tin nguyên liệu"
    >
      <Descriptions bordered={false} column={1}>
        <Descriptions.Item label="Tên nguyên liệu">
          {item.name}
        </Descriptions.Item>

        <Descriptions.Item label="Đơn vị tính">
          {item.unit}
        </Descriptions.Item>

        <Descriptions.Item label="Tồn kho">{item.stockQuantity}</Descriptions.Item>

        <Descriptions.Item label="Trạng thái">
          {renderStatusTag()}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}
