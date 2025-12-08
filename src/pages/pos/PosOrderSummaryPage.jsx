// src/pages/pos/PosOrderSummaryPage.jsx
// ---------------------------------------------------------------------
// PosOrderSummaryPage – Trang xác nhận order cuối cùng
//
// Chức năng:
//  - Hiển thị danh sách món đã chọn (cartItems) sau khi GỘP theo dishId
//  - Tính tổng tiền
//  - Nếu orderId != null → cập nhật order đang mở (PUT /api/orders/{id})
//  - Nếu orderId == null → tạo order mới (POST /api/orders)
//  - Sau khi gửi thành công → quay về danh sách bàn (/pos/table)
//
// Lưu ý Option 1 + Case A:
//  - Ở PosOrderPage, FE đã:
//      + Khóa không cho giảm quantity món có item locked
//      + Chỉ cho gọi thêm món (tăng quantity tổng)
//  - Vì vậy ở đây chỉ cần:
//      + Gộp quantity theo dishId
//      + Không cần tách lockedQty / editableQty nữa
//  - FE gửi payload items đã GỘP theo dishId:
//        [{ dishId, quantity, note }]
//    → BE dùng tổng quantity để tính phần chênh lệch (create thêm NEW item)
// ---------------------------------------------------------------------

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, List, Button, message, Empty } from "antd";

import { createOrder, updateOrderItems } from "../../api/orderApi";

import MotionWrapper from "../../components/common/MotionWrapper";

// ------------------------------------------------------------
// Hàm gộp cart theo dishId
//  - Nếu có nhiều dòng cùng dishId → cộng dồn quantity
//  - note: lấy ghi chú cuối cùng không rỗng (nếu có)
//  - Không quan tâm status tại đây vì Case A đã được xử lý ở màn trước
// ------------------------------------------------------------
function aggregateCartItems(cartItems = []) {
  const map = {};

  cartItems.forEach((item) => {
    const key = item.dishId;
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 0);

    if (!map[key]) {
      map[key] = {
        dishId: item.dishId,
        name: item.name,
        price,
        quantity: 0,
        note: null,
      };
    }

    map[key].quantity += quantity;

    if (item.note && item.note.trim()) {
      map[key].note = item.note.trim();
    }
  });

  return Object.values(map);
}

const PosOrderSummaryPage = () => {
  const { tableId } = useParams(); // lấy id bàn từ URL

  const navigate = useNavigate();
  const location = useLocation();

  // Lấy dữ liệu được truyền từ PosOrderPage
  const { cartItems = [], orderId = null, tableName } = location.state || {};

  // Gộp món theo dishId (theo rule ở trên)
  const aggregatedItems = aggregateCartItems(cartItems);

  // Tính tổng tiền
  const totalAmount = aggregatedItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  // ---------------------------------------------------------------------
  // Hàm gửi order lên backend
  // ---------------------------------------------------------------------
  const handleSubmitOrder = async () => {
    if (!aggregatedItems.length) {
      message.warning("Không có món nào để gửi order");
      return;
    }

    try {
      // Chuẩn bị payload chuẩn theo DTO backend (OrderItemRequest có cả note)
      const payload = {
        tableId: Number(tableId),
        items: aggregatedItems.map((item) => ({
          dishId: item.dishId,
          quantity: item.quantity,
          note: item.note || null,
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
          items: payload.items, // update không cần tableId
        });
        message.success("Cập nhật order thành công");
      }

      // -----------------------------------------------------------
      // 3️⃣ Điều hướng về trang danh sách bàn POS
      // -----------------------------------------------------------
      navigate("/pos/table");
    } catch (error) {
      console.error("Lỗi gửi order:", error);
      //message.error("Gửi order thất bại, vui lòng kiểm tra lại");
    }
  };

  const displayTableName = tableName || `Bàn ${tableId}`;

  // ---------------------------------------------------------------------
  // Render UI
  // ---------------------------------------------------------------------
  return (
    <MotionWrapper>
      <Card
        variant="outlined"
        title={`Xác nhận Order – ${displayTableName}`}
        extra={
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            Tổng: {totalAmount.toLocaleString()} đ
          </div>
        }
      >
        {/* Danh sách món đã chọn */}
        {aggregatedItems.length === 0 ? (
          <Empty description="Không có món nào trong order" />
        ) : (
          <List
            dataSource={aggregatedItems}
            renderItem={(item) => (
              <List.Item>
                {/* Tên món */}
                <div style={{ flex: 1, fontWeight: 500 }}>{item.name}</div>

                {/* Số lượng */}
                <div style={{ width: 60, textAlign: "right" }}>
                  x {item.quantity}
                </div>

                {/* Thành tiền */}
                <div
                  style={{
                    width: 120,
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {(item.price * item.quantity).toLocaleString()} đ
                </div>
              </List.Item>
            )}
          />
        )}

        {/* Nhóm nút cuối trang */}
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          {/* Nút quay lại trang Order */}
          <Button
            block
            variant="outlined"
            onClick={() =>
              navigate(`/pos/table/${tableId}/order`, {
                state: { fromSummary: true, tableName: displayTableName },
              })
            }
          >
            Quay lại chỉnh sửa
          </Button>

          {/* Nút gửi order */}
          <Button
            type="primary"
            block
            variant="solid"
            onClick={handleSubmitOrder}
            disabled={!aggregatedItems.length}
          >
            Gửi Order
          </Button>
        </div>
      </Card>
    </MotionWrapper>
  );
};

export default PosOrderSummaryPage;
