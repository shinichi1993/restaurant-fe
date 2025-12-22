// src/pages/pos/simple/SimplePosOrderPage.jsx
// ============================================================================
// SimplePosOrderPage – Màn gọi món đơn giản cho Simple POS Mode
// ----------------------------------------------------------------------------
// Chức năng chính:
//  - Bên trái: danh sách món (grid card)
//      + Filter theo category (nếu muốn)
//      + Click card / nút "Thêm" → tăng món trong giỏ
//  - Bên phải: giỏ hàng đơn giản
//      + Hiển thị danh sách món đã chọn
//      + Cho phép tăng/giảm số lượng, chỉnh ghi chú
//      + Tính tổng tiền LOCAL (number)
//      + Nút "Tạo đơn & Thanh toán"
//  - Khi bấm "Tạo đơn & Thanh toán":
//      + Gửi payload lên API simpleCreateOrder (BE tạo order + set status phù hợp)
//      + Nhận lại OrderResponse → set vào state currentOrder
//      + Mở PaymentModal (dùng lại component hiện tại)
// ----------------------------------------------------------------------------
// LƯU Ý:
//  - Không dùng OrderPage/PosOrderPage/PosSummaryPage cũ.
//  - Không can thiệp vào logic POS nâng cao/Order update hiện tại.
//  - Chỉ là 1 luồng đơn giản: Chọn món → Tạo order → Thanh toán.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  Segmented,
  Typography,
  Space,
  message,
  Spin,
  Empty,
  InputNumber,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";

import MotionWrapper from "../../../components/common/MotionWrapper";
import { getDishes } from "../../../api/dishApi";
import { simpleCreateOrder } from "../../../api/simplePosApi";
import PaymentModal from "../../../components/payment/PaymentModal";
import { APP_MODE } from "../../../constants/appMode";

const { Text, Title } = Typography;

// ---------------------------------------------------------------------------
// Hàm lấy tên category từ dish (dùng lại logic giống PosOrderPage)
// ---------------------------------------------------------------------------
const getCategoryNameFromDish = (dish) => {
  if (!dish) return "Khác";
  if (dish.categoryName) return dish.categoryName;
  if (dish.category && dish.category.name) return dish.category.name;
  return "Khác";
};

// ---------------------------------------------------------------------------
// Tạo key lineId cho từng dòng trong cart (local only)
// ---------------------------------------------------------------------------
const createLineId = (prefix = "line") =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function SimplePosOrderPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy thông tin bàn từ state (được truyền từ SimplePosTablePage)
  const { tableId = null, tableName = "Simple POS" } = location.state || {};

  // Danh sách món từ BE
  const [dishes, setDishes] = useState([]);
  const [loadingDishes, setLoadingDishes] = useState(false);

  // Giỏ hàng local
  // Mỗi item:
  // {
  //   lineId: string,
  //   dishId: number,
  //   name: string,
  //   price: number,
  //   quantity: number,
  //   note?: string
  // }
  const [cartItems, setCartItems] = useState([]);

  // Filter UI
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");

  // Loading khi gọi simpleCreateOrder
  const [creatingOrder, setCreatingOrder] = useState(false);

  // State cho PaymentModal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // ---------------------------------------------------------------------------
  // 1. Load danh sách món từ BE
  // ---------------------------------------------------------------------------
  const loadDishes = async () => {
    try {
      setLoadingDishes(true);
      const res = await getDishes();
      const data = Array.isArray(res?.data) ? res.data : res;
      setDishes(data || []);
    } catch (err) {
      console.error("Lỗi load danh sách món Simple POS:", err);
      //message.error("Không tải được danh sách món ăn");
    } finally {
      setLoadingDishes(false);
    }
  };

  useEffect(() => {
    loadDishes();
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Tính category options từ dishes
  // ---------------------------------------------------------------------------
  const categoryOptions = useMemo(() => {
    const nameSet = new Set();
    dishes.forEach((d) => {
      const catName = getCategoryNameFromDish(d);
      nameSet.add(catName);
    });
    const list = Array.from(nameSet).sort();
    return list;
  }, [dishes]);

  // ---------------------------------------------------------------------------
  // 3. Lọc món theo category + keyword
  // ---------------------------------------------------------------------------
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (selectedCategory !== "ALL") {
        const catName = getCategoryNameFromDish(dish);
        if (catName !== selectedCategory) return false;
      }

      if (searchKeyword.trim()) {
        const keyword = searchKeyword.trim().toLowerCase();
        const name = (dish.name || "").toLowerCase();
        return name.includes(keyword);
      }

      return true;
    });
  }, [dishes, selectedCategory, searchKeyword]);

  // ---------------------------------------------------------------------------
  // 4. Hàm thêm món vào giỏ
  // ---------------------------------------------------------------------------
  const handleAddDishToCart = (dish) => {
    setCartItems((prev) => {
      // Tìm 1 dòng cùng dishId để cộng dồn quantity
      const idx = prev.findIndex((item) => item.dishId === dish.id);

      if (idx !== -1) {
        return prev.map((item, index) =>
          index === idx
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // Nếu chưa có → tạo dòng mới
      const newItem = {
        lineId: createLineId("new"),
        dishId: dish.id,
        name: dish.name,
        price: Number(dish.price ?? 0),
        quantity: 1,
        note: "",
      };

      return [...prev, newItem];
    });
  };

  // ---------------------------------------------------------------------------
  // 5. Thay đổi số lượng 1 dòng trong giỏ
  // ---------------------------------------------------------------------------
  const handleChangeQuantity = (lineId, qty) => {
    if (qty <= 0) {
      // Quantity 0 → xoá món khỏi giỏ
      setCartItems((prev) =>
        prev.filter((item) => item.lineId !== lineId)
      );
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.lineId === lineId ? { ...item, quantity: qty } : item
      )
    );
  };

  // ---------------------------------------------------------------------------
  // 6. Cập nhật ghi chú 1 dòng trong giỏ
  // ---------------------------------------------------------------------------
  const handleChangeNote = (lineId, note) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.lineId === lineId ? { ...item, note } : item
      )
    );
  };

  // ---------------------------------------------------------------------------
  // 7. Xoá 1 dòng khỏi giỏ
  // ---------------------------------------------------------------------------
  const handleRemoveCartItem = (lineId) => {
    setCartItems((prev) =>
      prev.filter((item) => item.lineId !== lineId)
    );
  };

  // ---------------------------------------------------------------------------
  // 8. Tính tổng tiền local
  // ---------------------------------------------------------------------------
  const totalAmount = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * item.quantity,
      0
    );
  }, [cartItems]);

  // ---------------------------------------------------------------------------
  // 9. Gửi simpleCreateOrder lên BE và mở PaymentModal
  // ---------------------------------------------------------------------------
  const handleCreateOrderAndPay = async () => {
    if (!cartItems.length) {
      message.warning("Chưa có món nào trong giỏ hàng");
      return;
    }

    try {
      setCreatingOrder(true);

      // Chuẩn hoá payload theo SimpleOrderRequest ở BE:
      const payload = {
        // Nếu tableId = null → order không gắn bàn (takeaway)
        tableId: tableId ?? null,
        items: cartItems.map((item) => ({
          dishId: item.dishId,
          quantity: item.quantity,
          note: item.note && item.note.trim()
            ? item.note.trim()
            : null,
        })),
      };

      const res = await simpleCreateOrder(payload);
      const order = res?.data ?? res;

      // Lưu lại order để truyền vào PaymentModal
      setCurrentOrder(order);
      setPaymentModalOpen(true);

      message.success("Tạo order thành công, vui lòng thanh toán.");

    } catch (err) {
      console.error("Lỗi tạo order Simple POS:", err);
      /*message.error(
        err?.response?.data?.message ||
          "Không tạo được order, vui lòng kiểm tra lại."
      );
      */
    } finally {
      setCreatingOrder(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 10. Đóng PaymentModal
  // ---------------------------------------------------------------------------
  const handleClosePaymentModal = () => {
  setPaymentModalOpen(false);
  // Chỉ đóng modal (người dùng bấm X hoặc click outside)
  // Lưu ý: Sau EPIC 2, PaymentModal KHÔNG tự navigate cứng nữa.
  };

  // ---------------------------------------------------------------------------
  // 11. Sau khi thanh toán thành công (POS Simple)
  // ---------------------------------------------------------------------------
  // Mục tiêu:
  //  - Đóng PaymentModal
  //  - Reset giỏ hàng để bán tiếp
  //  - Giữ nguyên tableName (nếu muốn) hoặc có thể navigate về /pos/simple
  const handlePaidSuccess = async () => {
    setPaymentModalOpen(false);
    setCurrentOrder(null);
    setCartItems([]);
    message.success("Thanh toán xong. Sẵn sàng tạo đơn mới.");
  };

  // ---------------------------------------------------------------------------
  // 12. Render
  // ---------------------------------------------------------------------------
  if (loadingDishes) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin tip="Đang tải danh sách món..." />
      </div>
    );
  }

  return (
    <MotionWrapper>
      <Row gutter={[16, 16]}>
        {/* =====================================================================
            CỘT TRÁI – DANH SÁCH MÓN
        ===================================================================== */}
        <Col xs={24} md={14} lg={16}>
          {/* Header + nút quay lại */}
          <Space
            direction="vertical"
            style={{ width: "100%", marginBottom: 8 }}
          >
            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: 16 }}
            >
              <Col>
                <Title level={3} style={{ marginBottom: 4 }}>
                  Simple POS – {tableName}
                </Title>
                <Text type="secondary">
                  Chọn món ở danh sách bên trái, giỏ hàng bên phải. Khi sẵn sàng
                  → bấm "Tạo đơn & Thanh toán".
                </Text>
              </Col>
              <Col>
                <Button
                  type="default"
                  variant="outlined"
                  onClick={() => navigate("/pos/simple")}
                >
                  ← Về chọn bàn Simple POS
                </Button>
              </Col>
            </Row>

            {/* Filter: category + search */}
            <Row justify="space-between" align="middle">
              <Col>
                <Segmented
                  options={[
                    { label: "Tất cả", value: "ALL" },
                    ...categoryOptions.map((name) => ({
                      label: name,
                      value: name,
                    })),
                  ]}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </Col>
              <Col>
                <Input
                  placeholder="Tìm món theo tên..."
                  allowClear
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{ width: 220 }}
                />
              </Col>
            </Row>
          </Space>

          {/* Danh sách món */}
          {filteredDishes.length === 0 ? (
            <Empty
              description="Không có món nào phù hợp"
              style={{ marginTop: 24 }}
            />
          ) : (
            <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
              {filteredDishes.map((dish) => (
                <Col key={dish.id} xs={12} sm={8} md={8} lg={6}>
                  <Card
                    variant="outlined"
                    hoverable
                    style={{ height: "100%" }}
                    onClick={() => handleAddDishToCart(dish)}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          minHeight: 40,
                          lineHeight: 1.2,
                        }}
                      >
                        {dish.name}
                      </div>

                      <div style={{ fontSize: 14 }}>
                        <Text strong>
                          {Number(dish.price ?? 0).toLocaleString("vi-VN")} đ
                        </Text>
                      </div>

                      <Button
                        type="primary"
                        block
                        variant="solid"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddDishToCart(dish);
                        }}
                      >
                        Thêm vào giỏ
                      </Button>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>

        {/* =====================================================================
            CỘT PHẢI – GIỎ HÀNG
        ===================================================================== */}
        <Col xs={24} md={10} lg={8}>
          <Card
            title={`Giỏ hàng – ${tableName}`}
            variant="outlined"
            extra={
              <Text strong>
                Tổng: {totalAmount.toLocaleString("vi-VN")} đ
              </Text>
            }
          >
            {!cartItems.length && (
              <Empty
                description="Chưa có món nào trong giỏ"
                style={{ margin: "16px 0" }}
              />
            )}

            <Space
              direction="vertical"
              style={{ width: "100%" }}
              size={8}
            >
              {cartItems.map((item) => (
                <Card
                  key={item.lineId}
                  size="small"
                  variant="outlined"
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ textAlign: "right" }}>
                      <Text>
                        {Number(item.price).toLocaleString("vi-VN")} đ
                      </Text>
                    </div>
                  </div>

                  {/* Số lượng + nút xoá */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>Số lượng:</span>
                    <InputNumber
                      min={0}
                      value={item.quantity}
                      onChange={(value) =>
                        handleChangeQuantity(
                          item.lineId,
                          Number(value || 0)
                        )
                      }
                    />
                    <Button
                      danger
                      size="small"
                      onClick={() => handleRemoveCartItem(item.lineId)}
                    >
                      Xoá
                    </Button>
                  </div>

                  {/* Ghi chú món */}
                  <Input.TextArea
                    rows={1}
                    placeholder="Ghi chú món (nếu có)..."
                    value={item.note}
                    onChange={(e) =>
                      handleChangeNote(item.lineId, e.target.value)
                    }
                  />
                </Card>
              ))}
            </Space>

            {/* Nút tạo đơn & thanh toán */}
            <Button
              type="primary"
              block
              style={{ marginTop: 16 }}
              variant="solid"
              onClick={handleCreateOrderAndPay}
              disabled={!cartItems.length}
              loading={creatingOrder}
            >
              Tạo đơn & Thanh toán
            </Button>
          </Card>
        </Col>
      </Row>

      {/* PaymentModal – dùng lại component hiện tại */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={handleClosePaymentModal}
        order={currentOrder}
        // Simple POS không cần reloadOrders → truyền null/undefined
        reloadOrders={null}
        // ✅ EPIC 2: POS Simple dùng chung PaymentModal nhưng flow riêng
        contextMode={APP_MODE.POS_SIMPLE}
        onPaidSuccess={handlePaidSuccess}
      />
    </MotionWrapper>
  );
}
