// src/components/ingredient/IngredientFormModal.jsx
// --------------------------------------------------------------------
// Modal thêm / sửa nguyên liệu
// - Nếu props.item != null → chế độ SỬA
// - Nếu item = null → chế độ THÊM
// --------------------------------------------------------------------
// Tham chiếu theo DTO BE:
//  - IngredientCreateRequest
//  - IngredientUpdateRequest
// --------------------------------------------------------------------

import { Modal, Form, Input, InputNumber, Select, Button, message } from "antd";
import { useEffect } from "react";

import {
  createIngredient,
  updateIngredient,
} from "../../api/ingredientApi";

export default function IngredientFormModal({
  open,
  onClose,
  item,
  reload,
}) {
  const [form] = Form.useForm();

  // --------------------------------------------------------------------
  // Nếu là sửa → fill dữ liệu lên form
  // Nếu thêm mới → reset
  // --------------------------------------------------------------------
  useEffect(() => {
    if (item) {
      form.setFieldsValue({
        name: item.name,
        unit: item.unit,
        stockQuantity: item.stockQuantity,
        active: item.active ? "ACTIVE" : "INACTIVE",
      });
    } else {
      form.resetFields();
    }
  }, [item, form]);

  // --------------------------------------------------------------------
  // Submit form: tạo mới hoặc cập nhật
  // --------------------------------------------------------------------
  const onFinish = async (values) => {
    try {
      if (item) {
        // -------------------- SỬA --------------------
        await updateIngredient(item.id, {
          name: values.name,
          unit: values.unit,
          stockQuantity: values.stockQuantity,
          active: values.active === "ACTIVE",
        });

        message.success("Cập nhật nguyên liệu thành công");
      } else {
        // -------------------- THÊM --------------------
        await createIngredient({
          name: values.name,
          unit: values.unit,
          stockQuantity: values.stockQuantity,
        });

        message.success("Thêm nguyên liệu thành công");
      }

      onClose();
      reload();
    } catch (err) {
      console.error(err);
      //message.error("Lưu dữ liệu thất bại");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={item ? "Cập nhật nguyên liệu" : "Thêm nguyên liệu"}
      footer={null}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={onFinish}>

        <Form.Item
          label="Tên nguyên liệu"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên nguyên liệu" }]}
        >
          <Input placeholder="Nhập tên nguyên liệu" />
        </Form.Item>

        <Form.Item
          label="Đơn vị tính"
          name="unit"
          rules={[{ required: true, message: "Vui lòng nhập đơn vị tính" }]}
        >
          <Input placeholder="gram, ml, cái..." />
        </Form.Item>

        <Form.Item
          label="Tồn kho"
          name="stockQuantity"
          rules={[{ required: true, message: "Vui lòng nhập số lượng tồn" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            placeholder="Nhập tồn kho"
          />
        </Form.Item>

        {/* Trạng thái chỉ hiển thị khi sửa */}
        {item && (
          <Form.Item
            label="Trạng thái"
            name="active"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select
              options={[
                { value: "ACTIVE", label: "Hoạt động" },
                { value: "INACTIVE", label: "Ngừng" },
              ]}
            />
          </Form.Item>
        )}

        <Button type="primary" htmlType="submit" block style={{ marginTop: 10 }}>
          {item ? "Cập nhật" : "Thêm mới"}
        </Button>
      </Form>
    </Modal>
  );
}
