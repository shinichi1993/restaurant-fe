// src/layouts/MobileAdminLayout.jsx
// ======================================================================
// MobileAdminLayout – Layout dành cho Mobile Admin (Phase 5.4.1)
// ----------------------------------------------------------------------
// Mục tiêu:
//  - Tạo layout riêng cho giao diện Mobile Admin
//  - KHÔNG dùng sidebar cố định như desktop (AdminLayout)
//  - Header gọn để thao tác bằng 1 tay:
//      + Nút menu (☰) mở Drawer
//      + Tiêu đề
//      + Chuông NotificationBell (re-use Module Notification hiện có)
//  - Content full width, padding nhỏ hơn desktop
//
// Nguyên tắc:
//  - File này CHỈ là layout UI, KHÔNG gọi API business
//  - Không polling, không xử lý socket ở đây
//  - Các trang con vẫn render qua <Outlet />
//
// Ghi chú:
//  - Drawer sẽ dùng AppSidebar hiện có để tái sử dụng menu + permission logic
//  - Ở Phase 5.4.2 sẽ tạo AdminLayoutWrapper để switch Desktop/Mobile bằng useMediaQuery
// ======================================================================

import { useMemo, useState } from "react";
import { Layout, Drawer, Button, Typography, Space } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

// Re-use các component hiện có của web admin
import AppSidebar from "../components/layout/AppSidebar";
import AppFooter from "../components/layout/AppFooter";
import NotificationBell from "../components/notification/NotificationBell";

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

export default function MobileAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // ------------------------------------------------------------
  // State mở/đóng Drawer menu
  // ------------------------------------------------------------
  const [openMenu, setOpenMenu] = useState(false);

  // ------------------------------------------------------------
  // Tạo tiêu đề ngắn theo route hiện tại (đơn giản – MVP)
  // - Không hardcode hết route để tránh sai/thiếu
  // - Có thể nâng cấp mapping title chi tiết ở Phase 5.4.4
  // ------------------------------------------------------------
  const pageTitle = useMemo(() => {
    // Ví dụ: /dashboard, /orders, /payments...
    const path = location.pathname || "";
    if (path.includes("/dashboard")) return "Dashboard";
    if (path.includes("/orders")) return "Đơn hàng";
    if (path.includes("/payments")) return "Thanh toán";
    if (path.includes("/invoices")) return "Hóa đơn";
    if (path.includes("/reports")) return "Báo cáo";
    if (path.includes("/audit-logs")) return "Audit log";
    if (path.includes("/admin/backup-restore")) return "Backup/Restore";
    if (path.includes("/settings")) return "Cài đặt";
    if (path.includes("/members")) return "Hội viên";
    if (path.includes("/tables")) return "Bàn";
    return "Mobile Admin";
  }, [location.pathname]);

  // ------------------------------------------------------------
  // Mở Drawer menu
  // ------------------------------------------------------------
  const handleOpenMenu = () => setOpenMenu(true);

  // ------------------------------------------------------------
  // Đóng Drawer menu
  // ------------------------------------------------------------
  const handleCloseMenu = () => setOpenMenu(false);

  // ------------------------------------------------------------
  // Khi user chọn menu trong Drawer:
  // - AppSidebar hiện tại thường đã tự điều hướng khi click menu item
  // - Nhưng để chắc chắn UX, ta đóng Drawer ngay khi route thay đổi
  //   (cách đơn giản: đóng menu khi click vào vùng Drawer hoặc khi user bấm item)
  //
  // Lưu ý:
  // - Ở đây t KHÔNG can thiệp logic nội bộ AppSidebar để tránh phá rule permission.
  // - Nếu m muốn đóng Drawer ngay khi click item, Phase 5.4.2 ta sẽ tinh chỉnh thêm.
  // ------------------------------------------------------------

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* ==========================================================
          HEADER MOBILE – gọn, dễ thao tác
      =========================================================== */}
      <Header
        style={{
          padding: "0 12px",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Bên trái: nút menu + title */}
        <Space size={10} align="center">
          <Button
            type="default"
            variant="outlined"
            icon={<MenuOutlined />}
            onClick={handleOpenMenu}
            aria-label="Mở menu"
          />
          <Text strong style={{ fontSize: 16 }}>
            {pageTitle}
          </Text>
        </Space>

        {/* Bên phải: NotificationBell (re-use, không login lại) */}
        <NotificationBell />
      </Header>

      {/* ==========================================================
          DRAWER MENU – dùng AppSidebar để tái sử dụng permission/menu
      =========================================================== */}
      <Drawer
        title="Menu"
        placement="left"
        open={openMenu}
        onClose={handleCloseMenu}
        width={280}
        bodyStyle={{ padding: 0 }}
      >
        {/* 
          Re-use AppSidebar hiện có:
          - Menu item click sẽ navigate
          - Permission ẩn/hiện giữ nguyên như desktop
        */}
        <div onClick={() => setOpenMenu(false)}>
          <AppSidebar />
        </div>

        {/* 
          (Tuỳ chọn) Nút về Dashboard cho nhanh
          - Nếu m thấy thừa thì có thể bỏ, nhưng hiện tại giữ cho mobile dễ dùng
        */}
        <div style={{ padding: 12 }}>
          <Button
            type="primary"
            variant="solid"
            block
            onClick={() => {
              setOpenMenu(false);
              navigate("/dashboard");
            }}
          >
            Về Dashboard
          </Button>
        </div>
      </Drawer>

      {/* ==========================================================
          CONTENT MOBILE – full width, padding nhỏ
      =========================================================== */}
      <Content
        style={{
          padding: 12,
          background: "#fff",
          minHeight: "calc(100vh - 56px - 48px)", // header ~56px, footer ~48px (ước lượng)
        }}
      >
        {/* Render page con */}
        <Outlet />
      </Content>

      {/* ==========================================================
          FOOTER MOBILE – tối giản, re-use AppFooter
      =========================================================== */}
      <Footer style={{ background: "#fff", padding: "10px 12px" }}>
        <AppFooter />
      </Footer>
    </Layout>
  );
}
