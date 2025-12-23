// src/pages/ingredient/IngredientPage.jsx
// -----------------------------------------------------------
// Trang quản lý nguyên liệu (Ingredient)
// Chức năng:
//  - Hiển thị danh sách nguyên liệu
//  - Tìm kiếm theo tên
//  - Lọc theo trạng thái ACTIVE / INACTIVE
//  - Nút Xóa lọc (Rule 30)
//  - Thêm mới / Sửa / Xóa nguyên liệu
//  - Xem chi tiết nguyên liệu
// -----------------------------------------------------------
// UI theo Rule 27
// Table / Card sử dụng variant theo Rule 29
// Không bọc AdminLayout (Rule 14)
// -----------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Row,
  Col,
  Input,
  Select,
  Space,
  Tag,
  message,
  Card,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  ClearOutlined,
} from "@ant-design/icons";

import {
  getIngredients,
  deleteIngredient,
} from "../../api/ingredientApi";

import IngredientFormModal from "../../components/ingredient/IngredientFormModal";
import IngredientDetailModal from "../../components/ingredient/IngredientDetailModal";
import PageFilterBar from "../../components/common/PageFilterBar";

export default function IngredientPage() {
  // State danh sách nguyên liệu
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);

  // State filter
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // State modal
  const [openForm, setOpenForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // -----------------------------------------------------------
  // Load danh sách nguyên liệu
  // -----------------------------------------------------------
  const loadIngredients = async () => {
    try {
      setLoading(true);
      const res = await getIngredients();
      setIngredients(res);
    } catch (err) {
      console.error("Lỗi load nguyên liệu:", err);
      //message.error("Không tải được danh sách nguyên liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  // -----------------------------------------------------------
  // Xóa nguyên liệu
  // -----------------------------------------------------------
  const handleDelete = async (id) => {
    try {
      await deleteIngredient(id);
      message.success("Xóa nguyên liệu thành công");
      loadIngredients();
    } catch (err) {
      console.error(err);
      //message.error("Xóa thất bại");
    }
  };

  // -----------------------------------------------------------
  // Reset filter (Rule 30)
  // -----------------------------------------------------------
  const handleResetFilter = () => {
    setSearch("");
    setStatus("");
  };

  // -----------------------------------------------------------
  // Filter dữ liệu
  // -----------------------------------------------------------
  const filteredList = ingredients.filter((ing) => {
    const textMatch = ing.name.toLowerCase().includes(search.toLowerCase());
    const statusMatch =
      status ? ing.active === (status === "ACTIVE") : true;

    return textMatch && statusMatch;
  });

  // -----------------------------------------------------------
  // Cấu hình bảng
  // -----------------------------------------------------------
  const columns = [
    {
      title: "Tên nguyên liệu",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <a
          onClick={() => {
            setSelectedItem(record);
            setOpenDetail(true);
          }}
        >
          {text}
        </a>
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
    },
    {
      title: "Tồn kho",
      dataIndex: "stockQuantity",
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      render: (active) =>
        active ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="default">Ngừng</Tag>
        ),
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditingItem(record);
              setOpenForm(true);
            }}
          >
            Sửa
          </Button>

          <Button danger type="link" onClick={() => handleDelete(record.id)}>
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
     title={<span style={{ fontSize: 26, fontWeight: 600 }}>Quản lý nguyên liệu</span>}
     >
      {/* =========================================================
          FILTER BAR – DÙNG TEMPLATE CHUNG
          Bên trái: tìm kiếm + lọc + xóa lọc + làm mới
          Bên phải: hành động chính
      ========================================================= */}
      <PageFilterBar
        filters={
          <>
            {/* ================= TÌM KIẾM ================= */}
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm nguyên liệu"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />

            {/* ================= LỌC TRẠNG THÁI ================= */}
            <Select
              placeholder="Lọc trạng thái"
              allowClear
              value={status || undefined}
              onChange={(v) => setStatus(v || "")}
              style={{ width: 160 }}
              options={[
                { value: "ACTIVE", label: "Hoạt động" },
                { value: "INACTIVE", label: "Ngừng" },
              ]}
            />

            {/* ================= LÀM MỚI ================= */}
            <Button
              icon={<ReloadOutlined />}
              onClick={loadIngredients}
            >
              Làm mới
            </Button>

            {/* ================= XÓA LỌC (RULE 30) ================= */}
            <Button
              icon={<ClearOutlined />}
              onClick={handleResetFilter}
            >
              Xóa lọc
            </Button>
          </>
        }
        actions={
          <>
            {/* ================= THÊM NGUYÊN LIỆU ================= */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingItem(null);
                setOpenForm(true);
              }}
            >
              Thêm nguyên liệu
            </Button>
          </>
        }
      />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filteredList}
        columns={columns}
        variant="borderless"
      />

      {/* Modal thêm / sửa */}
      <IngredientFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        item={editingItem}
        reload={loadIngredients}
      />

      {/* Modal chi tiết */}
      <IngredientDetailModal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        item={selectedItem}
      />
    </Card>
  );
}
