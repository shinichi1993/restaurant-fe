// PermissionRoute.jsx – Chặn route theo permission
// ------------------------------------------------
// - Dùng chung trong AppRoutes
// - Nếu thiếu quyền → chuyển sang /403
// ------------------------------------------------

import { Navigate, Outlet } from "react-router-dom";
import { hasPermission } from "../../hooks/usePermission";

export default function PermissionRoute({ permission }) {
  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
