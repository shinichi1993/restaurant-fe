// AppSidebar.jsx – Sidebar/Menu điều hướng

import { Menu } from "antd";
import { Link } from "react-router-dom";
import {
  PieChartOutlined,
  UserOutlined,
  AppstoreOutlined,
  CoffeeOutlined,
  ShopOutlined,
  SolutionOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  SettingOutlined,
  BarChartOutlined,
  TableOutlined,
  SlidersOutlined,
} from "@ant-design/icons";

import { useNavigate, useLocation } from "react-router-dom";

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Active menu theo URL hiện tại
  const selectedKey = location.pathname;

  const menuItems = [
    { key: "/dashboard", icon: <PieChartOutlined />, label: "Dashboard" },
    { key: "/users", icon: <UserOutlined />, label: "Người dùng" },
    { key: "/categories", icon: <AppstoreOutlined />, label: "Danh mục" },
    { key: "/ingredients", icon: <ShopOutlined />, label: "Nguyên liệu" },
    { key: "/dishes", icon: <CoffeeOutlined />, label: "Món ăn" },
    { key: "/stock-entries", icon: <ShopOutlined />, label: "Nhập kho" },
    { key: "/recipes", icon: <SolutionOutlined />, label: "Định lượng" },
    { key: "/orders", icon: <FileTextOutlined />, label: "Order" },
    { key: "/payments", icon: <CreditCardOutlined />, label: "Thanh toán" },
    { key: "/tables", icon: <TableOutlined />, label: "Bàn"},
    {
      key: "report",
      icon: <BarChartOutlined />,
      label: "Báo cáo",
      children: [
        { key: "/reports/revenue", label: <Link to="/reports/revenue">Doanh thu</Link> },
        { key: "/reports/top-dishes", label: <Link to="/reports/top-dishes">Top món bán</Link> },
        { key: "/reports/ingredients", label: <Link to="/reports/ingredients">Nguyên liệu</Link> },
      ]
    },
    { key: "/roles", icon: <SolutionOutlined />, label: "Vai trò" },
    { key: "/permissions", icon: <FileTextOutlined />, label: "Quyền" },
    { key: "/audit-logs", icon: <FileTextOutlined />, label: "Kiểm tra log" },
    { key: "/settings", icon: <SlidersOutlined />, label: "Cài đặt" },
  ];

  const handleClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={handleClick}
    />
  );
}
