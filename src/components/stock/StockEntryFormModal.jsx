// StockEntryFormModal.jsx – Modal nhập kho bình thường
// --------------------------------------------------------------
// Chỉ dùng cho nhập kho quantity > 0
// Dùng trong StockEntryPage.jsx
// Quy trình nhập kho:
//  - Chọn nguyên liệu
//  - Nhập số lượng > 0
//  - Nhập ghi chú (không bắt buộc)
// --------------------------------------------------------------
// UI theo Rule 27
// Không bọc AdminLayout theo Rule 14
// Form reset khi đóng theo Rule 30
// --------------------------------------------------------------

import { Modal, Form, InputNumber, Select, Input, Button, message } from "antd";
import { useEffect, useState } from "react";

import { getIngredients } from "../../api/ingredientApi";
import { createStockEntry } from "../../api/stockEntryApi";

export default function StockEntryFormModal({ open, onClose, reload }) {
  const [form] = Form.useForm();
  const [ingredients, setIngredients] = useState([]);

  // ---------------------------------------------
  // Load danh sách nguyên liệu để chọn
  // ---------------------------------------------
  const loadIngredients = async () => {
    try {
      const res = await getIngredients();
      setIngredients(res);
    } catch (err) {
      console.error(err);
      //message.error("Không thể tải danh sách nguyên liệu");
    }
  };

  useEffect(() => {
    if (open) {
      form.resetFields(); // reset form khi mở
      loadIngredients();
    }
  }, [open]);

  // ---------------------------------------------
  // Submit form → gọi API nhập kho
  // ---------------------------------------------
  const onFinish = async (values) => {
    try {
      if (values.quantity <= 0) {
        //message.error("Số lượng phải lớn hơn 0");
        return;
      }

      await createStockEntry({
        ingredientId: values.ingredientId,
        quantity: values.quantity,
        note: values.note,
      });

      message.success("Nhập kho thành công");

      onClose();
      reload();
    } catch (err) {
      console.error(err);
      //message.error("Nhập kho thất bại");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Nhập kho nguyên liệu"
      footer={null}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={onFinish}>
        {/* Chọn nguyên liệu */}
        <Form.Item
          label="Nguyên liệu"
          name="ingredientId"
          rules={[{ required: true, message: "Vui lòng chọn nguyên liệu" }]}
        >
          <Select
            placeholder="Chọn nguyên liệu"
            options={ingredients.map((i) => ({
              value: i.id,
              label: `${i.name} (${i.unit})`,
            }))}
          />
        </Form.Item>

        {/* Số lượng nhập kho */}
        <Form.Item
          label="Số lượng nhập"
          name="quantity"
          rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
        >
          <InputNumber
            min={0}
            placeholder="Nhập số lượng"
            style={{ width: "100%" }}
          />
        </Form.Item>

        {/* Ghi chú */}
        <Form.Item label="Ghi chú" name="note">
          <Input placeholder="Nhập ghi chú (tuỳ chọn)" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block>
          Nhập kho
        </Button>
      </Form>
    </Modal>
  );
}
