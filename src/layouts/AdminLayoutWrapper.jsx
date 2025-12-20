// src/layouts/AdminLayoutWrapper.jsx
// ======================================================================
// AdminLayoutWrapper – Phase 5.4.2 (Mobile Admin)
// ----------------------------------------------------------------------
// NHIỆM VỤ:
//  - Tự động chọn layout phù hợp theo kích thước màn hình
//      + Desktop  → AdminLayout
//      + Mobile   → MobileAdminLayout
//
// NGUYÊN TẮC THIẾT KẾ:
//  - KHÔNG thay đổi routing
//  - KHÔNG ảnh hưởng POS (/pos)
//  - KHÔNG yêu cầu đăng nhập lại
//  - AdminLayout & MobileAdminLayout đều dùng chung Outlet
//
// CÁCH PHÁT HIỆN MOBILE:
//  - Dùng width qua useMediaQuery
//  - Không dùng userAgent (tránh sai lệch)
//
// ======================================================================

import { Outlet, useLocation } from "react-router-dom";
import { Grid } from "antd";

import AdminLayout from "./AdminLayout";
import MobileAdminLayout from "./MobileAdminLayout";

const { useBreakpoint } = Grid;

export default function AdminLayoutWrapper() {

  // ------------------------------------------------------------
  // Lấy breakpoint hiện tại từ Ant Design
  // ------------------------------------------------------------
  const screens = useBreakpoint();

  /**
   * Quy ước:
   *  - Mobile: màn hình < md ( < 768px )
   *  - Desktop: từ md trở lên
   *
   * Ant Design breakpoint:
   *  xs < 576
   *  sm ≥ 576
   *  md ≥ 768
   */
  const isMobile = !screens.md;

  // ------------------------------------------------------------
  // BẢO VỆ POS:
  //  - Nếu route bắt đầu bằng /pos
  //  - TUYỆT ĐỐI không dùng Admin / MobileAdmin layout
  // ------------------------------------------------------------
  const location = useLocation();
  const isPosRoute = location.pathname.startsWith("/pos");

  if (isPosRoute) {
    // POS đã có PosLayout riêng → không can thiệp
    return <Outlet />;
  }

  // ------------------------------------------------------------
  // CHỌN LAYOUT THEO DEVICE
  // ------------------------------------------------------------
  if (isMobile) {
    return (
      <MobileAdminLayout>
        <Outlet />
      </MobileAdminLayout>
    );
  }

  // Desktop (mặc định)
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
