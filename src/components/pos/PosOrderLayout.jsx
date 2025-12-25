// src/components/pos/PosOrderLayout.jsx
// ============================================================================
// PosOrderLayout – Layout UI dùng chung cho POS Order
// ----------------------------------------------------------------------------
// Mục tiêu:
//  - Gom toàn bộ UI POS (header, category, món, giỏ, bottom bar)
//  - KHÔNG chứa logic nghiệp vụ
//  - Dùng chung cho:
//      + SimplePosOrderPage
//      + PosOrderPage (theo bàn)
// ----------------------------------------------------------------------------
// Quy ước:
//  - Page cha chịu trách nhiệm:
//      + load data
//      + xử lý add món, change qty
//      + xử lý checkout
// ============================================================================

import { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  Typography,
  Space,
  Empty,
  Drawer,
  Grid,
} from "antd";

const { Text } = Typography;
const { useBreakpoint } = Grid;

export default function PosOrderLayout({
  // ======================
  // Thông tin chung
  // ======================
  tableName,
  isTakeAway = false,

  // ======================
  // Category
  // ======================
  categories = [],
  selectedCategory,
  onSelectCategory,

  // ======================
  // Danh sách món
  // ======================
  dishes = [],
  onAddDish,

  // ======================
  // Giỏ hàng
  // ======================
  cartItems = [],
  totalAmount = 0,

  renderCartItem, // render riêng CartItem (POS Table)
  onChangeSimpleQty,         // ✅ THÊM
  onRemoveSimpleItem,        // ✅ THÊM
  onCheckout,

}) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Drawer giỏ hàng cho mobile
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Render item cho POS SIMPLE (mobile / drawer)
    const renderSimpleCartItem = (item) => (
    <div
        key={item.lineId}
        style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid #f0f0f0",
        }}
    >
        {/* Thông tin món */}
        <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{item.name}</div>
        <div style={{ fontSize: 13, color: "#888" }}>
            {(item.price * item.quantity).toLocaleString()} đ
        </div>
        </div>

        {/* Điều chỉnh số lượng */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button
            size="small"
            onClick={() => onChangeSimpleQty(item, item.quantity - 1)}
        >
            −
        </Button>

        <span style={{ minWidth: 20, textAlign: "center" }}>
            {item.quantity}
        </span>

        <Button
            size="small"
            onClick={() => onChangeSimpleQty(item, item.quantity + 1)}
        >
            +
        </Button>
        </div>
    </div>
    );

    // ==========================================================
    // Swipe xoá item (POS SIMPLE – Mobile)
    // ==========================================================
    const SwipeableItem = ({ item }) => {
    const [offsetX, setOffsetX] = useState(0);
    const [dragging, setDragging] = useState(false);

    let startX = 0;

    const handleTouchStart = (e) => {
        startX = e.touches[0].clientX;
        setDragging(true);
    };

    const handleTouchMove = (e) => {
        if (!dragging) return;
        const delta = e.touches[0].clientX - startX;
        if (delta < 0) {
            e.preventDefault(); // 🔥 QUAN TRỌNG cho iOS
            setOffsetX(Math.max(delta, -80));
        }
    };

    const handleTouchEnd = () => {
        setDragging(false);
        if (offsetX < -40) {
        onRemoveSimpleItem(item.lineId); // ❌ xoá
        }
        setOffsetX(0);
    };

    return (
        <div
        style={{
            position: "relative",
            overflow: "hidden",
        }}
        >
        {/* Background delete */}
        <div
            style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 80,
            background: "#ff4d4f",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            }}
        >
            Xoá
        </div>

        {/* Foreground */}
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
            transform: `translateX(${offsetX}px)`,
            transition: dragging ? "none" : "transform 0.2s ease",
            background: "#fff",
            }}
        >
            {renderSimpleCartItem(item)}
        </div>
        </div>
    );
    };

    //BADGE SỐ LƯỢNG TRÊN NÚT “THANH TOÁN” (BOTTOM BAR)
    const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
  return (
    <>
      <Row gutter={[16, 16]}>
        {/* =========================================================
            CỘT TRÁI – DANH SÁCH MÓN
        ========================================================= */}
        <Col xs={24} md={15} lg={16}>

          {/* ================= HEADER POS ================= */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{tableName}</div>

            <div
              style={{
                padding: "2px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: isTakeAway ? "#e6f7ff" : "#f6ffed",
                color: isTakeAway ? "#1677ff" : "#389e0d",
              }}
            >
              {isTakeAway ? "Mang đi" : "Tại bàn"}
            </div>
          </div>

          {/* ================= CATEGORY TAB ================= */}
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              marginBottom: 8,
            }}
          >
            <button
              onClick={() => onSelectCategory("ALL")}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "none",
                fontWeight: 600,
                background: selectedCategory === "ALL" ? "#1677ff" : "#f5f5f5",
                color: selectedCategory === "ALL" ? "#fff" : "#333",
              }}
            >
              Tất cả
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "none",
                  fontWeight: 600,
                  background: selectedCategory === cat ? "#1677ff" : "#f5f5f5",
                  color: selectedCategory === cat ? "#fff" : "#333",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ================= DANH SÁCH MÓN ================= */}
          {dishes.length === 0 ? (
            <Empty description="Không có món nào" />
          ) : (
            <Row gutter={[12, 12]}>
              {dishes.map((dish) => (
                <Col key={dish.id} xs={12} sm={8} md={8} lg={6}>
                  <Card
                    hoverable
                    style={{ textAlign: "center", borderRadius: 16 }}
                    onClick={() => onAddDish(dish)}
                  >
                    <div style={{ fontWeight: 700, minHeight: 36 }}>
                      {dish.name}
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fa541c" }}>
                      {Number(dish.price || 0).toLocaleString()} đ
                    </div>

                    <Button
                      type="primary"
                      shape="circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddDish(dish);
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

        {/* =========================================================
            CỘT PHẢI – GIỎ HÀNG (DESKTOP / TABLET)
        ========================================================= */}
        {!isMobile && (
          <Col xs={24} md={9} lg={8}>
            <Card
              title="Giỏ hàng"
              extra={<Text strong>{totalAmount.toLocaleString()} đ</Text>}
            >
              {!cartItems.length && <Empty description="Chưa có món" />}

              <Space direction="vertical" style={{ width: "100%" }}>
                {renderCartItem
                  ? cartItems.map(renderCartItem)
                  : cartItems.map((item) => (
                    <SwipeableItem key={item.lineId} item={item} />
                ))}
              </Space>

              <Button
                type="primary"
                size="large"
                block
                onClick={() => {
                    setCartDrawerOpen(false);
                    onCheckout();
                }}
                style={{ position: "relative" }}
                >
                Thanh toán
                <span
                    style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "#ff4d4f",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    }}
                >
                    {totalQty}
                </span>
                </Button>
            </Card>
          </Col>
        )}
      </Row>

      {/* =========================================================
          BOTTOM BAR – MOBILE
      ========================================================= */}
      {isMobile && cartItems.length > 0 && (
        <div
            style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#fff",
            borderTop: "1px solid #eee",
            padding: 12,
            zIndex: 1000,
            }}
        >
            <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
            >
            {/* LEFT: total */}
            <div>
                <div style={{ fontSize: 13 }}>
                {cartItems.reduce((s, i) => s + i.quantity, 0)} món
                </div>
                <div
                style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#fa541c",
                }}
                >
                {totalAmount.toLocaleString()} đ
                </div>
            </div>

            {/* RIGHT: button + badge */}
            <div style={{ position: "relative" }}>
                <Button
                type="primary"
                size="large"
                onClick={() => setCartDrawerOpen(true)}
                >
                Đặt món
                </Button>

                {/* BADGE */}
                <div
                style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "#ff4d4f",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                >
                {cartItems.reduce((s, i) => s + i.quantity, 0)}
                </div>
            </div>
            </div>
        </div>
        )}

      {/* ================= DRAWER GIỎ HÀNG (MOBILE) ================= */}
      <Drawer
        placement="bottom"
        height="75%"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        title="Giỏ hàng"
        >
        <Space direction="vertical" style={{ width: "100%" }}>
            {cartItems.map((item) => (
            <SwipeableItem key={item.lineId} item={item} />
            ))}

            <Button
            type="primary"
            block
            onClick={() => {
                setCartDrawerOpen(false); // ✅ auto close
                onCheckout();
            }}
            >
            Gửi món/Thanh toán
            </Button>
        </Space>
        </Drawer>
    </>
  );
}
