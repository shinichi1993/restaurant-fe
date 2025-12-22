// src/components/common/ModeRoute.jsx
// ======================================================================
// ModeRoute – Chặn route theo Working Mode
// ------------------------------------------------
// - Dùng chung trong AppRoutes / PosRoutes
// - Nếu chưa chọn mode → chuyển sang /mode
// - Nếu mode không hợp lệ → chuyển sang /mode
// ======================================================================

import { Navigate, Outlet } from "react-router-dom";
import { getWorkingMode } from "../../utils/modeStorage";

/**
 * @param {Object} props
 * @param {string[]} props.allowModes - danh sách mode được phép vào nhánh route này
 */
export default function ModeRoute({ allowModes = [] }) {
  const mode = getWorkingMode();

  // Chưa chọn mode → bắt buộc vào trang chọn mode
  if (!mode) {
    return <Navigate to="/mode" replace />;
  }

  // Mode không nằm trong danh sách cho phép → quay về chọn mode
  if (allowModes.length > 0 && !allowModes.includes(mode)) {
    return <Navigate to="/mode" replace />;
  }

  return <Outlet />;
}
