// DishFormModal.jsx – Modal thêm / sửa món ăn
// ---------------------------------------------------------------------
// Dùng trong DishPage.jsx
//  - Nếu props.dish có dữ liệu → chế độ SỬA
//  - Nếu dish = null → chế độ THÊM MỚI
// ---------------------------------------------------------------------
// Trường form:
//  - name: tên món
//  - categoryId: danh mục (Select)
//  - price: giá bán
//  - imageUrl: URL ảnh
//  - status: ACTIVE / INACTIVE
// ---------------------------------------------------------------------

import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
} from "antd";

import { createDish, updateDish } from "../../api/dishApi";
import { getCategories } from "../../api/categoryApi";

export default function DishFormModal({
  open,
  onClose,
  dish,
  reload,
}) {
  const [form] = Form.useForm();

  // State danh sách category cho dropdown
  const [categoryOptions, setCategoryOptions] = React.useState([]);

  // Load danh sách category để hiển thị trong Select
  const loadCategories = async () => {
    try {
      const res = await getCategories();
      setCategoryOptions(
        res.map((c) => ({
          value: c.id,
          label: c.name,
        }))
      );
    } catch (err) {
      console.error(err);
      ////message.error("Không tải được danh sách danh mục");
    }
  };

  // Khi mở modal:
  //  - load category
  //  - set giá trị form (nếu là sửa)
  useEffect(() => {
    if (open) {
      loadCategories();
    }

    if (dish) {
      form.setFieldsValue({
        name: dish.name,
        categoryId: dish.categoryId,
        price: dish.price,
        imageUrl: dish.imageUrl,
        status: dish.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: "ACTIVE",
      });
    }
  }, [dish, open, form]);

  // Xử lý submit form
  const onFinish = async (values) => {
    try {
      const payload = {
        ...values,
        // Đảm bảo price là number (FE → BE BigDecimal)
        price: Number(values.price),
      };

      if (dish) {
        // ---------------- SỬA MÓN ĂN ----------------
        await updateDish(dish.id, payload);
        message.success("Cập nhật món ăn thành công");
      } else {
        // ---------------- THÊM MÓN ĂN ----------------
        await createDish(payload);
        message.success("Thêm món ăn thành công");
      }

      onClose();
      reload();
    } catch (err) {
      console.error(err);
      ////message.error("Lưu món ăn thất bại");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={dish ? "Cập nhật món ăn" : "Thêm món ăn"}
      footer={null}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item
          label="Tên món ăn"
          name="name"
          rules={[
            { required: true, message: "Vui lòng nhập tên món" },
          ]}
        >
          <Input placeholder="Nhập tên món" />
        </Form.Item>

        <Form.Item
          label="Danh mục"
          name="categoryId"
          rules={[
            { required: true, message: "Vui lòng chọn danh mục" },
          ]}
        >
          <Select
            placeholder="Chọn danh mục"
            options={categoryOptions}
          />
        </Form.Item>

        <Form.Item
          label="Giá bán"
          name="price"
          rules={[
            { required: true, message: "Vui lòng nhập giá bán" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Nhập giá bán"
            min={1}
            step={1000}
          />
        </Form.Item>

        <Form.Item
          label="URL ảnh món (tuỳ chọn)"
          name="imageUrl"
        >
          <Input placeholder="Nhập đường dẫn ảnh (nếu có)" />
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
              { value: "ACTIVE", label: "Đang bán" },
              { value: "INACTIVE", label: "Ngừng bán" },
            ]}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          style={{ marginTop: 10 }}
        >
          {dish ? "Cập nhật" : "Thêm mới"}
        </Button>
      </Form>
    </Modal>
  );
}
