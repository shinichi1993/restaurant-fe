// AdjustStockModal.jsx – Modal điều chỉnh kho (quantity âm/dương)
// --------------------------------------------------------------
// Dùng để sửa tồn kho khi nhập sai hoặc kiểm kho thực tế.
// Logic:
//  - Cho phép quantity âm hoặc dương
//  - Không cho phép quantity = 0
// UI theo Rule 27
// Reset form khi đóng theo Rule 30
// --------------------------------------------------------------

import { Modal, Form, InputNumber, Select, Input, Button, message } from "antd";
import { useEffect, useState } from "react";

import { getIngredients } from "../../api/ingredientApi";
import { adjustStock } from "../../api/stockEntryApi";

export default function AdjustStockModal({ open, onClose, reload }) {
  const [form] = Form.useForm();
  const [ingredients, setIngredients] = useState([]);

  // --------------------------------------------------------------
  // Load danh sách nguyên liệu
  // --------------------------------------------------------------
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
      form.resetFields(); // Reset form mỗi lần mở
      loadIngredients();
    }
  }, [open]);

  // --------------------------------------------------------------
  // Submit điều chỉnh kho
  // --------------------------------------------------------------
  const onFinish = async (values) => {
    try {
      if (values.quantity === 0) {
        //message.error("Số lượng điều chỉnh phải khác 0");
        return;
      }

      await adjustStock({
        ingredientId: values.ingredientId,
        quantity: values.quantity,
        note: values.note,
      });

      message.success("Điều chỉnh kho thành công");
      onClose();
      reload();
    } catch (err) {
      console.error(err);
      //message.error(err.response?.data?.message || "Điều chỉnh kho thất bại");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Điều chỉnh tồn kho"
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

        {/* Số lượng điều chỉnh */}
        <Form.Item
          label="Số lượng điều chỉnh"
          name="quantity"
          rules={[{ required: true, message: "Vui lòng nhập số lượng điều chỉnh" }]}
        >
          <InputNumber
            placeholder="Nhập số lượng (âm hoặc dương)"
            style={{ width: "100%" }}
          />
        </Form.Item>

        {/* Ghi chú */}
        <Form.Item label="Ghi chú" name="note">
          <Input placeholder="Nhập ghi chú (tuỳ chọn)" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block>
          Xác nhận điều chỉnh
        </Button>
      </Form>
    </Modal>
  );
}
