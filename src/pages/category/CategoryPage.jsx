// CategoryPage.jsx – Trang quản lý danh mục món ăn
// ---------------------------------------------------------------------
// Chức năng:
//  - Hiển thị danh sách category (Table)
//  - Tìm kiếm theo tên danh mục
//  - Lọc theo trạng thái (ACTIVE / INACTIVE)
//  - Nút "Xóa lọc" (Rule 30) → reset search + filter
//  - Thêm danh mục mới (Modal)
//  - Sửa danh mục (Modal)
//  - Xóa danh mục (xóa mềm – status → INACTIVE)
// ---------------------------------------------------------------------
// UI/UX:
//  - Dùng Card + Table với variant theo Rule 29
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
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  ClearOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import {
  getCategories,
  deleteCategory,
} from "../../api/categoryApi";

import CategoryFormModal from "../../components/category/CategoryFormModal";

export default function CategoryPage() {
  // State danh sách danh mục
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // State filter
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // State modal
  const [openForm, setOpenForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Hàm load danh sách category từ BE
  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await getCategories();
      setCategories(res);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  // Lần đầu vào page → load data
  useEffect(() => {
    loadCategories();
  }, []);

  // Xử lý xóa (mềm) danh mục
  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      message.success("Xóa danh mục thành công");
      loadCategories();
    } catch (err) {
      console.error(err);
      message.error("Xóa danh mục thất bại");
    }
  };

  // Lọc dữ liệu trên FE theo search + status
  const filteredCategories = categories.filter((c) => {
    const textMatch = c.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const statusMatch = status ? c.status === status : true;

    return textMatch && statusMatch;
  });

  // Xóa toàn bộ filter (Rule 30)
  const clearFilter = () => {
    setSearch("");
    setStatus("");
    loadCategories();
  };

  // Cột table
  const columns = [
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (st) =>
        st === "ACTIVE" ? (
          <Tag color="green">Hoạt động</Tag>
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
              setEditingCategory(record);
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
      title="Quản lý danh mục món ăn"
    >
      {/* Hàng filter + nút hành động */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* Ô tìm kiếm theo tên danh mục */}
        <Col span={8}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên danh mục"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              { value: "ACTIVE", label: "Hoạt động" },
              { value: "INACTIVE", label: "Ngừng" },
            ]}
          />
        </Col>

        {/* Nút Xóa lọc (Rule 30) */}
        <Col span={4}>
          <Button
            icon={<ClearOutlined />}
            style={{ width: "100%" }}
            onClick={clearFilter}
          >
            Xóa lọc
          </Button>
        </Col>

        {/* Nút Làm mới */}
        <Col span={4}>
          <Button
            icon={<ReloadOutlined />}
            style={{ width: "100%" }}
            onClick={loadCategories}
          >
            Làm mới
          </Button>
        </Col>

        {/* Nút Thêm danh mục */}
        <Col span={4}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ width: "100%" }}
            onClick={() => {
              setEditingCategory(null);
              setOpenForm(true);
            }}
          >
            Thêm danh mục
          </Button>
        </Col>
      </Row>

      {/* Bảng danh mục */}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={filteredCategories}
        columns={columns}
        variant="borderless"
      />

      {/* Modal thêm / sửa danh mục */}
      <CategoryFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        category={editingCategory}
        reload={loadCategories}
      />
    </Card>
  );
}
