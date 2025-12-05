// UserPage.jsx – Trang quản lý người dùng
// -----------------------------------------------------------
// Chức năng:
//  - Hiển thị danh sách user (Table)
//  - Tìm kiếm theo username / họ tên
//  - Lọc theo role (ADMIN / STAFF)
//  - Lọc theo status (ACTIVE / INACTIVE)
//  - Thêm mới user
//  - Sửa user
//  - Xóa user (xóa mềm)
// -----------------------------------------------------------
// UI/UX theo Rule 27
// Table/Card sử dụng variant theo Rule 29
// Không bọc AdminLayout (Rule 14) – Layout đã nằm trong AppRoutes
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
  getUsers,
  deleteUser,
} from "../../api/userApi";

import UserFormModal from "../../components/user/UserFormModal";
import UserDetailModal from "../../components/user/UserDetailModal";

export default function UserPage() {
  // State dữ liệu user
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // State filter
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  // State modals
  const [openForm, setOpenForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // -----------------------------------------------------------
  // Hàm load danh sách user từ API
  // -----------------------------------------------------------
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      setUsers(res);
    } catch (err) {
      console.error("Lỗi load user:", err);
      message.error("Không tải được danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // -----------------------------------------------------------
  // Hàm xóa user
  // -----------------------------------------------------------
  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      message.success("Xóa người dùng thành công");
      loadUsers();
    } catch (err) {
      console.error(err);
      message.error("Xóa thất bại");
    }
  };

  // -----------------------------------------------------------
  // Data table
  // -----------------------------------------------------------
  const filteredUsers = users.filter((u) => {
    const textMatch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase());

    const roleMatch = role ? u.role === role : true;
    const statusMatch = status ? u.status === status : true;

    return textMatch && roleMatch && statusMatch;
  });

  const columns = [
    {
      title: "Tên đăng nhập",
      dataIndex: "username",
      key: "username",
      render: (text, record) => (
        <span
          style={{ color: "#1677ff", cursor: "pointer" }}
          onClick={() => {
            setSelectedUser(record);
            setOpenDetail(true);
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      render: (role) =>
        role === "ADMIN" ? (
          <Tag color="red">ADMIN</Tag>
        ) : (
          <Tag color="blue">STAFF</Tag>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (st) =>
        st === "ACTIVE" ? (
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
              setEditingUser(record);
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
    <Card variant="outlined" style={{ margin: 20 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm username hoặc họ tên"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>

        <Col span={4}>
          <Select
            placeholder="Lọc theo vai trò"
            style={{ width: "100%" }}
            allowClear
            value={role}
            onChange={(v) => setRole(v)}
            options={[
              { value: "ADMIN", label: "ADMIN" },
              { value: "STAFF", label: "Nhân viên" },
            ]}
          />
        </Col>

        <Col span={4}>
          <Select
            placeholder="Lọc theo trạng thái"
            style={{ width: "100%" }}
            allowClear
            value={status}
            onChange={(v) => setStatus(v)}
            options={[
              { value: "ACTIVE", label: "Hoạt động" },
              { value: "INACTIVE", label: "Ngừng" },
            ]}
          />
        </Col>

        <Col span={4}>
          <Space style={{ width: "100%" }}>
            <Button
                icon={<ClearOutlined />}
                type="default"
                onClick={() => {
                    setSearch("");
                    setRole("");
                    setStatus("");
                    loadUsers();
                }}
                style={{ width: "100%" }}
                >
                Xóa lọc
            </Button>

            <Button
                icon={<ReloadOutlined />}
                onClick={loadUsers}
                style={{ width: "100%" }}
                >
                Làm mới
            </Button>
          </Space>                  
        </Col>

        <Col span={6}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ width: "100%" }}
            onClick={() => {
              setEditingUser(null);
              setOpenForm(true);
            }}
          >
            Thêm người dùng
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filteredUsers}
        columns={columns}
        variant="borderless"
      />

      {/* Modal thêm / sửa */}
      <UserFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        user={editingUser}
        reload={loadUsers}
      />

      {/* Modal chi tiết */}
      <UserDetailModal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        user={selectedUser}
      />
    </Card>
  );
}
