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

import ModeRoute from "../components/common/ModeRoute";
import { APP_MODE } from "../constants/appMode";

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
import PosOrderListPage from "../pages/pos/PosOrderListPage";
import PosHomePage from "../pages/pos/PosHomePage";
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
    <Route element={<ModeRoute allowModes={[APP_MODE.POS, APP_MODE.POS_SIMPLE, APP_MODE.KITCHEN]} />}>
      <Route path="/pos" element={<PosLayout />}>
        {/* POS theo bàn – chỉ cho mode POS */}
        <Route element={<ModeRoute allowModes={[APP_MODE.POS]} />}>
          {/* ==========================================================
          EPIC 4A – POS Home (Menu lớn)
          - Route index: /pos
          - Tablet/mobile vào POS sẽ thấy menu thay vì vào thẳng màn bàn
          ========================================================== */}
          <Route index element={<PosHomePage />} />
          
          <Route path="table" element={<PosTablePage />} />
          <Route path="table/:tableId/order" element={<PosOrderPage />} />
          <Route path="table/:tableId/summary" element={<PosOrderSummaryPage />} />
          <Route path="tablet" element={<TabletPosEntry />} />
          {/* ==========================================================
          - Hiển thị danh sách order chưa thanh toán
          - Thanh toán/in hóa đơn mà không cần vào Order Admin
           ========================================================== */}
          <Route path="orders" element={<PosOrderListPage />} />
        </Route>

        {/* Kitchen – chỉ cho mode KITCHEN */}
        <Route element={<ModeRoute allowModes={[APP_MODE.KITCHEN]} />}>
          <Route path="kitchen" element={<PosKitchenPage />} />
        </Route>

        {/* POS Simple – chỉ cho mode POS_SIMPLE */}
        <Route element={<ModeRoute allowModes={[APP_MODE.POS_SIMPLE]} />}>
          <Route path="simple" element={<SimplePosTablePage />} />
          <Route path="simple/order" element={<SimplePosOrderPage />} />
        </Route>
      </Route>
    </Route>
  );
};

