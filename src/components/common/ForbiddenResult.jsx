import { Result } from "antd";

/**
 * ForbiddenResult
 * --------------------------------------------------
 * UI hiển thị khi user không có quyền xem page
 * Dùng bên trong page (VD: DishPage)
 * --------------------------------------------------
 */
export default function ForbiddenResult() {
  return (
    <Result
      status="403"
      title="Không có quyền"
      subTitle="Bạn không có quyền xem trang này."
    />
  );
}
