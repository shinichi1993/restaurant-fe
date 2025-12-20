// src/routes/PosRoutes.jsx
// --------------------------------------------------------------
// PosRoutes – Định nghĩa toàn bộ route dành riêng cho chế độ POS
// Mục đích:
//  - Gom tất cả đường dẫn bắt đầu bằng /pos vào một nơi
//  - Bọc chúng bằng PosLayout (layout riêng cho tablet)
//  - Không đụng gì đến AdminLayout (Rule 14)
// --------------------------------------------------------------

import { Route } from "react-router-dom";
import PosLayout from "../layouts/PosLayout";

// ⚠️ Lưu ý: 3 page dưới đây sẽ được tạo ở các bước sau trong Module 19
// Tạm thời cứ import sẵn, nếu chưa tạo file thì IDE sẽ báo lỗi, 
// nhưng đó là lỗi "chưa tạo file" chứ không phải logic sai.
import PosTablePage from "../pages/pos/PosTablePage";
import PosOrderPage from "../pages/pos/PosOrderPage";
import PosOrderSummaryPage from "../pages/pos/PosOrderSummaryPage";
import PosKitchenPage from "../pages/pos/KitchenPage";

import SimplePosTablePage from "../pages/pos/simple/SimplePosTablePage";
import SimplePosOrderPage from "../pages/pos/simple/SimplePosOrderPage";

import TabletPosEntry from "../pages/pos/tablet/TabletPosEntry";
/**
 * Hàm renderPosRoutes
 * ----------------------------------------------------
 * - Hàm này trả về một nhánh <Route> của react-router-dom
 * - Nhánh này sẽ được dùng trong AppRoutes.jsx
 * - Mục tiêu là tách logic POS ra khỏi file AppRoutes cho gọn
 *
 * Cách dùng trong AppRoutes.jsx:
 *
 *   import { renderPosRoutes } from "./PosRoutes";
 *
 *   <Routes>
 *     {renderPosRoutes()}
 *     ...các route khác (admin)...
 *   </Routes>
 *
 * Như vậy:
 *  - Tất cả route bắt đầu với /pos đều dùng PosLayout
 *  - AdminLayout vẫn chỉ bọc các route admin (/admin/...)
 */
export const renderPosRoutes = () => {
  return (
    <Route path="/pos" element={<PosLayout />}>
      {/* 
        Trang danh sách bàn ở chế độ POS
        URL: /pos/table
        - Sẽ hiển thị danh sách bàn dạng lưới (grid)
        - Khi chọn 1 bàn → chuyển sang màn order
      */}
      <Route path="table" element={<PosTablePage />} />

      {/* 
        Trang order cho 1 bàn cụ thể
        URL: /pos/table/:tableId/order
        - Hiển thị danh sách món + giỏ hàng
        - :tableId là param trên URL, dùng useParams() để đọc
      */}
      <Route path="table/:tableId/order" element={<PosOrderPage />} />

      {/* 
        Trang xác nhận order trước khi gửi
        URL: /pos/table/:tableId/summary
        - Nhận dữ liệu giỏ hàng từ state điều hướng (navigate)
        - Gửi order (POST/PUT) lên server
      */}
      <Route
        path="table/:tableId/summary"
        element={<PosOrderSummaryPage />}
      />

      <Route path="kitchen" element={<PosKitchenPage />} />

      <Route path="simple" element={<SimplePosTablePage />} />
      <Route path="simple/order" element={<SimplePosOrderPage />} /> 

      <Route path="tablet" element={<TabletPosEntry />} />

    </Route>
  );
};
