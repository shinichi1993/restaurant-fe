// RecipePage.jsx – Trang quản lý Định lượng món ăn (Module 07)
// -----------------------------------------------------------------------------
// Chức năng chính:
//  ✓ Chọn món ăn (Dish)
//  ✓ Hiển thị bảng định lượng nguyên liệu của món đã chọn
//  ✓ Thêm mới định lượng (mở RecipeFormModal)
//  ✓ Sửa định lượng (mở RecipeFormModal)
//  ✓ Xóa 1 dòng định lượng
//  ✓ Reset toàn bộ định lượng của món
//
// UI áp dụng:
//  - Rule 27: UI/UX chuẩn Ant Design (giao diện đồng nhất)
//  - Rule 29: Table/Card phải dùng variant
//  - Rule 14: Page KHÔNG bọc AdminLayout (Layout đã nằm trong AppRoutes)
//  - Rule 30: Phải có nút Xóa lọc (nếu có filter)
//
// Giao diện gồm 2 phần chính:
//  1) Select chọn món ăn (Dish)
//  2) Bảng hiển thị định lượng
//
// Sử dụng RecipeFormModal cho Add/Edit.
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Tag,
  message,
  Popconfirm,
} from "antd";

import {
  getRecipeByDish,
  addRecipeItem,
  updateRecipeItem,
  deleteRecipeItem,
  resetRecipeByDish,
} from "../../api/recipeApi";

import { getDishes } from "../../api/dishApi";
import { getIngredients } from "../../api/ingredientApi";

import RecipeFormModal from "../../components/recipe/RecipeFormModal";

export default function RecipePage() {
  // ---------------------------------------------------------------------------
  // STATE CHÍNH
  // ---------------------------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [dishList, setDishList] = useState([]); // Danh sách món ăn
  const [selectedDish, setSelectedDish] = useState(null); // ID món đang chọn

  const [recipe, setRecipe] = useState([]); // Danh sách định lượng của món

  // Modal state
  const [openForm, setOpenForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = thêm mới

  // ---------------------------------------------------------------------------
  // LOAD DANH SÁCH MÓN ĂN
  // ---------------------------------------------------------------------------
  const loadDishes = async () => {
    try {
      const res = await getDishes();
      setDishList(
        res.map((dish) => ({
          value: dish.id,
          label: dish.name,
        }))
      );
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách món ăn");
    }
  };

  // ---------------------------------------------------------------------------
  // LOAD RECIPE CỦA MÓN
  // ---------------------------------------------------------------------------
  const loadRecipe = async () => {
    if (!selectedDish) return;
    try {
      setLoading(true);
      const res = await getRecipeByDish(selectedDish);
      setRecipe(res);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải định lượng món ăn");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // LOAD BAN ĐẦU
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadDishes(); // Load danh sách món
  }, []);

  // Khi chọn món → load recipe của món đó
  useEffect(() => {
    loadRecipe();
  }, [selectedDish]);

  // ---------------------------------------------------------------------------
  // HÀM XÓA 1 DÒNG ĐỊNH LƯỢNG
  // ---------------------------------------------------------------------------
  const handleDelete = async (id) => {
    try {
      await deleteRecipeItem(id);
      message.success("Xóa định lượng thành công");
      loadRecipe();
    } catch (err) {
      console.error(err);
      message.error("Xóa thất bại");
    }
  };

  // ---------------------------------------------------------------------------
  // HÀM RESET ĐỊNH LƯỢNG CỦA MÓN
  // ---------------------------------------------------------------------------
  const handleReset = async () => {
    if (!selectedDish) return;

    try {
      await resetRecipeByDish(selectedDish);
      message.success("Reset công thức món thành công");
      loadRecipe();
    } catch (err) {
      console.error(err);
      message.error("Reset thất bại");
    }
  };

  // ---------------------------------------------------------------------------
  // TABLE COLUMNS
  // ---------------------------------------------------------------------------
  const columns = [
    {
      title: "Nguyên liệu",
      dataIndex: "ingredientName",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      render: (qty) => <Tag color="blue">{qty}</Tag>,
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditingItem(record); // Truyền item vào modal
              setOpenForm(true);
            }}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa định lượng?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <Card variant="outlined" style={{ margin: 20 }}>
      {/* Khu vực chọn món */}
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Chọn món ăn"
          style={{ width: 300 }}
          value={selectedDish}
          onChange={(v) => setSelectedDish(v)}
          options={dishList}
        />

        <Button
          type="primary"
          disabled={!selectedDish}
          onClick={() => {
            setEditingItem(null); // thêm mới
            setOpenForm(true);
          }}
        >
          Thêm nguyên liệu
        </Button>

        <Button danger disabled={!selectedDish} onClick={handleReset}>
          Reset công thức
        </Button>
      </Space>

      {/* Bảng định lượng */}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={recipe}
        columns={columns}
        variant="borderless"
      />

      {/* Modal thêm/sửa */}
      <RecipeFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        item={editingItem}
        dishId={selectedDish}
        reload={loadRecipe}
      />
    </Card>
  );
}
