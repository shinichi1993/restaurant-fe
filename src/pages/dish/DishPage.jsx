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
      message.error("Không tải được danh sách món ăn");
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
      message.error("Không tải được danh sách danh mục");
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
      message.error("Xóa món ăn thất bại");
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
          <Button
            type="link"
            onClick={() => {
              setEditingDish(record);
              setOpenForm(true);
            }}
          >
            Sửa
          </Button>
          <Button
            danger
            type="link"
            onClick={() => handleDelete(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      variant="outlined"
      style={{ margin: 20 }}
      title="Quản lý món ăn"
    >
      {/* Hàng filter + action */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* Ô tìm kiếm theo tên món */}
        <Col span={8}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên món"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>

        {/* Lọc theo danh mục */}
        <Col span={6}>
          <Select
            placeholder="Lọc theo danh mục"
            style={{ width: "100%" }}
            allowClear
            value={categoryId || undefined}
            onChange={(v) => setCategoryId(v || "")}
            options={categoryOptions}
          />
        </Col>

        {/* Lọc theo trạng thái */}
        <Col span={4}>
          <Select
            placeholder="Lọc trạng thái"
            style={{ width: "100%" }}
            allowClear
            value={status || undefined}
            onChange={(v) => setStatus(v || "")}
            options={[
              { value: "ACTIVE", label: "Đang bán" },
              { value: "INACTIVE", label: "Ngừng" },
            ]}
          />
        </Col>

        {/* Nút Xóa lọc */}
        <Col span={3}>
          <Button
            icon={<ClearOutlined />}
            style={{ width: "100%" }}
            onClick={clearFilter}
          >
            Xóa lọc
          </Button>
        </Col>

        {/* Nút Làm mới */}
        <Col span={3}>
          <Button
            icon={<ReloadOutlined />}
            style={{ width: "100%" }}
            onClick={loadDishes}
          >
            Làm mới
          </Button>
        </Col>
      </Row>

      {/* Hàng nút Thêm món */}
      <Row style={{ marginBottom: 16 }}>
        <Col span={24} style={{ textAlign: "right" }}>
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
        </Col>
      </Row>

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
