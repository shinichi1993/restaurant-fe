// src/layouts/PosLayout.jsx
// Layout dành cho POS Tablet
// Đặt trong cùng folder với AdminLayout để đồng nhất cấu trúc
import PosHeader from "../pages/pos/PosHeader";
import { Layout, Button } from "antd";
import { Outlet, useNavigate } from "react-router-dom";

const { Header, Content } = Layout;

const PosLayout = () => {
  const navigate = useNavigate();

  const handleGoToAdmin = () => navigate("/admin/dashboard");

  const handleLogout = () => {
    // TODO: Xoá token + chuyển về login sau này
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Header POS */}
      <PosHeader />

      <Content style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default PosLayout;
