// AppHeader.jsx – Header hiển thị thông tin user + nút logout
// - Lấy thông tin user từ API /api/users/me
// - Hiển thị avatar + username
// - Dropdown chứa: Thông tin cá nhân, Đổi mật khẩu, Đăng xuất
// - UI chuẩn Rule 27, 29

import { useEffect, useState } from "react";
import { Layout, Avatar, Dropdown, Space, Typography, message } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";

import { getMyInfo } from "../../api/userApi";
import { logout } from "../../api/authApi";

import { useNavigate } from "react-router-dom";

const { Header } = Layout;
const { Text } = Typography;

export default function AppHeader() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Lấy thông tin user hiện tại
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await getMyInfo();
      setUser(data);
    } catch (err) {
      console.error("Lỗi load user:", err);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      // 🟢 Sửa ngay dòng này bên trong items[] → onClick của Logout
        if (user) {
        await logout(user.username);
        }

      // Xóa token
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      navigate("/login");
      message.success("Đăng xuất thành công");
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
      //message.error("Không thể đăng xuất");
    }
  };

  const items = [
    {
      key: "1",
      label: "Thông tin cá nhân",
    },
    {
      key: "2",
      label: "Đổi mật khẩu",
    },
    {
      type: "divider",
    },
    {
      key: "3",
      label: (
        <span style={{ color: "red" }}>
          <LogoutOutlined /> Đăng xuất
        </span>
      ),
      onClick: handleLogout,
    },
  ];

  // 🟢 Thêm đoạn này TRƯỚC dòng return (...) của component
    if (!user) {
    return (
        <Header
        style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            height: 64,
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}
        >
        <Text>Đang tải...</Text>
        </Header>
    );
    }


  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 24px",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        height: 64,
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
      }}
    >
      <Dropdown menu={{ items }} placement="bottomRight">
        <Space style={{ cursor: "pointer" }}>
          <Avatar icon={<UserOutlined />} />
          <Text strong>{user?.username}</Text>
        </Space>
      </Dropdown>
    </Header>
  );
}
