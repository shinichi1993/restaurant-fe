// UserRoleModal.jsx – Modal gán vai trò cho user
// -----------------------------------------------------------
// Chức năng:
//  - Hiển thị danh sách role lấy từ BE (KHÔNG hard-code)
//  - Cho phép gán nhiều role cho 1 user
//  - Submit gọi API cập nhật user_role
// -----------------------------------------------------------
// Lưu ý:
//  - Comment tiếng Việt (Rule 13)
//  - UI theo Rule 27
// -----------------------------------------------------------

import { Modal, Checkbox, Space, message } from "antd";
import { useEffect, useState } from "react";
import { getUserRoles, updateUserRoles } from "../../api/userApi";

export default function UserRoleModal({
  open,
  onClose,
  user,
  roles = [], // 👈 danh sách role từ BE
  onUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState([]); // danh sách role codes đã tick

  // -----------------------------------------------------------
  // Load role hiện tại của user khi mở modal
  // -----------------------------------------------------------
  useEffect(() => {
    const fetchRoles = async () => {
      if (!open || !user?.id) return;
      try {
        setLoading(true);
        const res = await getUserRoles(user.id);
        setChecked(res.roles || []);
      } catch (e) {
        console.error("Lỗi load roles:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, [open, user?.id]);

  // -----------------------------------------------------------
  // Submit cập nhật role cho user
  // -----------------------------------------------------------
  const handleOk = async () => {
    try {
      if (!checked || checked.length === 0) {
        message.warning("Vui lòng chọn ít nhất 1 vai trò");
        return;
      }

      setLoading(true);
      await updateUserRoles(user.id, checked);
      message.success("Cập nhật vai trò thành công");

      onClose();
      onUpdated?.();
    } catch (e) {
      console.error("Lỗi update roles:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Gán vai trò – ${user?.username || ""}`}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Checkbox.Group
          value={checked}
          onChange={(vals) => setChecked(vals)}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          {roles.map((r) => (
            <Checkbox key={r.id} value={r.code}>
              {r.name} ({r.code})
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Space>
    </Modal>
  );
}
