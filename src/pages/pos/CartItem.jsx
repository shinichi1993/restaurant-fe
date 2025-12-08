// src/pages/pos/CartItem.jsx
// ============================================================================
// CartItem – Hiển thị 1 dòng món trong giỏ hàng POS
// ----------------------------------------------------------------------------
// Chức năng:
//  - Hiển thị tên món, số lượng, giá, ghi chú
//  - Hiển thị TRẠNG THÁI MÓN (Tag màu):
//        NEW             → "Mới tạo"
//        SENT_TO_KITCHEN → "Đã gửi bếp"
//        COOKING         → "Đang nấu"
//        DONE            → "Hoàn thành"
//        CANCELED        → "Đã hủy"
//  - Khóa thao tác (không cho sửa/xóa) theo quy tắc:
//      + Nếu forceLocked = true (món có item đã gửi bếp/đang nấu/hoàn thành)
//          → khóa luôn, chỉ hiển thị
//      + Nếu forceLocked = false:
//          → Cho sửa khi: NEW
//          → Không cho sửa khi: SENT_TO_KITCHEN, COOKING, DONE, CANCELED
//
// Props:
//  - item: { dishId, name, price, quantity, note, status }
//  - forceLocked: boolean – khóa theo dish-level (Case A)
//  - onChangeQuantity(qty)
//  - onChangeNote(note)
//  - onRemove()
// ============================================================================

import { Row, Col, InputNumber, Input, Button, Tag, Tooltip } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const STATUS_LABEL_MAP = {
  NEW: "Mới tạo",
  SENT_TO_KITCHEN: "Đã gửi bếp",
  COOKING: "Đang nấu",
  DONE: "Hoàn thành",
  CANCELED: "Đã hủy",
};

// Màu Tag theo trạng thái
const STATUS_COLOR_MAP = {
  NEW: "default",
  SENT_TO_KITCHEN: "processing",
  COOKING: "orange",
  DONE: "green",
  CANCELED: "default",
};

export default function CartItem({
  item,
  forceLocked = false,
  onChangeQuantity,
  onChangeNote,
  onRemove,
}) {
  const status = item.status || "NEW";

  // ------------------------------------------------------------
  // Quy tắc khóa thao tác:
  //  - Nếu forceLocked = true → khóa hết (Case A - dish có item locked)
  //  - Nếu forceLocked = false:
  //      + Cho phép sửa khi: NEW
  //      + Không cho sửa khi:
  //            SENT_TO_KITCHEN, COOKING, DONE, CANCELED
  //    (BE cũng đã chặn, FE chỉ hỗ trợ UX)
  // ------------------------------------------------------------
  const selfStatusLocked =
    status === "SENT_TO_KITCHEN" ||
    status === "COOKING" ||
    status === "DONE" ||
    status === "CANCELED";

  const isLocked = forceLocked || selfStatusLocked;

  const label = STATUS_LABEL_MAP[status] || status;
  const color = STATUS_COLOR_MAP[status] || "default";

  return (
    <div
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: 8,
        padding: 8,
      }}
    >
      <Row gutter={[8, 8]} align="middle">
        {/* Tên món + trạng thái */}
        <Col span={16}>
          <div style={{ fontWeight: 600 }}>{item.name}</div>
          <div style={{ marginTop: 4 }}>
            <Tag color={color}>{label}</Tag>
          </div>
        </Col>

        {/* Số lượng + giá */}
        <Col span={8} style={{ textAlign: "right" }}>
          <div style={{ marginBottom: 4 }}>
            {/* Số lượng, khóa nếu isLocked */}
            <InputNumber
              min={0}
              value={item.quantity}
              disabled={isLocked}
              onChange={(value) => {
                if (isLocked) return; // phòng trường hợp lỡ tay
                const qty = Number(value || 0);
                onChangeQuantity(qty);
              }}
            />
          </div>
          <div style={{ fontWeight: 600 }}>
            {(Number(item.price || 0) * item.quantity).toLocaleString()} đ
          </div>
        </Col>

        {/* Ghi chú món */}
        <Col span={20}>
          <Input.TextArea
            rows={1}
            placeholder="Ghi chú món (ít cay, không hành...)"
            value={item.note}
            disabled={isLocked}
            onChange={(e) => onChangeNote(e.target.value)}
          />
        </Col>

        {/* Nút xóa */}
        <Col span={4} style={{ textAlign: "right" }}>
          <Tooltip
            title={
              isLocked
                ? "Không thể xóa/sửa món đã gửi bếp/đang chế biến/hoàn thành (Case A)"
                : "Xóa món"
            }
          >
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              disabled={isLocked}
              onClick={onRemove}
            />
          </Tooltip>
        </Col>
      </Row>
    </div>
  );
}
