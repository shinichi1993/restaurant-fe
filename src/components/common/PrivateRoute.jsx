// PrivateRoute.jsx – bảo vệ route
// Nếu chưa đăng nhập → chuyển sang /login

import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute() {
  const token = localStorage.getItem("accessToken");

  console.log("PrivateRoute chạy, token =", localStorage.getItem("accessToken"));

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
