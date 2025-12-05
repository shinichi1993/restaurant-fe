// UserDetailModal.jsx – Modal xem chi tiết người dùng
// --------------------------------------------------------------------
// Hiển thị thông tin đầy đủ của user:
//  - Username
//  - Họ tên
//  - Vai trò
//  - Trạng thái
//  - Ngày tạo
//  - Ngày cập nhật
// Dùng trong UserPage.jsx khi nhấn vào username
// --------------------------------------------------------------------
// Không gọi API lại vì dữ liệu đã có từ bảng (props.user)
// --------------------------------------------------------------------

import { Modal, Descriptions, Tag } from "antd";
import dayjs from "dayjs";

export default function UserDetailModal({ open, onClose, user }) {
  if (!user) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
      title="Chi tiết người dùng"
      destroyOnHidden
    >
      <Descriptions
        bordered
        column={1}
        size="middle"
        labelStyle={{ width: 150 }}
      >
        <Descriptions.Item label="Tên đăng nhập">
          {user.username}
        </Descriptions.Item>

        <Descriptions.Item label="Họ tên">
          {user.fullName}
        </Descriptions.Item>

        <Descriptions.Item label="Vai trò">
          {user.role === "ADMIN" ? (
            <Tag color="red">ADMIN</Tag>
          ) : (
            <Tag color="blue">STAFF</Tag>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Trạng thái">
          {user.status === "ACTIVE" ? (
            <Tag color="green">Hoạt động</Tag>
          ) : (
            <Tag color="default">Ngừng hoạt động</Tag>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Ngày tạo">
          {user.createdAt
            ? dayjs(user.createdAt).format("DD/MM/YYYY HH:mm")
            : "---"}
        </Descriptions.Item>

        <Descriptions.Item label="Ngày cập nhật">
          {user.updatedAt
            ? dayjs(user.updatedAt).format("DD/MM/YYYY HH:mm")
            : "---"}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}
