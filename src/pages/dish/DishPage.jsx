// DishPage.jsx – Trang quản lý món ăn
// ---------------------------------------------------------------------
// Chức năng:
//  - Hiển thị danh sách món ăn
//  - Tìm kiếm theo tên món
//  - Lọc theo Category
//  - Lọc theo trạng thái (ACTIVE / INACTIVE)
//  - Nút "Xóa lọc" (Rule 30)
//  - Thêm món mới (Modal)
//  - Sửa món (Modal)
//  - Xóa (mềm) món
// ---------------------------------------------------------------------
// UI/UX:
//  - Dùng Card + Table với variant theo Rule 29
//  - Hiển thị ảnh món (nếu có imageUrl)
//  - Không bọc AdminLayout (Rule 14)
// ---------------------------------------------------------------------
import { hasPermission } from "../../hooks/usePermission";
import ForbiddenResult from "../../components/common/ForbiddenResult";
import PageFilterBar from "../../components/common/PageFilterBar";

import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Image,
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  ClearOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import { getDishes, deleteDish } from "../../api/dishApi";
import { getCategories } from "../../api/categoryApi";

import DishFormModal from "../../components/dish/DishFormModal";

export default function DishPage() {
  // ❌ Không có quyền xem danh sách món
  if (!hasPermission("DISH_VIEW")) {
    return <ForbiddenResult />;
  }
  // State danh sách món + loading
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);

  // State filter
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");

  // State category options cho bộ lọc
  const [categoryOptions, setCategoryOptions] = useState([]);

  // State modal
  const [openForm, setOpenForm] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  // Load danh sách món
  const loadDishes = async () => {
    try {
      setLoading(true);
      const res = await getDishes();
      setDishes(res);
    } catch (err) {
      console.error(err);
      //message.error("Không tải được danh sách món ăn");
    } finally {
      setLoading(false);
    }
  };

  // Load danh sách category cho filter
  const loadCategories = async () => {
    try {
      const res = await getCategories();
      setCategoryOptions(
        res.map((c) => ({
          value: c.id,
          label: c.name,
        }))
      );
    } catch (err) {
      console.error(err);
      //message.error("Không tải được danh sách danh mục");
    }
  };

  // Lần đầu vào page → load data
  useEffect(() => {
    loadDishes();
    loadCategories();
  }, []);

  // Xử lý xóa món (xóa mềm)
  const handleDelete = async (id) => {
    try {
      await deleteDish(id);
      message.success("Xóa món ăn thành công");
      loadDishes();
    } catch (err) {
      console.error(err);
      //message.error("Xóa món ăn thất bại");
    }
  };

  // Filter dữ liệu theo search + category + status
  const filteredDishes = dishes.filter((d) => {
    const textMatch = d.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const categoryMatch = categoryId
      ? d.categoryId === categoryId
      : true;

    const statusMatch = status ? d.status === status : true;

    return textMatch && categoryMatch && statusMatch;
  });

  // Xóa toàn bộ filter (Rule 30)
  const clearFilter = () => {
    setSearch("");
    setCategoryId("");
    setStatus("");
    loadDishes();
  };

  // Cột Table
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (url) =>
        url ? (
          <Image
            src={url}
            width={60}
            height={60}
            style={{ objectFit: "cover", borderRadius: 8 }}
          />
        ) : (
          <span>Không có ảnh</span>
        ),
    },
    {
      title: "Tên món",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Danh mục",
      dataIndex: "categoryName",
      key: "categoryName",
    },
    {
      title: "Giá bán",
      dataIndex: "price",
      key: "price",
      render: (price) =>
        price != null
          ? `${price.toLocaleString("vi-VN")} đ`
          : "",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (st) =>
        st === "ACTIVE" ? (
          <Tag color="green">Đang bán</Tag>
        ) : (
          <Tag color="default">Ngừng</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          {hasPermission("DISH_UPDATE") && 
            <Button
              type="link"
              onClick={() => {
                setEditingDish(record);
                setOpenForm(true);
              }}
            >
              Sửa
            </Button>
          }
          {hasPermission("DISH_DELETE") && 
            <Button
              danger
              type="link"
              onClick={() => handleDelete(record.id)}
            >
              Xóa
            </Button>
          }
        </Space>
      ),
    },
  ];

  return (
    <Card
      variant="outlined"
      style={{ margin: 20 }}
      title={<span style={{ fontSize: 26, fontWeight: 600 }}>Quản lý món ăn</span>}
    >
      {/* =========================================================
          FILTER BAR – DÙNG TEMPLATE CHUNG
          Bên trái: tìm kiếm + lọc + reset + refresh
          Bên phải: hành động chính
      ========================================================= */}
      <PageFilterBar
        filters={
          <>
            {/* ================= TÌM THEO TÊN MÓN ================= */}
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tên món"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />

            {/* ================= LỌC THEO DANH MỤC ================= */}
            <Select
              placeholder="Lọc theo danh mục"
              allowClear
              value={categoryId || undefined}
              onChange={(v) => setCategoryId(v || "")}
              style={{ width: 200 }}
              options={categoryOptions}
            />

            {/* ================= LỌC THEO TRẠNG THÁI ================= */}
            <Select
              placeholder="Lọc trạng thái"
              allowClear
              value={status || undefined}
              onChange={(v) => setStatus(v || "")}
              style={{ width: 160 }}
              options={[
                { value: "ACTIVE", label: "Đang bán" },
                { value: "INACTIVE", label: "Ngừng" },
              ]}
            />

            {/* ================= XÓA LỌC (RULE 30) ================= */}
            <Button
              icon={<ClearOutlined />}
              onClick={clearFilter}
            >
              Xóa lọc
            </Button>

            {/* ================= LÀM MỚI ================= */}
            <Button
              icon={<ReloadOutlined />}
              onClick={loadDishes}
            >
              Làm mới
            </Button>
          </>
        }
        actions={
          <>
            {/* ================= THÊM MÓN ================= */}
            {hasPermission("DISH_CREATE") && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingDish(null);
                  setOpenForm(true);
                }}
              >
                Thêm món ăn
              </Button>
            )}
          </>
        }
      />
      
      {/* Bảng danh sách món */}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={filteredDishes}
        columns={columns}
        variant="borderless"
      />

      {/* Modal thêm / sửa món */}
      <DishFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        dish={editingDish}
        reload={loadDishes}
      />
    </Card>
  );
}
