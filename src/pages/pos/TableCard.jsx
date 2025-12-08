// src/components/pos/TableCard.jsx
// --------------------------------------------------------------
// TableCard – Card hiển thị 1 bàn trên màn hình POS TABLE
// Thể hiện:
//  - Tên bàn
//  - Trạng thái (màu)
//  - Mã order nếu có
//  - Thống kê món: NEW / SENT_TO_KITCHEN+COOKING / DONE
//  - Thời gian từ lúc order tạo
// --------------------------------------------------------------

import { Card, Tag, Badge } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const statusColorMap = {
  AVAILABLE: "green",
  OCCUPIED: "orange",
  DISABLED: "red",
  MERGED: "blue",
};

export default function TableCard({ data, onClick }) {
  // data = 1 object PosTableStatusResponse
  const {
    tableName,
    status,
    orderCode,
    orderCreatedAt,
    totalItems,
    newItems,
    cookingItems,
    doneItems,
    waitingForPayment,
  } = data;

  return (
    <Card
      hoverable
      onClick={onClick}
      variant="outlined"
      style={{
        minHeight: 140,
        cursor: status === "DISABLED" ? "not-allowed" : "pointer",
        opacity: status === "DISABLED" ? 0.6 : 1,
      }}
    >
      {/* Tên bàn */}
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
        {tableName}
      </div>

      {/* Trạng thái bàn */}
      <Tag color={statusColorMap[status] || "default"}>
        {status}
      </Tag>

      {/* Nếu đang chờ thanh toán → tô nhãn nhỏ */}
      {waitingForPayment && (
        <Tag color="gold" style={{ marginLeft: 8 }}>
          Đang chờ thanh toán
        </Tag>
      )}

      {/* Thông tin order nếu có */}
      {orderCode && (
        <div style={{ marginTop: 8 }}>
          <strong>Order:</strong> {orderCode}
        </div>
      )}

      {/* Badge món nếu có item */}
      {totalItems > 0 && (
        <div style={{ marginTop: 8 }}>
          <Badge
            count={newItems}
            title="Món mới (NEW)"
            style={{ backgroundColor: "#52c41a", marginRight: 8 }}
          />
          <Badge
            count={cookingItems}
            title="Món đã gửi bếp / đang nấu"
            style={{ backgroundColor: "#1890ff", marginRight: 8 }}
          />
          <Badge
            count={doneItems}
            title="Món đã hoàn thành"
            style={{ backgroundColor: "#faad14" }}
          />
        </div>
      )}

      {/* Thời gian order */}
      {orderCreatedAt && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#888" }}>
          {dayjs(orderCreatedAt).fromNow()}
        </div>
      )}
    </Card>
  );
}
