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
//Detect mobile
import { Grid, Drawer } from "antd";
const { useBreakpoint } = Grid;

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

  // Cho detect mobile
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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

  // Drawer giỏ hàng (mobile)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

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
    // 🔔 Phản hồi ngay khi thêm món (POS-style)
    playAddToCartFeedback();

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

  // ==========================================================
  // FEEDBACK KHI THÊM MÓN (ÂM THANH + RUNG)
  // ----------------------------------------------------------
  // - Mobile: rung nhẹ nếu trình duyệt hỗ trợ
  // - Desktop: phát âm thanh "ting"
  // ==========================================================
  const playAddToCartFeedback = () => {
    try {
      // 1️⃣ RUNG (HAPTIC) – Mobile (iOS / Android)
      if (navigator.vibrate) {
        // Rung rất nhẹ, tránh gây khó chịu
        navigator.vibrate(30);
      }

      // 2️⃣ ÂM THANH – Desktop / Mobile
      const audio = new Audio("/sounds/Bubble-Poof-Pop.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {
        // Một số trình duyệt chặn auto-play → bỏ qua
      });
    } catch (e) {
      // Không làm crash UI nếu thiết bị không hỗ trợ
    }
  };

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
            {/* =========================================================
                HEADER POS – TỐI GIẢN (MOBILE FIRST)
            ========================================================= */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              {/* Nút quay lại – icon style */}
              <Button
                type="text"
                onClick={() => navigate("/pos/simple")}
                style={{
                  fontSize: 18,
                  padding: "0 8px",
                }}
              >
                ←
              </Button>

              {/* Tên bàn / Mang đi */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  {tableName}
                </div>

                {/* Badge trạng thái */}
                <div
                  style={{
                    display: "inline-block",
                    marginTop: 4,
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    background:
                      tableId == null ? "#e6f7ff" : "#f6ffed",
                    color:
                      tableId == null ? "#1677ff" : "#389e0d",
                  }}
                >
                  {tableId == null ? "Mang đi" : "Tại bàn"}
                </div>
              </div>
            </div>

            {/* Filter: category + search */}
            <Row justify="space-between" align="middle">
              <Col>
                {/* =========================================================
                    TAB CATEGORY – KIỂU POS (SCROLL NGANG – MOBILE FRIENDLY)
                ========================================================= */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    overflowX: "auto",
                    paddingBottom: 4,
                    marginBottom: 8,
                  }}
                >
                  {/* Tab "Tất cả" */}
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    style={{
                      flex: "0 0 auto",
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: "none",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      background:
                        selectedCategory === "ALL" ? "#1677ff" : "#f5f5f5",
                      color:
                        selectedCategory === "ALL" ? "#fff" : "#333",
                      boxShadow:
                        selectedCategory === "ALL"
                          ? "0 2px 6px rgba(22,119,255,0.4)"
                          : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Tất cả
                  </button>

                  {/* Các category khác */}
                  {categoryOptions.map((name) => {
                    const active = selectedCategory === name;

                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedCategory(name)}
                        style={{
                          flex: "0 0 auto",
                          padding: "8px 14px",
                          borderRadius: 999,
                          border: "none",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: active ? "#1677ff" : "#f5f5f5",
                          color: active ? "#fff" : "#333",
                          boxShadow: active
                            ? "0 2px 6px rgba(22,119,255,0.4)"
                            : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
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
                  {/* =========================================================
                      CARD MÓN – KIỂU POS (MOBILE / TABLET)
                      - Bấm cả card để thêm món
                      - Giá nổi bật
                      - Nút + là hành động chính
                  ========================================================= */}
                  <Card
                    hoverable
                    variant="outlined"
                    style={{
                      height: "100%",
                      borderRadius: 16,
                      textAlign: "center",
                      transition: "all 0.15s ease",
                      userSelect: "none",
                    }}
                    onClick={() => handleAddDishToCart(dish)}
                    onMouseDown={(e) => {
                      // Hiệu ứng nhấn (mobile / tablet)
                      e.currentTarget.style.transform = "scale(0.96)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.12)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Tên món – gọn, tối đa 2 dòng */}
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        lineHeight: 1.2,
                        minHeight: 36,
                        marginBottom: 8,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {dish.name}
                    </div>

                    {/* Giá – điểm nhấn chính */}
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#fa541c",
                        marginBottom: 12,
                      }}
                    >
                      {Number(dish.price ?? 0).toLocaleString("vi-VN")} đ
                    </div>

                    {/* Nút + thêm món */}
                    <Button
                      type="primary"
                      shape="circle"
                      size="large"
                      onClick={(e) => {
                        // Chặn click lan ra card
                        e.stopPropagation();
                        handleAddDishToCart(dish);
                      }}
                    >
                      +
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>

        {/* =====================================================================
            CỘT PHẢI – GIỎ HÀNG
        ===================================================================== */}
        {!isMobile && (
        <Col xs={24} md={10} lg={8}>
          <Card
            title={`Giỏ hàng – ${tableName}`}
            variant="outlined"
            style={{
              position: "sticky",
              top: 80,
              borderRadius: 16,
            }}
            extra={
              <Text
                strong
                style={{ fontSize: 18, color: "#fa541c" }}
              >
                {totalAmount.toLocaleString("vi-VN")} đ
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
                      marginTop: 8,
                    }}
                  >
                    <Space>
                      <Button
                        size="large"
                        onClick={() => {
                          playAddToCartFeedback();
                          handleChangeQuantity(item.lineId, item.quantity - 1);
                        }}
                      >
                        −
                      </Button>

                      <Text strong style={{ fontSize: 16 }}>
                        {item.quantity}
                      </Text>

                      <Button
                        size="large"
                        onClick={() => {
                          playAddToCartFeedback();
                          handleChangeQuantity(item.lineId, item.quantity + 1)
                        }}
                      >
                        +
                      </Button>
                    </Space>

                    <Button
                      danger
                      size="large"
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
              size="large"
              block
              style={{
                marginTop: 16,
                height: 56,
                fontSize: 18,
                fontWeight: 700,
              }}
              onClick={handleCreateOrderAndPay}
              disabled={!cartItems.length}
              loading={creatingOrder}
            >
              Tạo đơn & Thanh toán
            </Button>
          </Card>
        </Col>
        )}
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
      {/* =========================================================
          BOTTOM BAR – GIỎ HÀNG (MOBILE ONLY)
      ========================================================= */}
      {isMobile && cartItems.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            background: "#fff",
            borderTop: "1px solid #eee",
            padding: "10px 12px",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {/* Tổng món + tiền */}
            <div>
              <div style={{ fontSize: 13, color: "#666" }}>
                {cartItems.reduce((sum, i) => sum + i.quantity, 0)} món
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#fa541c",
                }}
              >
                {totalAmount.toLocaleString("vi-VN")} đ
              </div>
            </div>

            {/* Nút mở giỏ / thanh toán */}
            <Button
              type="primary"
              size="large"
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                padding: "0 24px",
              }}
              onClick={() => setCartDrawerOpen(true)}
            >
              Thanh toán
            </Button>
          </div>
        </div>
      )}
      {/* =========================================================
          DRAWER GIỎ HÀNG – MOBILE
      ========================================================= */}
      <Drawer
        placement="bottom"
        height="75%"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        title={`Giỏ hàng – ${tableName}`}
      >
        {!cartItems.length ? (
          <Empty description="Chưa có món nào trong giỏ" />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            {cartItems.map((item) => (
              <Card key={item.lineId} size="small">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text strong>{item.name}</Text>
                  <Text>
                    {Number(item.price).toLocaleString("vi-VN")} đ
                  </Text>
                </div>

                {/* + / - số lượng */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Space>
                    <Button
                      onClick={() => {
                        playAddToCartFeedback();
                        handleChangeQuantity(item.lineId, item.quantity - 1)
                      }}
                    >
                      −
                    </Button>

                    <Text strong style={{ fontSize: 16 }}>
                      {item.quantity}
                    </Text>

                    <Button
                      onClick={() => {
                        playAddToCartFeedback();
                        handleChangeQuantity(item.lineId, item.quantity + 1)
                      }}
                    >
                      +
                    </Button>
                  </Space>

                  <Button
                    danger
                    onClick={() => handleRemoveCartItem(item.lineId)}
                  >
                    Xoá
                  </Button>
                </div>

                {/* Ghi chú */}
                <Input.TextArea
                  rows={1}
                  placeholder="Ghi chú món (nếu có)..."
                  value={item.note}
                  onChange={(e) =>
                    handleChangeNote(item.lineId, e.target.value)
                  }
                  style={{ marginTop: 8 }}
                />
              </Card>
            ))}

            {/* Tổng + CTA */}
            <div
              style={{
                marginTop: 12,
                borderTop: "1px solid #eee",
                paddingTop: 12,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fa541c",
                  marginBottom: 12,
                }}
              >
                Tổng: {totalAmount.toLocaleString("vi-VN")} đ
              </div>

              <Button
                type="primary"
                size="large"
                block
                loading={creatingOrder}
                onClick={() => {
                  setCartDrawerOpen(false);
                  handleCreateOrderAndPay();
                }}
              >
                Tạo đơn & Thanh toán
              </Button>
            </div>
          </Space>
        )}
      </Drawer>
    </MotionWrapper>
  );
}
