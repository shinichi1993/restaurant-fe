// CategoryFormModal.jsx – Modal thêm / sửa danh mục món ăn
// ---------------------------------------------------------------------
// Dùng trong CategoryPage.jsx
//  - Nếu props.category có giá trị → modal chế độ SỬA
//  - Nếu category = null → modal chế độ THÊM MỚI
// ---------------------------------------------------------------------
// Trường dữ liệu:
//  - name: tên danh mục (bắt buộc)
//  - description: mô tả
//  - status: ACTIVE / INACTIVE
// ---------------------------------------------------------------------

import { useEffect } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import { createCategory, updateCategory } from "../../api/categoryApi";

export default function CategoryFormModal({ open, onClose, category, reload }) {
  const [form] = Form.useForm();

  // Khi mở modal:
  //  - Nếu là sửa → fill dữ liệu
  //  - Nếu là thêm mới → reset form
  useEffect(() => {
    if (category) {
      form.setFieldsValue({
        name: category.name,
        description: category.description,
        status: category.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: "ACTIVE",
      });
    }
  }, [category, form]);

  // Xử lý submit form
  const onFinish = async (values) => {
    try {
      if (category) {
        // ---------------- SỬA DANH MỤC ----------------
        await updateCategory(category.id, values);
        message.success("Cập nhật danh mục thành công");
      } else {
        // ---------------- THÊM DANH MỤC ----------------
        await createCategory(values);
        message.success("Thêm danh mục thành công");
      }

      onClose();
      reload(); // reload lại danh sách
    } catch (err) {
      console.error(err);
      ////message.error("Lưu danh mục thất bại");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={category ? "Cập nhật danh mục" : "Thêm danh mục"}
      footer={null}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item
          label="Tên danh mục"
          name="name"
          rules={[
            { required: true, message: "Vui lòng nhập tên danh mục" },
          ]}
        >
          <Input placeholder="Nhập tên danh mục" />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea
            placeholder="Nhập mô tả (nếu có)"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[
            { required: true, message: "Vui lòng chọn trạng thái" },
          ]}
        >
          <Select
            placeholder="Chọn trạng thái"
            options={[
              { value: "ACTIVE", label: "Hoạt động" },
              { value: "INACTIVE", label: "Ngừng hoạt động" },
            ]}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          style={{ marginTop: 10 }}
        >
          {category ? "Cập nhật" : "Thêm mới"}
        </Button>
      </Form>
    </Modal>
  );
}
