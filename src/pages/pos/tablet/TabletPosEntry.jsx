// TabletPosEntry.jsx
// ------------------------------------------------------------------
// Entry point cho Tablet POS (POS chuẩn – Advanced)
// Nhiệm vụ:
//  - Đánh dấu hệ thống đang ở Tablet Mode
//  - Điều hướng về trang chọn bàn của POS chuẩn
//  - KHÔNG render UI
// ------------------------------------------------------------------

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TabletPosEntry = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Đánh dấu đang ở Tablet Mode
    // Dùng sessionStorage để:
    //  - Không ảnh hưởng POS desktop
    //  - Reset khi reload tab
    sessionStorage.setItem("POS_UI_MODE", "TABLET");

    // Điều hướng sang trang chọn bàn POS chuẩn
    navigate("/pos/table", { replace: true });
  }, [navigate]);

  return null; // Không render gì cả
};

export default TabletPosEntry;
