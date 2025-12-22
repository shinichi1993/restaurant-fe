// src/pages/mode/WorkingModePage.jsx
// ======================================================================
// WorkingModePage – Trang chọn chế độ làm việc sau khi login
//
// Yêu cầu:
//  - Hiển thị mode theo permission
//  - POS & POS Simple dùng chung permission ORDER_CREATE
//  - Kitchen tạm dùng ORDER_VIEW + RECIPE_VIEW (do chưa có KITCHEN_VIEW)
//  - Chọn mode → lưu localStorage + điều hướng đúng route
// ======================================================================

import { Card, Col, Row, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { APP_MODE } from "../../constants/appMode";
import { setWorkingMode } from "../../utils/modeStorage";
import {
  getPermissionsFromStorage,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "../../hooks/usePermission";

const { Title, Text } = Typography;

export default function WorkingModePage() {
  const navigate = useNavigate();
  const perms = getPermissionsFromStorage();

  /**
   * Kiểm tra quyền cho từng mode
   * Lưu ý:
   * - POS & POS Simple: chung ORDER_CREATE (m đã chốt)
   * - Kitchen: tạm dùng ORDER_VIEW + RECIPE_VIEW (đúng theo migration role KITCHEN)
   * - Admin: nếu có bất kỳ quyền “backoffice”/quản trị nào thì cho vào ADMIN
   */
  const canUsePos = hasPermission("ORDER_CREATE");
  const canUseKitchen = hasAllPermissions(["ORDER_VIEW", "RECIPE_VIEW"]);

  // Admin mode: chỉ cần có 1 quyền quản trị/vận hành (bền vững hơn hard-code role)
  // Nếu chỉ có đúng ORDER_CREATE (thu ngân) thì không show admin.
  // Nếu chỉ có đúng ORDER_VIEW, RECIPE_VIEW (bếp) thì không show admin.
  const canUseAdmin = (() => {
    if (!perms || perms.length === 0) return false;
    if (perms.length === 1 && perms.includes("ORDER_CREATE")) return false;
    if (perms.length === 2 && perms.includes("ORDER_VIEW") && perms.includes("RECIPE_VIEW")) return false;

    // Có ít nhất 1 trong các quyền backoffice phổ biến → coi như có thể vào Admin
    return hasAnyPermission([
      "USER_VIEW",
      "ROLE_VIEW",
      "PERMISSION_VIEW",
      "SETTING_VIEW",
      "AUDIT_VIEW",
      "ADMIN_BACKUP",
      "REPORT_REVENUE",
      "REPORT_TOP_DISH",
      "REPORT_INGREDIENT",
      "STOCK_VIEW",
      "INGREDIENT_VIEW",
      "CATEGORY_VIEW",
      "DISH_VIEW",
      "RECIPE_VIEW",
      "ORDER_VIEW",
      "PAYMENT_VIEW",
      "INVOICE_VIEW",
    ]);
  })();

  /**
   * Chọn mode và điều hướng
   * @param {string} mode
   */
  const handleSelectMode = (mode) => {
    setWorkingMode(mode);

    // Điều hướng theo mode (baseline kiến trúc đã chốt)
    if (mode === APP_MODE.ADMIN) {
      navigate("/dashboard");
      return;
    }
    if (mode === APP_MODE.POS) {
      // EPIC 4A – Vào POS Home (menu lớn) thay vì vào thẳng màn bàn
      navigate("/pos");
      return;
    }
    if (mode === APP_MODE.POS_SIMPLE) {
      navigate("/pos/simple");
      return;
    }
    if (mode === APP_MODE.KITCHEN) {
      navigate("/pos/kitchen");
      return;
    }

    // Fallback an toàn
    navigate("/dashboard");
  };

  // Danh sách card mode được hiển thị
  const modeCards = [
    {
      mode: APP_MODE.ADMIN,
      title: "Quản trị",
      desc: "Quản lý hệ thống, báo cáo, cấu hình, danh mục…",
      visible: canUseAdmin,
    },
    {
      mode: APP_MODE.POS,
      title: "POS (Chính)",
      desc: "Chọn bàn → gọi món → gửi bếp → thanh toán \n ORDER",
      visible: canUsePos,
    },
    {
      mode: APP_MODE.POS_SIMPLE,
      title: "POS (Nhanh)",
      desc: "Bán nhanh / takeaway – thao tác gọn",
      visible: canUsePos,
    },
    {
      mode: APP_MODE.KITCHEN,
      title: "Bếp (Kitchen)",
      desc: "Nhận món realtime, cập nhật trạng thái chế biến",
      visible: canUseKitchen,
    },
  ].filter((x) => x.visible);

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#f0f2f5" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Title level={3} style={{ marginBottom: 6 }}>
          Chọn chế độ làm việc
        </Title>
        <Text type="secondary">
          Mỗi chế độ sẽ có giao diện và luồng thao tác riêng, giống hệ thống POS ngoài thực tế.
        </Text>

        <Row gutter={[16, 16]} style={{ marginTop: 18 }}>
          {modeCards.map((m) => (
            <Col key={m.mode} xs={24} md={12} lg={8}>
              <Card
                hoverable
                variant="borderless" // ✅ Rule 29
                style={{ borderRadius: 12, height: "100%" }}
                onClick={() => handleSelectMode(m.mode)}
              >
                <Title level={4} style={{ marginTop: 0 }}>
                  {m.title}
                </Title>
                <Text type="secondary">{m.desc}</Text>
              </Card>
            </Col>
          ))}
        </Row>

        {modeCards.length === 0 && (
          <Card style={{ marginTop: 16 }} variant="borderless">
            <Text type="danger">
              Tài khoản của bạn chưa có quyền cho bất kỳ chế độ nào. Vui lòng liên hệ quản trị hệ thống.
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
}
