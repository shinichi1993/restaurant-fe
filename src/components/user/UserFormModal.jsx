// UserFormModal.jsx – Modal thêm / sửa người dùng
// --------------------------------------------------------------------
// Dùng trong UserPage.jsx
// Nếu có props.user → modal ở chế độ SỬA
// Nếu user = null → modal ở chế độ THÊM MỚI
// --------------------------------------------------------------------
// Form theo đúng BE DTO:
//  - THÊM: username, password, fullName, role
//  - SỬA: fullName, role, status
// --------------------------------------------------------------------

import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
} from "antd";
import { useEffect } from "react";

import {
  createUser,
  updateUser,
} from "../../api/userApi";

export default function UserFormModal({ open, onClose, user, reload }) {
  const [form] = Form.useForm();

  // --------------------------------------------------------------
  // Khi mở modal → nếu là sửa thì fill dữ liệu vào form
  // --------------------------------------------------------------
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      });
    } else {
      form.resetFields();
    }
  }, [user, form]);

  // --------------------------------------------------------------
  // Submit Form – Tạo mới hoặc cập nhật
  // --------------------------------------------------------------
  const onFinish = async (values) => {
    try {
      if (user) {
        // -------------------- SỬA USER --------------------
        await updateUser(user.id, {
          fullName: values.fullName,
          role: values.role,
          status: values.status,
        });

        message.success("Cập nhật người dùng thành công");
      } else {
        // -------------------- THÊM MỚI USER --------------------
        await createUser({
          username: values.username,
          password: values.password,
          fullName: values.fullName,
          role: values.role,
        });

        message.success("Thêm người dùng thành công");
      }

      onClose();
      reload();
    } catch (err) {
      console.error(err);
      message.error("Lưu dữ liệu thất bại");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={user ? "Cập nhật người dùng" : "Thêm người dùng"}
      footer={null}
      destroyOnHidden
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
      >
        {/* TRƯỜNG USERNAME chỉ hiển thị khi tạo mới */}
        {!user && (
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[
              { required: true, message: "Vui lòng nhập tên đăng nhập" },
            ]}
          >
            <Input placeholder="Nhập username" />
          </Form.Item>
        )}

        {/* TRƯỜNG PASSWORD chỉ hiển thị khi tạo mới */}
        {!user && (
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>
        )}

        <Form.Item
          label="Họ tên"
          name="fullName"
          rules={[
            { required: true, message: "Vui lòng nhập họ tên" },
          ]}
        >
          <Input placeholder="Nhập họ tên" />
        </Form.Item>

        <Form.Item
          label="Vai trò"
          name="role"
          rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
        >
          <Select
            placeholder="Chọn vai trò"
            options={[
              { value: "ADMIN", label: "ADMIN" },
              { value: "STAFF", label: "Nhân viên" },
            ]}
          />
        </Form.Item>

        {/* TRƯỜNG TRẠNG THÁI chỉ hiển thị khi SỬA */}
        {user && (
          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select
              placeholder="Chọn trạng thái"
              options={[
                { value: "ACTIVE", label: "Hoạt động" },
                { value: "INACTIVE", label: "Ngừng hoạt động" },
              ]}
            />
          </Form.Item>
        )}

        <Button
          type="primary"
          htmlType="submit"
          style={{ marginTop: 10 }}
          block
        >
          {user ? "Cập nhật" : "Thêm mới"}
        </Button>
      </Form>
    </Modal>
  );
}
