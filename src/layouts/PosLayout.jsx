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

  const isTabletMode = sessionStorage.getItem("POS_UI_MODE") === "TABLET";

  const handleLogout = () => {
    // TODO: Xoá token + chuyển về login sau này
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Header POS */}
      <PosHeader />

      <Content style={{ 
        padding: isTabletMode ? 8 : 16,
        maxWidth: isTabletMode ? "100%" : 1200,
        margin: "0 auto",
        }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default PosLayout;
