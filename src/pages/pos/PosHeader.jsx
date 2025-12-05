// src/components/pos/PosHeader.jsx
// -------------------------------------------------------------
// Header cho chế độ POS
//  - Hiển thị nút về quản trị
//  - Hiển thị nút Đăng xuất
//  - Logout xóa token + chuyển về trang login
// -------------------------------------------------------------

import { Button, Space } from "antd";
import { useNavigate } from "react-router-dom";

const PosHeader = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  return (
    <div
      style={{
        width: "100%",
        background: "#001529",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
      }}
    >
      <Space>
        <Button
          variant="outlined"
          onClick={() => navigate("/dashboard")}
        >
          Về trang quản trị
        </Button>

        <Button
          type="primary"
          variant="solid"
          danger
          onClick={handleLogout}
        >
          Đăng xuất
        </Button>
      </Space>
    </div>
  );
};

export default PosHeader;
