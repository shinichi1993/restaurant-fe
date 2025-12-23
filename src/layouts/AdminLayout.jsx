// AdminLayout.jsx – Layout chính (Header full width + Sidebar + Content + Footer)
// -----------------------------------------------------------------------------
// Layout chuẩn admin:
//   - Header full ngang (brand + notification + user)
//   - Sidebar nằm dưới header
//   - Content ở giữa
//   - Footer ở dưới content
// -----------------------------------------------------------------------------

import { Layout } from "antd";
import { Outlet } from "react-router-dom";

import { Button, Tooltip, Modal } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import AppSidebar from "../components/layout/AppSidebar";
import AppHeader from "../components/layout/AppHeader";
import AppFooter from "../components/layout/AppFooter";
import NotificationBell from "../components/notification/NotificationBell";

const { Header, Sider, Content, Footer } = Layout;

export default function AdminLayout() {
  const navigate = useNavigate();

  // Modal hiển thị khi bấm nút Quay lại chọn chế độ
  const handleBackToMode = () => {
    Modal.confirm({
      title: "Đổi chế độ làm việc?",
      content: "Các thao tác đang mở (chưa lưu) sẽ bị mất.",
      okText: "Đổi chế độ",
      cancelText: "Hủy",
      okType: "danger",
      onOk: () => {
        navigate("/mode");
      },
    });
  };

  // TẠO STYLE CHUNG CHO ACTION ITEM thẳng hàng với nhau
  const actionItemStyle = {
    height: 36,
    display: "flex",
    alignItems: "center",
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>

      {/* ================= HEADER FULL WIDTH ================= */}
      <Header
        style={{
          height: 64,
          padding: "0 24px",
          background: "#0f172a", // header đậm
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        {/* BÊN TRÁI: BRAND */}
        <div style={{ fontSize: 18, fontWeight: 600 }}>
          Restaurant Admin
        </div>

        {/* BÊN PHẢI: ACTION */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

          {/* ĐỔI CHẾ ĐỘ */}
          <div style={actionItemStyle}>
            <Tooltip title="Đổi chế độ làm việc">
              <Button
                type="default"
                icon={<ArrowLeftOutlined />}
                onClick={handleBackToMode}
                style={{
                  height: 36,
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.4)",
                  background: "transparent",
                }}
              >
                Đổi chế độ
              </Button>
            </Tooltip>
          </div>

          {/* NOTIFICATION */}
          <div style={actionItemStyle}>
            <NotificationBell />
          </div>

          {/* USER */}
          <div style={actionItemStyle}>
            <AppHeader />
          </div>

        </div>

      </Header>

      {/* ================= BODY ================= */}
      <Layout>

        {/* SIDEBAR */}
        <Sider
          width={220}
          style={{
            background: "#020617", // sidebar đậm hơn header
          }}
        >
          <AppSidebar />
        </Sider>

        {/* CONTENT + FOOTER */}
        <Layout>

          <Content
            style={{
              margin: 16,
              padding: 16,
              background: "#fff",
              borderRadius: 8,
              minHeight: "calc(100vh - 64px - 64px - 32px)",
              // header 64 + footer 64 + margin
            }}
          >
            <Outlet />
          </Content>

          <Footer
            style={{
              textAlign: "center",
              background: "#fff",
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <AppFooter />
          </Footer>

        </Layout>
      </Layout>
    </Layout>
  );
}
