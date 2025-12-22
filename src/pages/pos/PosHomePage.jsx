// PosHomePage.jsx – POS Home (Menu lớn cho Tablet/Mobile)
// ======================================================================
// EPIC 4A – POS Home
// Mục tiêu:
//  - Là màn hình chính khi vào mode POS (tablet/mobile)
//  - Cung cấp nút điều hướng lớn: Bàn / Danh sách Order / (tuỳ chọn: Tablet Entry)
//  - Không dính AdminLayout
//
// Rule:
//  - Card dùng variant="borderless" (Rule 29)
//  - Comment tiếng Việt (Rule 13)
// ======================================================================

import { Card, Col, Row, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

export default function PosHomePage() {
  const navigate = useNavigate();

  const items = [
    {
      title: "POS (Bàn)",
      desc: "Chọn bàn → gọi món → gửi bếp → thanh toán",
      path: "/pos/table",
    },
    {
      title: "Danh sách Order",
      desc: "Tìm order → bắt đầu phục vụ → thanh toán",
      path: "/pos/orders",
    },
    // NOTE:
    // Nếu m muốn thêm entry riêng cho tablet (TabletPosEntry) thì bật item này.
    // Hiện tại vẫn đang có route /pos/tablet trong PosRoutes.
    {
      title: "Tablet Entry",
      desc: "Màn vào nhanh cho tablet (nếu cần)",
      path: "/pos/tablet",
    },
  ];

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#f0f2f5" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Title level={3} style={{ marginBottom: 6 }}>
          POS – Menu chính
        </Title>
        <Text type="secondary">
          Chọn chức năng cần thao tác. Giao diện tối ưu cho tablet/mobile.
        </Text>

        <Row gutter={[16, 16]} style={{ marginTop: 18 }}>
          {items.map((it) => (
            <Col key={it.path} xs={24} md={12} lg={8}>
              <Card
                hoverable
                variant="borderless" // ✅ Rule 29
                style={{
                  borderRadius: 12,
                  height: "100%",
                  minHeight: 140,
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => navigate(it.path)}
              >
                <div>
                  <Title level={4} style={{ marginTop: 0 }}>
                    {it.title}
                  </Title>
                  <Text type="secondary">{it.desc}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
