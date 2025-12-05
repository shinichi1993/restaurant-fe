// @ts-nocheck
// AppFooter.jsx – Footer chung của hệ thống
// - UI đơn giản, gọn, đồng bộ theo Rule 27
// - Dùng trong AdminLayout.jsx, không dùng trong Page (Rule 14)

import { Typography } from "antd";

const { Text } = Typography;

export default function AppFooter() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "12px 0",
        color: "rgba(0,0,0,0.45)",
        fontSize: 13,
      }}
    >
      <Text type="secondary">
        © {new Date().getFullYear()} Quản lý nhà hàng – Powered by POS System
      </Text>
    </div>
  );
}
