// AppHeader.jsx – User action (avatar + dropdown)
// ❗ KHÔNG DÙNG Layout.Header

import { useEffect, useState } from "react";
import { Avatar, Dropdown, Space, Typography, message } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { getMyInfo } from "../../api/userApi";
import { logout } from "../../api/authApi";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

export default function AppHeader() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    try {
      if (user) await logout(user.username);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
      message.success("Đăng xuất thành công");
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
    }
  };

  const items = [
    { key: "1", label: "Thông tin cá nhân" },
    { key: "2", label: "Đổi mật khẩu" },
    { type: "divider" },
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

  if (!user) return null;

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Space
        style={{
          cursor: "pointer",
          height: 36,                // ⭐ QUAN TRỌNG
          display: "flex",
          alignItems: "center",
          color: "#fff",
        }}
      >
        <Avatar icon={<UserOutlined />} />
        <Text style={{ color: "#fff" }}>{user.username}</Text>
      </Space>
    </Dropdown>
  );
}
