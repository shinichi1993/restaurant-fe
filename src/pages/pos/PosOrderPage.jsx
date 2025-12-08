// src/pages/pos/PosOrderPage.jsx
// ============================================================================
// PosOrderPage – Màn hình gọi món cho 1 bàn (POS Tablet - Layout hiện đại)
// ----------------------------------------------------------------------------
// Chức năng chính:
//  - Bên trái:
//      + Hiển thị danh sách món dạng card (grid 3–4 cột, dễ bấm)
//      + Filter theo "nhóm" (category) nếu có dữ liệu category trong Dish
//      + Tìm kiếm theo tên món
//  - Bên phải:
//      + Hiển thị giỏ hàng (cart) hiện tại của bàn
//      + Cho tăng/giảm số lượng, ghi chú, xoá món (CHỈ sửa LOCAL, chưa gọi BE)
//      + Tính tổng tiền theo Rule 26 (giá BigDecimal → FE number)
//      + Nút "Tiếp tục" → chuyển sang màn PosOrderSummaryPage
//
// Dữ liệu sử dụng:
//  - API món ăn: getDishes() từ dishApi
//  - API order theo bàn: getOrderByTableId(tableId) từ orderApi
//      → Nếu bàn đã có order mở (NEW/SERVING) → load món vào cart
//      → Nếu chưa có → cart rỗng, orderId = null
//
// Lưu ý Option 1 (POS + Case A):
//  - TRÊN MÀN HÌNH NÀY KHÔNG GỌI POST/PUT order
//  - Tất cả thay đổi cart chỉ là state tạm thời
//  - Khi bấm "Gửi Order" ở màn Summary mới gửi payload lên BE
//  - Quy tắc khóa theo Case A:
//      + Nếu 1 món có bất kỳ item ở trạng thái
//          SENT_TO_KITCHEN / COOKING / DONE
//        → TOÀN BỘ dòng của món đó (kể cả NEW) bị khóa (không sửa/xóa)
//      + Chỉ cho phép GỌI THÊM (add món) cho dishId đó
//      + FE đảm bảo không gửi newQty < currentTotalQty cho món có item locked
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { getDishes } from "../../api/dishApi";
import { getOrderByTableId } from "../../api/orderApi";

import MotionWrapper from "../../components/common/MotionWrapper";
import CartItem from "./CartItem";

const { Text } = Typography;

// ------------------------------------------------------------
// Hàm hỗ trợ: lấy tên nhóm (category) từ record món
// ------------------------------------------------------------
const getCategoryNameFromDish = (dish) => {
  if (!dish) return "Khác";
  if (dish.categoryName) return dish.categoryName;
  if (dish.category && dish.category.name) return dish.category.name;
  return "Khác";
};

// ------------------------------------------------------------
// Hàm tạo key local cho từng dòng cart
//  - Dùng để phân biệt các dòng có cùng dishId
//  - Không phụ thuộc vào id trên BE
// ------------------------------------------------------------
const createLineId = (prefix = "line") =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function PosOrderPage() {
  // Lấy tableId từ URL: /pos/table/:tableId/order
  const { tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Nếu từ PosTablePage truyền state { tableName } thì dùng, không thì fallback
  const tableName = location.state?.tableName || `Bàn ${tableId}`;

  // ------------------------------------------------------------
  // STATE CHÍNH
  // ------------------------------------------------------------
  const [dishes, setDishes] = useState([]); // Danh sách món từ BE
  const [loadingDishes, setLoadingDishes] = useState(false);

  const [orderId, setOrderId] = useState(null); // Nếu bàn đã có order → lưu id

  /**
   * cartItems – danh sách món hiển thị ở cột phải
   * Mỗi phần tử:
   *  {
   *    lineId: string   // key local, duy nhất cho từng dòng
   *    dishId: number
   *    name: string
   *    price: number
   *    quantity: number
   *    note: string
   *    status: "NEW" | "SENT_TO_KITCHEN" | "COOKING" | "DONE" | "CANCELED"
   *  }
   */
  const [cartItems, setCartItems] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("ALL"); // Nhóm món đang chọn
  const [searchKeyword, setSearchKeyword] = useState(""); // Tìm kiếm món theo tên

  const [loadingOrder, setLoadingOrder] = useState(false); // loading khi load order theo bàn

  // ------------------------------------------------------------
  // 1. LOAD DANH SÁCH MÓN
  // ------------------------------------------------------------
  const loadDishes = useCallback(async () => {
    try {
      setLoadingDishes(true);
      const data = await getDishes(); // dishApi đã trả res.data
      setDishes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi load danh sách món:", error);
      message.error("Không tải được danh sách món ăn");
    } finally {
      setLoadingDishes(false);
    }
  }, []);

  // ------------------------------------------------------------
  // 2. LOAD ORDER ĐANG MỞ CỦA BÀN (NẾU CÓ)
  // ------------------------------------------------------------
  const loadOrderOfTable = useCallback(async () => {
    try {
      setLoadingOrder(true);

      const res = await getOrderByTableId(tableId);
      const order = res.data;

      // Trường hợp bàn tồn tại nhưng CHƯA có order → cart rỗng, không báo lỗi
      if (!order) {
        setOrderId(null);
        setCartItems([]);
        return;
      }

      setOrderId(order.id || null);

      // Map OrderResponse.items → cartItems cho FE
      const items =
        (order.items || [])
          // Bỏ các món đã hủy
          .filter((it) => it.status !== "CANCELED")
          .map((it) => ({
            lineId: createLineId("ex"), // mỗi dòng 1 lineId riêng
            dishId: it.dishId,
            name: it.dishName,
            price: Number(it.dishPrice ?? 0),
            quantity: it.quantity ?? 1,
            note: it.note || "",
            status: it.status || "NEW",
          }));

      setCartItems(items);
    } catch (error) {
      console.error("Lỗi load order theo bàn:", error);
      message.error("Không tải được order của bàn này");
    } finally {
      setLoadingOrder(false);
    }
  }, [tableId]);

  // ------------------------------------------------------------
  // Gọi API khi component mount
  // ------------------------------------------------------------
  useEffect(() => {
    loadDishes();
    if (tableId) {
      loadOrderOfTable();
    }
  }, [loadDishes, loadOrderOfTable, tableId]);

  // ------------------------------------------------------------
  // 3. TÍNH TOÁN NHÓM (CATEGORY) TỪ DANH SÁCH MÓN
  // ------------------------------------------------------------
  const categoryOptions = useMemo(() => {
    const nameSet = new Set();
    dishes.forEach((d) => {
      const catName = getCategoryNameFromDish(d);
      nameSet.add(catName);
    });

    const list = Array.from(nameSet).sort();

    if (list.length === 0) {
      return [];
    }

    return list;
  }, [dishes]);

  // ------------------------------------------------------------
  // 4. LỌC DANH SÁCH MÓN THEO CATEGORY + KEYWORD
  // ------------------------------------------------------------
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      // Filter theo category (nếu chọn khác "ALL")
      if (selectedCategory !== "ALL") {
        const catName = getCategoryNameFromDish(dish);
        if (catName !== selectedCategory) {
          return false;
        }
      }

      // Filter theo keyword tên món
      if (searchKeyword?.trim()) {
        const keyword = searchKeyword.trim().toLowerCase();
        const name = (dish.name || "").toLowerCase();
        return name.includes(keyword);
      }

      return true;
    });
  }, [dishes, selectedCategory, searchKeyword]);

  // ------------------------------------------------------------
  // 5. HÀM THÊM MÓN VÀO GIỎ (CHỈ CẬP NHẬT LOCAL STATE)
  // ------------------------------------------------------------
  /**
   * Thêm món vào giỏ
   * -----------------------------------------------------------
   * - Ưu tiên cộng dồn vào 1 dòng "Mới tạo" (status NEW) của cùng dishId
   * - Nếu chưa có dòng NEW nào → tạo thêm 1 dòng NEW mới
   * - KHÔNG gọi API BE ở đây (Option 1)
   * - Các dòng SENT_TO_KITCHEN / COOKING / DONE giữ nguyên, không chỉnh sửa
   * - Nếu món có item locked → vẫn cho phép gọi thêm (tăng quantity tổng)
   * -----------------------------------------------------------
   */
  const handleAddDishToCart = (dish) => {
    setCartItems((prev) => {
      // Tìm 1 dòng có cùng dishId và đang ở trạng thái NEW (ưu tiên cộng dồn)
      const indexExistingNew = prev.findIndex(
        (item) =>
          item.dishId === dish.id &&
          (item.status === "NEW" || !item.status)
      );

      // Nếu tìm được → chỉ tăng quantity ở đúng 1 dòng đó
      if (indexExistingNew !== -1) {
        return prev.map((item, idx) =>
          idx === indexExistingNew
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // Ngược lại → tạo thêm 1 dòng NEW mới
      const newItem = {
        lineId: createLineId("new"),
        dishId: dish.id,
        name: dish.name,
        price: Number(dish.price ?? 0),
        quantity: 1,
        status: "NEW",
        note: "",
      };

      return [...prev, newItem];
    });
  };

  // ------------------------------------------------------------
  // 5.1. Thay đổi số lượng trong cart (LOCAL STATE)
  // ------------------------------------------------------------
  /**
   * Thay đổi số lượng trong cart
   * -----------------------------------------------------------
   * - Nhận vào lineId (không phải dishId) để chỉ sửa đúng 1 dòng
   * - Nếu qty = 0 → xóa dòng đó khỏi cart
   * - KHÔNG gọi API BE ở đây, chỉ lưu local
   * - Việc khóa theo Case A được xử lý ở CartItem + forceLocked
   * -----------------------------------------------------------
   */
  const handleChangeQuantity = (lineId, qty) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.lineId === lineId ? { ...item, quantity: qty } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // ------------------------------------------------------------
  // 6. HÀM CẬP NHẬT SỐ LƯỢNG MÓN TRONG GIỎ (wrapper)
  // ------------------------------------------------------------
  const handleChangeCartQuantity = (lineId, newQuantity) => {
    handleChangeQuantity(lineId, newQuantity);
  };

  // ------------------------------------------------------------
  // 7. HÀM CẬP NHẬT GHI CHÚ MÓN (LOCAL STATE)
  // ------------------------------------------------------------
  const handleChangeCartNote = (lineId, newNote) => {
    setCartItems((prev) =>
      prev.map((it) =>
        it.lineId === lineId ? { ...it, note: newNote } : it
      )
    );
  };

  // ------------------------------------------------------------
  // 8. HÀM XOÁ MÓN KHỎI GIỎ
  // ------------------------------------------------------------
  const handleRemoveCartItem = (lineId) => {
    // Đặt quantity = 0 → handleChangeQuantity sẽ tự filter bỏ
    handleChangeQuantity(lineId, 0);
  };

  // ------------------------------------------------------------
  // 9. TỔNG TIỀN CỦA GIỎ HÀNG (LOCAL)
  // ------------------------------------------------------------
  const totalAmount = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * item.quantity,
      0
    );
  }, [cartItems]);

  // ------------------------------------------------------------
  // 10. CHUYỂN SANG MÀN HÌNH SUMMARY
  // ------------------------------------------------------------
  const handleGoToSummary = () => {
    if (!cartItems.length) {
      message.warning("Chưa có món nào trong giỏ hàng");
      return;
    }

    // Điều hướng sang PosOrderSummaryPage,
    // truyền kèm cartItems + orderId hiện tại + tên bàn
    navigate(`/pos/table/${tableId}/summary`, {
      state: {
        cartItems,
        orderId,
        tableName,
      },
    });
  };

  // ------------------------------------------------------------
  // 11. RENDER UI
  // ------------------------------------------------------------
  const isLoading = loadingDishes || loadingOrder;

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        <Spin tip="Đang tải dữ liệu gọi món..." />
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
          {/* Header + filter */}
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
                <h2>Gọi món – {tableName}</h2>
                <Text type="secondary">
                  Chọn món ở bên trái, giỏ hàng sẽ hiển thị ở bên phải (lưu tạm
                  trên màn hình cho đến khi bạn gửi Order).
                </Text>
              </Col>
              <Col>
                <Button onClick={() => navigate("/pos/table")} type="default">
                  ← Về danh sách bàn
                </Button>
              </Col>
            </Row>

            {/* Hàng filter: nhóm món + ô tìm kiếm */}
            <Row
              justify="space-between"
              align="middle"
              style={{ marginTop: 8 }}
            >
              <Col>
                {/* Nhóm món (category) dạng Segmented, scroll ngang */}
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
                  style={{ maxWidth: "100%" }}
                />
              </Col>
              <Col>
                {/* Ô tìm kiếm theo tên món */}
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

          {/* Danh sách món dạng grid */}
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
                    variant="outlined" // Rule 29
                    hoverable
                    style={{ height: "100%" }}
                    onClick={() => handleAddDishToCart(dish)}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {/* Tên món */}
                      <div
                        style={{
                          fontWeight: 600,
                          minHeight: 40,
                          lineHeight: 1.2,
                        }}
                      >
                        {dish.name}
                      </div>

                      {/* Giá món */}
                      <div style={{ fontSize: 14 }}>
                        <Text strong>
                          {Number(dish.price ?? 0).toLocaleString()} đ
                        </Text>
                      </div>

                      {/* Nút thêm món (tuỳ chọn, ngoài onClick Card) */}
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
            CỘT PHẢI – GIỎ HÀNG (CART)
        ===================================================================== */}
        <Col xs={24} md={10} lg={8}>
          <Card
            title={`Giỏ hàng – ${tableName}`}
            variant="outlined"
            extra={<Text strong>Tổng: {totalAmount.toLocaleString()} đ</Text>}
          >
            {/* Nếu giỏ hàng trống */}
            {!cartItems.length && (
              <Empty
                description="Chưa có món nào trong giỏ"
                style={{ margin: "16px 0" }}
              />
            )}

            {/* Danh sách CartItem */}
            <Space direction="vertical" style={{ width: "100%" }} size={8}>
              {cartItems.map((item) => {
                // ----------------------------------------------------------
                // Case A: Nếu món này có bất kỳ dòng locked
                //  (SENT_TO_KITCHEN / COOKING / DONE)
                //  → khóa luôn tất cả dòng của dishId đó
                // ----------------------------------------------------------
                const hasLockedSameDish = cartItems.some(
                  (other) =>
                    other.dishId === item.dishId &&
                    (other.status === "SENT_TO_KITCHEN" ||
                      other.status === "COOKING" ||
                      other.status === "DONE")
                );

                return (
                  <CartItem
                    key={item.lineId}
                    item={item}
                    forceLocked={hasLockedSameDish}
                    onChangeQuantity={(qty) =>
                      handleChangeCartQuantity(item.lineId, qty)
                    }
                    onChangeNote={(note) =>
                      handleChangeCartNote(item.lineId, note)
                    }
                    onRemove={() => handleRemoveCartItem(item.lineId)}
                  />
                );
              })}
            </Space>

            {/* Nút điều hướng sang Summary */}
            <Button
              type="primary"
              block
              style={{ marginTop: 16 }}
              variant="solid"
              onClick={handleGoToSummary}
              disabled={!cartItems.length}
            >
              Tiếp tục (Xác nhận order)
            </Button>
          </Card>
        </Col>
      </Row>
    </MotionWrapper>
  );
}
