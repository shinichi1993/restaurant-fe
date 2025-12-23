// src/pages/role/RolePage.jsx
// --------------------------------------------------------------
// Màn hình quản lý VAI TRÒ (Role)
//  - Bảng danh sách role
//  - Tìm kiếm theo tên / mã
//  - Thêm / sửa bằng Modal form
//  - Xóa có confirm
// --------------------------------------------------------------
// UI theo Rule 27:
//  - Bọc trong Card, variant="outlined"
//  - Có bộ filter phía trên
// --------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Table,
  Space,
  Tag,
  Popconfirm,
  message,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  ClearOutlined,
} from "@ant-design/icons";

import {
  getRoles,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
} from "../../api/roleApi";
import RoleFormModal from "../../components/role/RoleFormModal";
import PageFilterBar from "../../components/common/PageFilterBar";

export default function RolePage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // ----------------------------------------------------------
  // LOAD DANH SÁCH ROLE
  // ----------------------------------------------------------
  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setRoles(data || []);
    } catch (err) {
      console.error(err);
      //message.error("Không tải được danh sách vai trò");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // XÓA LỌC (Rule 30)
  // ----------------------------------------------------------
  const clearFilter = () => {
    setKeyword("");
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // ----------------------------------------------------------
  // FILTER TRÊN CLIENT
  // ----------------------------------------------------------
  const filteredRoles = roles.filter((r) => {
    const kw = keyword.toLowerCase();
    return (
      r.name?.toLowerCase().includes(kw) ||
      r.code?.toLowerCase().includes(kw)
    );
  });

  // ----------------------------------------------------------
  // THÊM / SỬA
  // ----------------------------------------------------------
  const handleCreate = () => {
    setEditingRole(null);
    setOpenModal(true);
  };

  const handleEdit = async (id) => {
    try {
      const detail = await getRoleDetail(id);
      setEditingRole(detail);
      setOpenModal(true);
    } catch (err) {
      console.error(err);
      //message.error("Không tải được chi tiết vai trò");
    }
  };

  const handleSubmitForm = async (payload) => {
    try {
      if (editingRole) {
        await updateRole(editingRole.id, payload);
        message.success("Cập nhật vai trò thành công");
      } else {
        await createRole(payload);
        message.success("Thêm vai trò mới thành công");
      }
      setOpenModal(false);
      setEditingRole(null);
      loadRoles(); // reload sau khi lưu (Q4: A)
    } catch (err) {
      console.error(err);
      //message.error("Lưu vai trò thất bại");
    }
  };

  // ----------------------------------------------------------
  // XÓA ROLE
  // ----------------------------------------------------------
  const handleDelete = async (id) => {
    try {
      await deleteRole(id);
      message.success("Xóa vai trò thành công");
      loadRoles();
    } catch (err) {
      console.error(err);
      //message.error("Không thể xóa vai trò");
    }
  };

  // ----------------------------------------------------------
  // CẤU HÌNH CỘT TABLE
  // ----------------------------------------------------------
  const columns = [
    {
      title: "Tên vai trò",
      dataIndex: "name",
    },
    {
      title: "Mã",
      dataIndex: "code",
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record.id)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa vai trò này?"
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

  return (
    <Card
      title={<span style={{ fontSize: 26, fontWeight: 600 }}>Quản lý vai trò</span>}
      variant="outlined"
      style={{ margin: 20 }}
    >
      {/* Bộ lọc */}
      <PageFilterBar
        filters={
          <>
            {/* ================= TÌM KIẾM ROLE ================= */}
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tên / mã vai trò..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 260 }}
            />

            {/* ================= LÀM MỚI ================= */}
            <Button
              icon={<ReloadOutlined />}
              onClick={loadRoles}
            >
              Làm mới
            </Button>

            {/* ================= XÓA LỌC – RULE 30 ================= */}
            <Button
              icon={<ClearOutlined />}
              onClick={clearFilter}
            >
              Xóa lọc
            </Button>
          </>
        }
        actions={
          <>
            {/* ================= THÊM VAI TRÒ ================= */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm vai trò
            </Button>
          </>
        }
      />

      {/* Bảng dữ liệu */}
      <Table
        rowKey="id"
        dataSource={filteredRoles}
        columns={columns}
        loading={loading}
        variant="borderless"
      />

      {/* Modal Form */}
      <RoleFormModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditingRole(null);
        }}
        onSubmit={handleSubmitForm}
        initialValues={editingRole}
        existingRoles={roles}
      />
    </Card>
  );
}
