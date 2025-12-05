// @ts-nocheck
// ======================================================================
// AdminLayout.jsx – Layout chính của hệ thống (Chuẩn Rule 14 & 27)
// ----------------------------------------------------------------------
// Bao gồm:
//  - Sidebar trái (AppSidebar)
//  - Header (AppHeader + NotificationBell)
//  - Footer (AppFooter)
//  - Content (Outlet)
// 
// QUY TẮC:
//  - AdminLayout chỉ được bọc **1 lần duy nhất** trong AppRoutes (Rule 14)
//  - KHÔNG chứa logic business, polling, API gọi trực tiếp
//  - Toàn bộ xử lý thông báo (notification) đặt trong NotificationBell.jsx
//  - UI chuẩn theo Rule 27: bố cục, màu sắc, padding, margin
//
// ======================================================================

import AppSidebar from "../components/layout/AppSidebar";
import AppHeader from "../components/layout/AppHeader";
import AppFooter from "../components/layout/AppFooter";

import NotificationBell from "../components/notification/NotificationBell";

import { Outlet } from "react-router-dom";
import { Layout } from "antd";

const { Sider, Header, Content, Footer } = Layout;

export default function AdminLayout() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      
      {/* ===========================================================
          SIDEBAR TRÁI – MENU chính
          Tuân theo Rule 27: Layout đẹp – khoảng cách chuẩn
      ============================================================ */}
      <Sider collapsible breakpoint="lg">
        <AppSidebar />
      </Sider>

      {/* ===========================================================
          KHU VỰC CHÍNH (Header + Content + Footer)
      ============================================================ */}
      <Layout>

        {/* -----------------------------------------------------------
            HEADER – chứa AppHeader và Chuông Notification
            - AppHeader (avatar, tên người dùng...)
            - NotificationBell (chuông thông báo Module 14)
            Lưu ý: padding=0 theo Rule 27 để UI đồng nhất
        ------------------------------------------------------------ */}
        <Header
          style={{
            padding: 0,
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Bên trái: thông tin user + menu hệ thống */}
          <AppHeader />

          {/* Bên phải: chuông thông báo realtime */}
          <NotificationBell />
        </Header>

        {/* -----------------------------------------------------------
            CONTENT – hiển thị nội dung từng trang
            Tuân theo Rule 27:
              - margin 16px
              - padding 16px
              - nền trắng
              - borderRadius 8px
              - tính chiều cao tự động (minHeight)
        ------------------------------------------------------------ */}
        <Content
          style={{
            margin: "16px",
            padding: 16,
            background: "#fff",
            borderRadius: 8,
            minHeight: "calc(100vh - 64px - 64px)",
          }}
        >
          {/* Router outlet – FE load page con */}
          <Outlet />
        </Content>

        {/* -----------------------------------------------------------
            FOOTER – text cuối trang
        ------------------------------------------------------------ */}
        <Footer style={{ background: "#fff" }}>
          <AppFooter />
        </Footer>

      </Layout>
    </Layout>
  );
}
