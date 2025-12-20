// src/pages/pos/PosOrderSummaryPage.jsx
// ============================================================================
// PosOrderSummaryPage – XÁC NHẬN ORDER (POS CHUẨN – TABLET UI)
// ----------------------------------------------------------------------------
// Chức năng:
//  - Hiển thị danh sách món đã chọn (gộp theo dishId)
//  - Hiển thị tổng tiền lớn, rõ ràng cho nhân viên xác nhận
//  - Cho phép:
//      + Quay lại chỉnh sửa order
//      + Gửi order (POST / PUT)
//  - KHÔNG thanh toán tại đây (POS chuẩn)
// ----------------------------------------------------------------------------
// Điều hướng:
//  - Thành công → /pos/table
// ============================================================================

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Row, Col, Card, Button, List, Typography, Divider, Empty, message } from "antd";
import MotionWrapper from "../../components/common/MotionWrapper";
import { createOrder, updateOrderItems } from "../../api/orderApi";

const { Title, Text } = Typography;

// ------------------------------------------------------------
// Gộp cartItems theo dishId
// ------------------------------------------------------------
const aggregateCartItems = (cartItems = []) => {
  const map = {};

  cartItems.forEach((item) => {
    if (!map[item.dishId]) {
      map[item.dishId] = {
        dishId: item.dishId,
        name: item.name,
        price: Number(item.price || 0),
        quantity: 0,
      };
    }
    map[item.dishId].quantity += Number(item.quantity || 0);
  });

  return Object.values(map);
};

export default function PosOrderSummaryPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { cartItems = [], orderId = null, tableName } = location.state || {};

  const items = aggregateCartItems(cartItems);

  const totalAmount = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  // ------------------------------------------------------------
  // Gửi order lên BE
  // ------------------------------------------------------------
  const handleSubmitOrder = async () => {
    if (!items.length) {
      message.warning("Không có món nào để gửi order");
      return;
    }

    try {
      const payload = {
        tableId: Number(tableId),
        items: items.map((i) => ({
          dishId: i.dishId,
          quantity: i.quantity,
        })),
      };

      if (!orderId) {
        await createOrder(payload);
        message.success("Tạo order thành công");
      } else {
        await updateOrderItems(orderId, { items: payload.items });
        message.success("Cập nhật order thành công");
      }

      navigate("/pos/table");
    } catch (err) {
      console.error(err);
      message.error("Gửi order thất bại");
    }
  };

  return (
    <MotionWrapper>
      <Row gutter={24}>
        {/* =====================================================
            CỘT TRÁI – DANH SÁCH MÓN
        ===================================================== */}
        <Col xs={24} lg={16}>
          <Card
            title={<Title level={4}>Xác nhận Order – {tableName}</Title>}
            variant="outlined"
          >
            {items.length === 0 ? (
              <Empty description="Không có món nào trong order" />
            ) : (
              <List
                dataSource={items}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ flex: 1, fontWeight: 500 }}>
                      {item.name}
                    </div>
                    <div style={{ width: 80, textAlign: "center" }}>
                      x {item.quantity}
                    </div>
                    <div style={{ width: 120, textAlign: "right", fontWeight: 600 }}>
                      {(item.price * item.quantity).toLocaleString()} đ
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* =====================================================
            CỘT PHẢI – TỔNG KẾT + CTA
        ===================================================== */}
        <Col xs={24} lg={8}>
          <Card
            variant="outlined"
            style={{
              position: "sticky",
              top: 16,
            }}
          >
            <Title level={3} style={{ marginBottom: 0 }}>
              Tổng cộng
            </Title>

            <Text type="secondary">
              {items.length} món
            </Text>

            <Divider />

            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#d4380d",
                textAlign: "center",
              }}
            >
              {totalAmount.toLocaleString()} đ
            </div>

            <Divider />

            <Button
              block
              variant="outlined"
              style={{ marginBottom: 12 }}
              onClick={() =>
                navigate(`/pos/table/${tableId}/order`, {
                  state: { tableName },
                })
              }
            >
              ← Quay lại chỉnh sửa
            </Button>

            <Button
              block
              type="primary"
              size="large"
              variant="solid"
              onClick={handleSubmitOrder}
            >
              Gửi Order
            </Button>
          </Card>
        </Col>
      </Row>
    </MotionWrapper>
  );
}
