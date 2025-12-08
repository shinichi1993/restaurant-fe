// src/components/kitchen/KitchenItemCard.jsx
// ============================================================================
// KitchenItemCard
// ----------------------------------------------------------------------------
// Component hiển thị 1 món trên màn hình bếp.
//
// Hiển thị:
//  - Tên món + số lượng
//  - Mã order + bàn
//  - Trạng thái hiện tại (Tag màu)
//  - Ghi chú (nếu có)
//  - Các nút hành động: Chuyển trạng thái, Hủy món
//
// Props:
//  - item: KitchenItemResponse từ BE
//  - onChangeStatus: (orderItemId, nextStatus) => void
//  - onCancelItem:   (orderItemId) => void
// ============================================================================

import { Card, Tag, Space, Button, Typography } from "antd";

const { Text } = Typography;

/**
 * Hàm map status → màu Tag + text hiển thị.
 */
const getStatusMeta = (status) => {
  switch (status) {
    case "NEW":
      return { color: "blue", label: "Mới tạo" };
    case "SENT_TO_KITCHEN":
      return { color: "orange", label: "Đã gửi bếp" };
    case "COOKING":
      return { color: "green", label: "Đang chế biến" };
    case "DONE":
      return { color: "purple", label: "Hoàn thành" };
    case "CANCELED":
      return { color: "red", label: "Đã hủy" };
    default:
      return { color: "default", label: status || "Không rõ" };
  }
};

/**
 * Hàm xác định action chính tiếp theo dựa trên status hiện tại.
 * ----------------------------------------------------------------------------
 * - NEW             → SENT_TO_KITCHEN
 * - SENT_TO_KITCHEN → COOKING
 * - COOKING         → DONE
 * - DONE/CANCELED   → không có action tiếp theo
 */
const getNextStatus = (status) => {
  if (status === "NEW") return "SENT_TO_KITCHEN";
  if (status === "SENT_TO_KITCHEN") return "COOKING";
  if (status === "COOKING") return "DONE";
  return null;
};

const getNextStatusLabel = (nextStatus) => {
  if (nextStatus === "SENT_TO_KITCHEN") return "Gửi bếp";
  if (nextStatus === "COOKING") return "Bắt đầu nấu";
  if (nextStatus === "DONE") return "Hoàn thành";
  return "";
};

export function KitchenItemCard({ item, onChangeStatus, onCancelItem }) {
  const statusMeta = getStatusMeta(item.status);
  const nextStatus = getNextStatus(item.status);
  const nextLabel = getNextStatusLabel(nextStatus);

  const tableText = item.tableName
    ? `${item.tableName} (#${item.tableId})`
    : "Mang về / Không gán bàn";

  return (
    <Card
      size="small"
      variant="borderless" // ✅ Dùng variant, không dùng bordered (Rule 29)
      style={{
        marginBottom: 8,
        boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
        borderRadius: 12,
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* Dòng 1: Tên món + Tag trạng thái */}
        <Space
          align="start"
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <div>
            <Text strong>
              {item.dishName || "Không rõ món"}{" "}
              <Text type="secondary">x{item.quantity}</Text>
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Order: {item.orderCode} (#{item.orderId})
              </Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Bàn: {tableText}
              </Text>
            </div>
          </div>

          <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
        </Space>

        {/* Dòng 2: Ghi chú nếu có */}
        {item.note && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Ghi chú: {item.note}
          </Text>
        )}

        {/* Dòng 3: Button hành động */}
        <Space>
          {nextStatus && (
            <Button
              size="small"
              type="primary"
              onClick={() => onChangeStatus(item.orderItemId, nextStatus)}
            >
              {nextLabel}
            </Button>
          )}

          {/* Nút hủy món luôn hiển thị, BE sẽ kiểm tra quyền theo POS setting */}
          {item.status !== "CANCELED" && item.status !== "DONE" && (
            <Button
              size="small"
              danger
              onClick={() => onCancelItem(item.orderItemId)}
            >
              Hủy món
            </Button>
          )}
        </Space>
      </Space>
    </Card>
  );
}
