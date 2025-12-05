// src/pages/pos/PosOrderSummaryPage.jsx
// ---------------------------------------------------------------------
// PosOrderSummaryPage – Trang xác nhận order cuối cùng
//
// Chức năng:
//  - Hiển thị danh sách món đã chọn (cartItems)
//  - Tính tổng tiền
//  - Nếu orderId != null → cập nhật order đang mở (PUT)
//  - Nếu orderId == null → tạo order mới (POST)
//  - Sau khi gửi thành công → quay về danh sách bàn (/pos/table)
//
// Lưu ý:
//  - Dữ liệu cartItems & orderId được truyền qua react-router state
//    => Không gọi lại API món ở đây
// ---------------------------------------------------------------------

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, List, Button, message } from "antd";

// TODO: sửa import theo api project của bạn
import { createOrder, updateOrderItems } from "../../api/orderApi";

import MotionWrapper from "../../components/common/MotionWrapper";

const PosOrderSummaryPage = () => {
  const { tableId } = useParams(); // lấy id bàn từ URL

  const navigate = useNavigate();
  const location = useLocation();

  // Lấy dữ liệu được truyền từ PosOrderPage
  const { cartItems = [], orderId = null } = location.state || {};

  // ---------------------------------------------------------------------
  // Tính tổng tiền
  // ---------------------------------------------------------------------
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  // ---------------------------------------------------------------------
  // Hàm gửi order lên backend
  // ---------------------------------------------------------------------
  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) {
      message.warning("Không có món nào để gửi order");
      return;
    }

    try {
      // Chuẩn bị payload chuẩn theo DTO backend
      const payload = {
        tableId: Number(tableId),
        items: cartItems.map((item) => ({
          dishId: item.dishId,
          quantity: item.quantity,
        })),
      };

      if (!orderId) {
        // -----------------------------------------------------------
        // 1️⃣ Trường hợp bàn chưa có order → Tạo order mới
        // -----------------------------------------------------------
        await createOrder(payload);

        message.success("Tạo order mới thành công");
      } else {
        // -----------------------------------------------------------
        // 2️⃣ Trường hợp bàn đã có order đang phục vụ → Update order
        // -----------------------------------------------------------
        await updateOrderItems(orderId, {
          items: payload.items, // thường update không cần tableId
        });

        message.success("Cập nhật order thành công");
      }

      // -----------------------------------------------------------
      // 3️⃣ Điều hướng về trang danh sách bàn POS
      // -----------------------------------------------------------
      navigate("/pos/table");
    } catch (error) {
      console.error("Lỗi gửi order:", error);
      message.error("Gửi order thất bại, vui lòng thử lại");
    }
  };

  // ---------------------------------------------------------------------
  // Render UI
  // ---------------------------------------------------------------------
  return (
    <MotionWrapper>
    <>
        <Card
        variant="outlined"
        title={`Xác nhận Order – Bàn ${tableId}`}
        extra={<div style={{ fontSize: 18, fontWeight: 600 }}>
            Tổng: {totalAmount.toLocaleString()} đ
        </div>}
        >
        {/* Danh sách món đã chọn */}
        <List
            dataSource={cartItems}
            renderItem={(item) => (
            <List.Item>
                {/* Tên món */}
                <div style={{ flex: 1, fontWeight: 500 }}>{item.name}</div>

                {/* Số lượng */}
                <div style={{ width: 60, textAlign: "right" }}>
                x {item.quantity}
                </div>

                {/* Thành tiền */}
                <div style={{ width: 120, textAlign: "right", fontWeight: 600 }}>
                {(item.price * item.quantity).toLocaleString()} đ
                </div>
            </List.Item>
            )}
        />

        {/* Nhóm nút cuối trang */}
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            {/* Nút quay lại trang Order */}
            <Button
            block
            variant="outlined"
            onClick={() => navigate(`/pos/table/${tableId}/order`, { state: { fromSummary: true } })}
            >
            Quay lại chỉnh sửa
            </Button>

            {/* Nút gửi order */}
            <Button
            type="primary"
            block
            variant="solid"
            onClick={handleSubmitOrder}
            >
            Gửi Order
            </Button>
        </div>
        </Card>
    </>
    </MotionWrapper>
  );
};

export default PosOrderSummaryPage;
