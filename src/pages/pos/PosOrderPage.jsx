// src/pages/pos/PosOrderPage.jsx
// ------------------------------------------------------------------
// PosOrderPage – Trang order món cho 1 bàn trong chế độ POS Tablet
//
// Chức năng:
//  - Load danh mục món (categories) + danh sách món (dishes)
//  - Load order hiện tại của bàn (nếu tồn tại) → đổ vào giỏ hàng
//  - Cho phép chọn món, tăng/giảm số lượng
//  - Tính tổng tiền theo Rule 26 (định dạng BigDecimal → FE dùng number)
//  - Điều hướng sang trang Summary để gửi order
//
// UI chia 2 cột lớn:
//  - Bên trái: menu món, filter theo category
//  - Bên phải: giỏ hàng (cart)
// ------------------------------------------------------------------

import { useEffect, useState, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Select,
  Input,
  List,
  InputNumber,
  Space,
  message,
  Spin,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

// TODO: Đổi các api này cho đúng với API project hiện tại
import { getCategories } from "../../api/categoryApi";
import { getDishes } from "../../api/dishApi";
import { getOrderByTableId } from "../../api/orderApi";
import MotionWrapper from "../../components/common/MotionWrapper";

const PosOrderPage = () => {
  // Lấy tableId từ URL
  const { tableId } = useParams();

  const navigate = useNavigate();

  // Data từ API
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);

  // Bộ lọc danh mục
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Giỏ hàng (cart)
  // Format: [{ dishId, name, price, quantity }]
  const [cartItems, setCartItems] = useState([]);

  // Lưu orderId nếu bàn đang có order mở
  const [orderId, setOrderId] = useState(null);

  // Loading flag
  const [loading, setLoading] = useState(false);

  //search món ăn
  const [searchKeyword, setSearchKeyword] = useState("");

  const location = useLocation();
  const fromSummary = location.state?.fromSummary === true;

  // --------------------------------------------------------------------
  // 1. Hàm load danh mục món
  // --------------------------------------------------------------------
  const loadCategories = async () => {
  try {
        const res = await getCategories();  // res là ARRAY
        // res = [ {id, name}, ... ]
        setCategories(Array.isArray(res) ? res : []);
    } catch (err) {
        console.error("❌ Lỗi load categories:", err);
        message.error("Không tải được danh mục món");
        setCategories([]);
    }
  };

  // --------------------------------------------------------------------
  // 2. Hàm load danh sách món
  // --------------------------------------------------------------------
  const loadDishes = async () => {
  try {
    const res = await getDishes();  // res là ARRAY
    setDishes(Array.isArray(res) ? res : []);
    } catch (err) {
        console.error("❌ Lỗi load món:", err);
        message.error("Không tải được danh sách món");
        setDishes([]);
    }
  };

  // --------------------------------------------------------------------
  // 3. Load order hiện tại của bàn
  //     - Nếu bàn có order đang mở → setOrderId + đổ item vào cart
  // --------------------------------------------------------------------
  const fetchOrderOfTable = async () => {
    try {
      const res = await getOrderByTableId(tableId);

      if (!res?.data) {
        return; // bàn chưa có order → cart rỗng
      }

      const order = res.data;

      // Lưu orderId
      setOrderId(order.id);

      // Convert order items → cartItems format
      // Backend thường trả: [{ dishId, name, quantity, price }]
      const cart = order.items.map(i => ({
        dishId: i.dishId,
        name: i.dishName,
        price: Number(i.dishPrice), // đúng field trong OrderItemResponse
        quantity: i.quantity,
      }));

      setCartItems(cart);
    } catch (error) {
      // Nếu API trả 404 → bàn chưa có order → OK
      console.log("Bàn chưa có order đang mở");
    }
  };

  // --------------------------------------------------------------------
  // Gọi API đồng thời khi mở trang
  // --------------------------------------------------------------------
  useEffect(() => {
    setLoading(true);

    // Nếu quay lại từ Summary → chỉ reload danh mục + món, KHÔNG load order bàn
    if (fromSummary) {
        Promise.all([loadCategories(), loadDishes()])
        .finally(() => setLoading(false));
    } else {
        Promise.all([loadCategories(), loadDishes(), fetchOrderOfTable()])
        .finally(() => setLoading(false));
    }
  }, [tableId, fromSummary]);

  // --------------------------------------------------------------------
  // Hàm thêm món vào giỏ hàng
  // Nếu món đã có trong cart → tăng số lượng
  // --------------------------------------------------------------------
  const handleAddDish = (dish) => {
    setCartItems((prev) => {
      const exist = prev.find((item) => item.dishId === dish.id);

      if (exist) {
        return prev.map((item) =>
          item.dishId === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // Món mới → thêm vào cart
      return [
        ...prev,
        {
          dishId: dish.id,
          name: dish.name,
          price: Number(dish.price),
          quantity: 1,
        },
      ];
    });
  };

  // --------------------------------------------------------------------
  // Thay đổi số lượng trong cart
  // Nếu quantity = 0 → xoá khỏi cart
  // --------------------------------------------------------------------
  const handleChangeQuantity = (dishId, qty) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.dishId === dishId
            ? { ...item, quantity: qty }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // --------------------------------------------------------------------
  // Tính tổng tiền
  // --------------------------------------------------------------------
  const totalAmount = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return total + Number(item.price) * item.quantity;
    }, 0);
  }, [cartItems]);

  // --------------------------------------------------------------------
  // Điều hướng sang trang Summary
  // Mang theo cartItems + orderId
  // --------------------------------------------------------------------
  const handleGoToSummary = () => {
    if (cartItems.length === 0) {
      message.warning("Bạn chưa chọn món nào");
      return;
    }

    navigate(`/pos/table/${tableId}/summary`, {
      state: {
        cartItems,
        orderId,
      },
    });
  };

  // --------------------------------------------------------------------
  // Render UI
  // --------------------------------------------------------------------

  if (loading) {
    return (
      <div style={{
        height: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Spin tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <MotionWrapper>
    <>
        {/* Nút quay lại chọn bàn */}
        <Button
        variant="outlined"
        style={{ marginBottom: 16 }}
        onClick={() => navigate("/pos/table")}
        >
        ← Quay lại chọn bàn
        </Button>
        <Row gutter={16}>
        {/* --------------------------------------------------------------
            CỘT BÊN TRÁI – DANH SÁCH MÓN
        -------------------------------------------------------------- */}
        <Col span={14}>
            <Space style={{ marginBottom: 16 }}>
            {/* Select danh mục */}
            <Select
                placeholder="Chọn danh mục"
                variant="outlined"
                allowClear
                style={{ minWidth: 200 }}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                options={categories.map((c) => ({
                label: c.name,
                value: c.id,
                }))}
            />

            {/* Search đơn giản tên món */}
            <Input
                placeholder="Tìm món..."
                allowClear
                style={{ width: 200 }}
                onChange={(e) => setSearchKeyword(e.target.value)} // optional
            />
            </Space>

            {/* Grid món ăn */}
            <Row gutter={[12, 12]}>
            {dishes
                .filter((dish) =>
                    selectedCategoryId ? dish.categoryId === selectedCategoryId : true
                )
                .filter((dish) =>
                    searchKeyword.trim()
                    ? dish.name.toLowerCase().includes(searchKeyword.trim().toLowerCase())
                    : true
                )
                .map((dish) => (
                <Col xs={12} sm={8} key={dish.id}>
                    <Card
                        variant="outlined"
                        style={{
                            minHeight: 170,
                            cursor: "pointer",
                            padding: 12
                        }}
                        >
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{dish.name}</div>
                        <div style={{ color: "#666", marginBottom: 12, fontSize: 16 }}>
                            {dish.price.toLocaleString()}đ
                        </div>

                        <Button
                            type="primary"
                            block
                            variant="solid"
                            style={{ height: 44, fontSize: 16 }}
                            onClick={() => handleAddDish(dish)}
                        >
                            Thêm vào giỏ
                        </Button>
                    </Card>
                </Col>
                ))}
            </Row>
        </Col>

        {/* --------------------------------------------------------------
            CỘT BÊN PHẢI – GIỎ HÀNG
        -------------------------------------------------------------- */}
        <Col span={10}>
            <Card
            variant="outlined"
            title={`Giỏ hàng – Bàn ${tableId}`}
            extra={<div>Tổng: {totalAmount.toLocaleString()}đ</div>}
            >
            <List
                dataSource={cartItems}
                renderItem={(item) => (
                <List.Item
                    style={{ padding: 12, fontSize: 16 }}
                    actions={[
                        <Button
                        danger
                        size="small"
                        onClick={() => handleChangeQuantity(item.dishId, 0)}
                        >
                        X
                        </Button>
                    ]}
                >
                    <div style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{item.name}</div>
                    <div>
                    <InputNumber
                        min={0}
                        style={{ width: 70 }}
                        controls={true}
                        size="large"
                        value={item.quantity}
                        onChange={(value) =>
                        handleChangeQuantity(item.dishId, Number(value || 0))
                        }
                    />
                    </div>
                    <div style={{ width: 100, textAlign: "right", fontSize: 16 }}>
                    {(item.price * item.quantity).toLocaleString()}đ
                    </div>
                </List.Item>
                )}
            />

            <Button
                type="primary"
                block
                variant="solid"
                style={{ height: 50, fontSize: 18 }}
                onClick={handleGoToSummary}
            >
                Xem lại & Gửi Order
            </Button>
            </Card>
        </Col>
        </Row>
    </>
    </MotionWrapper>
  );
};

export default PosOrderPage;
