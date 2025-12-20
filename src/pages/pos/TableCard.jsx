// src/components/pos/TableCard.jsx
// --------------------------------------------------------------
// TableCard – Card hiển thị 1 bàn trong POS TABLE, UI nâng cấp 5 tính năng:
// 1. UI đẹp chuẩn POS nhà hàng (layout + typography + spacing)
// 2. Thêm icon ghế / số người (seatCount nếu BE có, fallback = ...)
// 3. Màu sắc trạng thái chuyên nghiệp (pastel + readable)
// 4. Hover animation (scale + shadow) theo Rule 27
// 5. Đồng hồ cảnh báo thời gian phục vụ theo mốc 15p / 30p
// --------------------------------------------------------------

import { Card } from "antd";
import {
  UsergroupAddOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

// --------------------------------------------
// 1) Màu custom đẹp hơn cho POS
// --------------------------------------------
const STATUS_STYLE = {
  AVAILABLE: { bg: "#DFFFE2", text: "#1A8F3A", label: "Đang trống" },
  OCCUPIED: { bg: "#FFE7C2", text: "#AA6100", label: "Đang phục vụ" },
  DISABLED: { bg: "#F5D9D9", text: "#A60505", label: "Tạm ngưng" },
  MERGED: { bg: "#DCEBFF", text: "#185ADB", label: "Đã gộp bàn" },
};

// --------------------------------------------
// 2) Hàm xác định màu thời gian phục vụ
//    < 15 phút  → xanh
//    15–30 phút → cam
//    > 30 phút  → đỏ
// --------------------------------------------
const getTimeColor = (minutes) => {
  if (minutes < 15) return "#1A8F3A"; // xanh
  if (minutes < 30) return "#D47A00"; // cam
  return "#C00000";                  // đỏ
};

export default function TableCard({ data, onClick, isTablet = false }) {
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

    // seatCount nếu BE có, fallback = null
    capacity,
  } = data;

  const statusInfo = STATUS_STYLE[status] || {
    bg: "#EEE",
    text: "#555",
    label: status,
  };

  // --------------------------------------------
  // Tính thời gian phục vụ
  // --------------------------------------------
  let minutes = null;
  if (orderCreatedAt) {
    minutes = dayjs().diff(orderCreatedAt, "minute");
  }

  return (
    <Card
      onClick={onClick}
      style={{
        borderRadius: isTablet ? 18 : 14,
        padding: isTablet ? 20 : 12,
        cursor: status === "DISABLED" ? "not-allowed" : "pointer",
        opacity: status === "DISABLED" ? 0.55 : 1,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        transition: "all 0.2s ease",
      }}
      // Hover animation
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.025)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
      }}
    >
      {/* -------------------------------------- */}
      {/* 1) Header: Tên bàn + Icon ghế */}
      {/* -------------------------------------- */}
      <div
        style={{
          fontSize: isTablet ? 24 : 20,
          fontWeight: 700,
          marginBottom: isTablet ? 10 : 6,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {tableName}

        {/* Icon ghế (nếu có seatCount) */}
        {capacity ? (
          <span style={{ fontSize: 14, opacity: 0.75 }}>
            <UsergroupAddOutlined /> {capacity}
          </span>
        ) : (
          <span style={{ fontSize: 14, opacity: 0.5 }}>
            <UsergroupAddOutlined /> …
          </span>
        )}
      </div>

      {/* -------------------------------------- */}
      {/* 2) Trạng thái bàn (màu pastel) */}
      {/* -------------------------------------- */}
      <div
        style={{
          background: statusInfo.bg,
          color: statusInfo.text,
          fontWeight: 600,
          padding: "3px 10px",
          borderRadius: 6,
          display: "inline-block",
          marginBottom: 6,
          fontSize: isTablet ? 15 : 13,
        }}
      >
        {statusInfo.label}
      </div>

      {/* Tag chờ thanh toán */}
      {waitingForPayment && (
        <div
          style={{
            marginLeft: 8,
            display: "inline-block",
            background: "#FFF3C4",
            color: "#9A6B00",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          Đang chờ thanh toán
        </div>
      )}

      {/* -------------------------------------- */}
      {/* 3) Order code */}
      {/* -------------------------------------- */}
      {orderCode && (
        <div
          style={{
            marginTop: isTablet ? 12 : 8,
            fontSize: isTablet ? 16 : 14,
            fontWeight: 600,
          }}
        >
          Order:{" "}
          <span style={{ fontWeight: 500, opacity: 0.85 }}>{orderCode}</span>
        </div>
      )}

      {/* -------------------------------------- */}
      {/* 4) Thống kê món (mới / nấu / xong) */}
      {/* -------------------------------------- */}
      {totalItems > 0 && (
        <div
          style={{
            marginTop: isTablet ? 10 : 6,
            fontSize: isTablet ? 15 : 13,
          }}
        >
          <span style={{ color: "#1A8F3A" }}>
            Mới: <b>{newItems}</b>
          </span>

          {"  •  "}

          <span style={{ color: "#185ADB" }}>
            Đang nấu: <b>{cookingItems}</b>
          </span>

          {"  •  "}

          <span style={{ color: "#D47A00" }}>
            Xong: <b>{doneItems}</b>
          </span>
        </div>
      )}

      {/* -------------------------------------- */}
      {/* 5) Đồng hồ cảnh báo thời gian phục vụ */}
      {/* -------------------------------------- */}
      {minutes !== null && (
        <div
          style={{
            marginTop: 10,
            fontSize: isTablet ? 15 : 13,
            fontWeight: 600,
            color: getTimeColor(minutes),
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FieldTimeOutlined />
          {minutes} phút
        </div>
      )}
    </Card>
  );
}
