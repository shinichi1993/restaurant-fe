// src/pages/pos/KitchenOrderCard.jsx
// ============================================================================
// KitchenOrderCard – Hiển thị 1 ORDER trên màn hình bếp
// ----------------------------------------------------------------------------
// Chức năng:
//  - Hiển thị thông tin order:
//      + Bàn, mã order, thời gian tạo
//  - Hiển thị danh sách món trong order (KitchenItemResponse):
//      + Tên món, số lượng, trạng thái, ghi chú
//  - Cho phép thao tác chuyển trạng thái từng món:
//      NEW             → SENT_TO_KITCHEN / CANCELED
//      SENT_TO_KITCHEN → COOKING / CANCELED
//      COOKING         → DONE
//      DONE/CANCELED   → Không cho sửa
//
// Props:
//  - order: KitchenOrderResponse {
//      orderId, orderCode, tableName, createdAt, items: KitchenItemResponse[]
//    }
//  - onChangeStatus(orderItemId, nextStatus)
//  - onCancelItem(orderItemId)
// ============================================================================

import { Card, List, Space, Tag, Button, Typography, Tooltip } from "antd";

const { Text } = Typography;

const STATUS_LABEL_MAP = {
  NEW: "Mới tạo",
  SENT_TO_KITCHEN: "Đã gửi bếp",
  COOKING: "Đang nấu",
  DONE: "Hoàn thành",
  CANCELED: "Đã hủy",
};

const STATUS_COLOR_MAP = {
  NEW: "default",
  SENT_TO_KITCHEN: "processing",
  COOKING: "orange",
  DONE: "green",
  CANCELED: "default",
};

/**
 * Tính các hành động (nút) cho 1 món tùy theo trạng thái hiện tại.
 * ----------------------------------------------------------------
 * - NEW             → Gửi bếp, Hủy món
 * - SENT_TO_KITCHEN → Bắt đầu nấu, Hủy món
 * - COOKING         → Hoàn thành
 * - DONE/CANCELED   → Không có nút
 */
function getActionsForItem(item, onChangeStatus, onCancelItem) {
  const actions = [];
  const { status, orderItemId } = item;

  if (status === "NEW") {
    actions.push(
      <Button
        key="send"
        size="small"
        type="primary"
        onClick={() => onChangeStatus(orderItemId, "SENT_TO_KITCHEN")}
      >
        Gửi bếp
      </Button>
    );
    actions.push(
      <Button
        key="cancel"
        size="small"
        danger
        onClick={() => onCancelItem(orderItemId)}
      >
        Hủy
      </Button>
    );
  } else if (status === "SENT_TO_KITCHEN") {
    actions.push(
      <Button
        key="cook"
        size="small"
        type="primary"
        onClick={() => onChangeStatus(orderItemId, "COOKING")}
      >
        Bắt đầu nấu
      </Button>
    );
    actions.push(
      <Button
        key="cancel"
        size="small"
        danger
        onClick={() => onCancelItem(orderItemId)}
      >
        Hủy
      </Button>
    );
  } else if (status === "COOKING") {
    actions.push(
      <Button
        key="done"
        size="small"
        type="primary"
        onClick={() => onChangeStatus(orderItemId, "DONE")}
      >
        Hoàn thành
      </Button>
    );
  }

  return actions;
}

export default function KitchenOrderCard({
  order,
  onChangeStatus,
  onCancelItem,
}) {
  const { orderId, orderCode, tableName, createdAt, items = [] } = order;

  return (
    <Card
      variant="outlined"
      style={{ marginBottom: 12 }}
      title={
        <Space direction="vertical" size={0}>
          <Text strong>
            Bàn: {tableName || "Không gán bàn"} – Order #{orderCode || orderId}
          </Text>
          <Text type="secondary">
            Thời gian tạo:{" "}
            {createdAt ? new Date(createdAt).toLocaleString() : "-"}
          </Text>
        </Space>
      }
    >
      <List
        dataSource={items}
        renderItem={(item) => {
          const label = STATUS_LABEL_MAP[item.status] || item.status;
          const color = STATUS_COLOR_MAP[item.status] || "default";
          const actions = getActionsForItem(item, onChangeStatus, onCancelItem);

          return (
            <List.Item
              style={{
                alignItems: "flex-start",
              }}
            >
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size={4}
              >
                {/* Dòng 1: tên món + SL + trạng thái */}
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Space>
                    <Text strong>{item.dishName}</Text>
                    <Text>x {item.quantity}</Text>
                  </Space>
                  <Tag color={color}>{label}</Tag>
                </Space>

                {/* Dòng 2: ghi chú (nếu có) + nút hành động */}
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <div style={{ maxWidth: "60%" }}>
                    {item.note && (
                      <Text type="secondary">Ghi chú: {item.note}</Text>
                    )}
                  </div>
                  <Space>{actions}</Space>
                </Space>
              </Space>
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
