// AppSidebar.jsx – Sidebar/Menu điều hướng
import { hasAnyPermission, hasPermission } from "../../hooks/usePermission";

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
    hasPermission("USER_VIEW") && { key: "/users", icon: <UserOutlined />, label: "Người dùng", },
    hasPermission("MEMBER_VIEW") && { key: "/members", icon: <UserOutlined />, label: "Hội viên" },
    hasPermission("CATEGORY_VIEW") && { key: "/categories", icon: <AppstoreOutlined />, label: "Danh mục" },
    hasPermission("INGREDIENT_VIEW") && { key: "/ingredients", icon: <ShopOutlined />, label: "Nguyên liệu" },
    hasPermission("DISH_VIEW") && { key: "/dishes", icon: <CoffeeOutlined />, label: "Món ăn", requiredPermission: "DISH_VIEW" },
    hasPermission("STOCK_VIEW") && { key: "/stock-entries", icon: <ShopOutlined />, label: "Nhập kho" },
    hasPermission("RECIPE_VIEW") && { key: "/recipes", icon: <SolutionOutlined />, label: "Định lượng" },
    hasPermission("ORDER_VIEW") && { key: "/orders", icon: <FileTextOutlined />, label: "Order" },
    hasPermission("PAYMENT_VIEW") && { key: "/payments", icon: <CreditCardOutlined />, label: "Thanh toán" },
    hasPermission("TABLE_VIEW") && { key: "/tables", icon: <TableOutlined />, label: "Bàn"},
    hasAnyPermission([
      "REPORT_REVENUE",
      "REPORT_TOP_DISH",
      "REPORT_INGREDIENT",
    ]) && {
      key: "report",
      icon: <BarChartOutlined />,
      label: "Báo cáo",
      requiredAnyPermission: [
      "REPORT_REVENUE",
      "REPORT_TOP_DISH",
      "REPORT_INGREDIENT",
      ],
      children: [
        hasPermission("REPORT_REVENUE") && { key: "/reports/revenue", label: <Link to="/reports/revenue">Doanh thu</Link>, },
        hasPermission("REPORT_REVENUE") && { key: "/reports/top-dishes", label: <Link to="/reports/top-dishes">Top món bán</Link>, },
        hasPermission("REPORT_REVENUE") && { key: "/reports/ingredients", label: <Link to="/reports/ingredients">Nguyên liệu</Link>, },
      ]
    },
    hasPermission("ROLE_VIEW") && { key: "/roles", icon: <SolutionOutlined />, label: "Vai trò", },
    { key: "/permissions", icon: <FileTextOutlined />, label: "Quyền" },
    hasPermission("AUDIT_VIEW") && { key: "/audit-logs", icon: <FileTextOutlined />, label: "Kiểm tra log" },
    hasPermission("SETTING_VIEW") && { key: "/settings", icon: <SlidersOutlined />, label: "Cài đặt" },
    hasPermission("ADMIN_BACKUP") && { key: "/admin/backup-restore", icon: <SlidersOutlined />, label: "Lưu trữ, phục hồi data" },
  ];

  const handleClick = ({ key }) => {
    navigate(key);
  };

  const filteredMenuItems = menuItems
    .filter((item) => {
      if (item.requiredPermission) {
        return hasPermission(item.requiredPermission);
      }
      if (item.requiredAnyPermission) {
        return hasAnyPermission(item.requiredAnyPermission);
      }
      return true;
    })
    .map((item) => {
      // Nếu có children → filter tiếp children
      if (item.children) {
        const children = item.children.filter((child) => {
          if (child.requiredPermission) {
            return hasPermission(child.requiredPermission);
          }
          return true;
        });
        return { ...item, children };
      }
      return item;
    });

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={filteredMenuItems}
      onClick={handleClick}
    />
  );
}
