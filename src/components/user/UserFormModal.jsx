// UserFormModal.jsx – Modal thêm / sửa người dùng
// --------------------------------------------------------------------
// Quy ước Phase 4.1:
//  - TẠO USER: chỉ tạo app_user
//  - GÁN ROLE: xử lý riêng qua user_role
// --------------------------------------------------------------------

import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
} from "antd";
import { useEffect, useState } from "react";

import { createUser, updateUser } from "../../api/userApi";
import { getRoles } from "../../api/roleApi";
import { updateUserRoles } from "../../api/userApi"; // 👈 thêm

export default function UserFormModal({ open, onClose, user, reload }) {
  const [form] = Form.useForm();
  const [roleList, setRoleList] = useState([]);
  const [loading, setLoading] = useState(false);

  // -----------------------------------------------------------
  // Load danh sách role từ BE
  // -----------------------------------------------------------
  useEffect(() => {
    const loadRoles = async () => {
      const data = await getRoles();
      setRoleList(data || []);
    };
    loadRoles();
  }, []);

  // -----------------------------------------------------------
  // Khi mở modal:
  //  - SỬA → fill form
  //  - THÊM → reset form
  // -----------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    if (user) {
      form.setFieldsValue({
        username: user.username,
        fullName: user.fullName,
        role: user.roles?.[0] || null,
        status: user.status,
      });
    } else {
      form.resetFields();
    }
  }, [open, user, form]);

  // -----------------------------------------------------------
  // Submit form
  // -----------------------------------------------------------
  const onFinish = async (values) => {
    try {
      setLoading(true);

      if (user) {
        // ================== SỬA USER ==================
        await updateUser(user.id, {
          fullName: values.fullName,
          status: values.status,
        });

        // Gán lại role (Phase 4.1)
        await updateUserRoles(user.id, [values.role]);

        message.success("Cập nhật người dùng thành công");
      } else {
        // ================== TẠO USER ==================
        const created = await createUser({
          username: values.username,
          password: values.password,
          fullName: values.fullName,
        });

        // Gán role sau khi tạo
        await updateUserRoles(created.id, [values.role]);

        message.success("Thêm người dùng thành công");
      }

      onClose();
      reload();
    } catch (err) {
      console.error(err);
      message.error("Lưu dữ liệu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={user ? "Cập nhật người dùng" : "Thêm người dùng"}
      footer={null}
      destroyOnClose // 👈 QUAN TRỌNG
    >
      <Form layout="vertical" form={form} onFinish={onFinish}>
        {!user && (
          <>
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true }]}
            >
              <Input.Password />
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Họ tên"
          name="fullName"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Vai trò"
          name="role"
          rules={[{ required: true }]}
        >
          <Select
            placeholder="Chọn vai trò"
            options={roleList.map((r) => ({
              value: r.code,
              label: r.name,
            }))}
          />
        </Form.Item>

        {user && (
          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "ACTIVE", label: "Hoạt động" },
                { value: "INACTIVE", label: "Ngừng hoạt động" },
              ]}
            />
          </Form.Item>
        )}

        <Button type="primary" htmlType="submit" block loading={loading}>
          {user ? "Cập nhật" : "Thêm mới"}
        </Button>
      </Form>
    </Modal>
  );
}
