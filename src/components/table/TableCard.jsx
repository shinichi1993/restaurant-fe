// TableCard.jsx – Component hiển thị 1 bàn (Table) trong Module 16
// ----------------------------------------------------------------------
// Mục đích:
//  - Tách phần UI hiển thị thông tin 1 bàn ra khỏi TablePage.jsx
//  - Dễ tái sử dụng ở nhiều nơi (ví dụ: trang POS, popup chọn bàn...)
//  - Giữ TablePage.jsx gọn hơn, chỉ tập trung xử lý logic gọi API
//
// Props nhận vào:
//  - table: object bàn, theo cấu trúc TableResponse từ BE:
//      {
//        id: number,
//        name: string,
//        capacity: number,
//        status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MERGED",
//        mergedRootId?: number
//      }
//  - onEdit(table): function – được gọi khi bấm nút "Sửa"
//  - onDelete(table): function – được gọi khi bấm nút "Xóa"
//  - onAction(table): function – được gọi khi bấm nút "Thao tác"
//      (sau này dùng mở TableActionModal: gộp/chuyển/tách bàn, tạo order...)
//
// Quy tắc:
//  - Không xử lý gọi API trực tiếp trong component này
//  - Toàn bộ comment tiếng Việt (Rule 13)
//  - UI dùng Ant Design Card + Tag + Button (Rule 27)
// ----------------------------------------------------------------------

import { Card, Tag, Space, Button } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";

/**
 * Hàm helper render Tag trạng thái với màu sắc tương ứng.
 */
const renderStatusTag = (status) => {
  if (status === "AVAILABLE") {
    return <Tag color="green">Trống</Tag>;
  }
  if (status === "OCCUPIED") {
    return <Tag color="orange">Đang phục vụ</Tag>;
  }
  if (status === "RESERVED") {
    return <Tag color="red">Đã đặt trước</Tag>;
  }
  if (status === "MERGED") {
    return <Tag color="default">Đã gộp</Tag>;
  }
  return <Tag>{status}</Tag>;
};

/**
 * TableCard – Component hiển thị 1 bàn.
 */
export default function TableCard({ table, onEdit, onDelete, onAction }) {
  if (!table) return null;

  // Handler nội bộ: gọi lại props nếu được truyền vào
  const handleEdit = () => {
    if (onEdit) {
      onEdit(table);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(table);
    }
  };

  const handleAction = () => {
    if (onAction) {
      onAction(table);
    }
  };

  return (
    <Card
      variant="outlined"
      style={{ cursor: "default" }}
      title={
        <Space>
          {/* Tên bàn */}
          <span>{table.name}</span>
          {/* Tag trạng thái */}
          {renderStatusTag(table.status)}
        </Space>
      }
      extra={
        <Space>
          {/* Nút sửa bàn */}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            Sửa
          </Button>

          {/* Nút xóa bàn */}
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            Xóa
          </Button>
        </Space>
      }
    >
      {/* Thông tin chi tiết bên trong card */}
      <p>
        <b>Số ghế:</b> {table.capacity}
      </p>

      {/* Nếu có mergedRootId → hiển thị bàn gốc */}
      {table.mergedRootId && (
        <p>
          <b>Bàn gốc:</b> #{table.mergedRootId}
        </p>
      )}

      {/* Nút thao tác nâng cao – cho Module 16 phần 2:
          gộp bàn, chuyển bàn, tách bàn, tạo order...
          Tạm thời có thể ẩn nếu chưa dùng.
       */}
      {onAction && (
        <Button
          type="link"
          icon={<MoreOutlined />}
          onClick={handleAction}
        >
          Thao tác
        </Button>
      )}
    </Card>
  );
}
