import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import AdminLayout from "../layouts/AdminLayout";
import PrivateRoute from "../components/common/PrivateRoute";
import DashboardPage from "../pages/dashboard/DashboardPage";
import UserPage from "../pages/user/UserPage";
import IngredientPage from "../pages/ingredient/IngredientPage";
import StockEntryPage from "../pages/stock/StockEntryPage";
import CategoryPage from "../pages/category/CategoryPage";
import DishPage from "../pages/dish/DishPage";
import RecipePage from "../pages/recipe/RecipePage";
import OrderPage from "../pages/order/OrderPage";
import OrderCreatePage from "../pages/order/OrderCreatePage";
import InvoiceDetailPage from "../pages/invoice/InvoiceDetailPage";
import PaymentPage from "../pages/payment/PaymentPage";
import RevenueReportPage from "../pages/report/RevenueReportPage";
import TopDishReportPage from "../pages/report/TopDishReportPage";
import IngredientReportPage from "../pages/report/IngredientReportPage";
import RolePage from "../pages/role/RolePage";
import PermissionPage from "../pages/permission/PermissionPage";
import AuditLogPage from "../pages/audit/AuditLogPage";
import TablePage from "../pages/table/TablePage"; 
import AdvancedSettingsPage from "../pages/settings/AdvancedSettingsPage";

// ⭐ THÊM IMPORT POS ROUTES
import { renderPosRoutes } from "./PosRoutes";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login – không dùng layout */}
        <Route path="/login" element={<LoginPage />} />

        {/* Các route yêu cầu đăng nhập */}
        <Route element={<PrivateRoute />}>

          {/* ⭐ POS Routes – nằm ngoài AdminLayout */}
          {renderPosRoutes()}

          {/* ⭐ Admin Routes – bọc trong AdminLayout */}
          <Route path="/" element={<AdminLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Users */}
            <Route path="users" element={<UserPage />} />

            {/* Ingredient */}
            <Route path="ingredients" element={<IngredientPage />} />

            {/* Stock Entry */}
            <Route path="stock-entries" element={<StockEntryPage />} />

            {/* Category & Dish */}
            <Route path="categories" element={<CategoryPage />} />
            <Route path="dishes" element={<DishPage />} />

            {/* Recipe */}
            <Route path="recipes" element={<RecipePage />} />

            {/* Orders */}
            <Route path="orders" element={<OrderPage />} />
            <Route path="orders/create" element={<OrderCreatePage />} />

            {/* 👉 Invoice Detail (Module 09) */}
            <Route path="invoices/:invoiceId" element={<InvoiceDetailPage />} />

            {/* ⭐ PAYMENT – Module 10 */}
            <Route path="payments" element={<PaymentPage />} />

            <Route path="reports/revenue" element={<RevenueReportPage />} />
            <Route path="reports/top-dishes" element={<TopDishReportPage />} />
            <Route path="reports/ingredients" element={<IngredientReportPage />} />

            <Route path="roles" element={<RolePage />} />
            <Route path="permissions" element={<PermissionPage />} />

            {/* Audit Log */}
            <Route path="audit-logs" element={<AuditLogPage />} />

            {/* MODULE 16: TABLE MANAGEMENT */}
            <Route path="tables" element={<TablePage />} />

            {/* Settings */}
            <Route path="settings" element={<AdvancedSettingsPage  />} />

          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
