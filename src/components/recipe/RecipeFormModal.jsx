// RecipeFormModal.jsx – Modal thêm / sửa định lượng món ăn
// -----------------------------------------------------------------------------
// Dùng trong RecipePage.jsx (Module 07)
//
// Chế độ hoạt động:
//   - Nếu props.item != null  → Sửa định lượng
//   - Nếu props.item == null  → Thêm định lượng mới
//
// Tham số truyền vào từ RecipePage:
//   • open        : boolean – mở/đóng modal
//   • onClose     : function – đóng modal
//   • dishId      : ID món ăn đang được chọn
//   • item        : bản ghi định lượng đang chỉnh sửa (null nếu thêm mới)
//   • reload      : hàm loadRecipe() để reload lại bảng sau khi lưu
//
// UI/UX theo chuẩn:
//   - Rule 27: Layout form dọc (vertical)
//   - Rule 14: Component không bọc layout
//   - Rule 29: Button chuẩn variant
//
// Chức năng trong modal:
//   ✓ Chọn nguyên liệu (ingredient) – dropdown
//   ✓ Nhập số lượng cần dùng cho 1 phần món
//   ✓ Submit → gọi API add/update
//
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Button,
  message,
} from "antd";

import { getIngredients } from "../../api/ingredientApi";
import {
  addRecipeItem,
  updateRecipeItem,
} from "../../api/recipeApi";

export default function RecipeFormModal({ open, onClose, item, dishId, reload }) {
  const [form] = Form.useForm();

  const [ingredients, setIngredients] = useState([]);

  // ---------------------------------------------------------------------------
  // LOAD DANH SÁCH NGUYÊN LIỆU CHO DROPDOWN
  // ---------------------------------------------------------------------------
  const loadIngredients = async () => {
    try {
      const res = await getIngredients();
      setIngredients(
        res.map((i) => ({
          value: i.id,
          label: `${i.name} (${i.unit})`,
        }))
      );
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách nguyên liệu");
    }
  };

  // ---------------------------------------------------------------------------
  // KHI MỞ MODAL → load danh sách nguyên liệu + set dữ liệu form nếu sửa
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (open) {
      loadIngredients();

      if (item) {
        // Chế độ sửa
        form.setFieldsValue({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
        });
      } else {
        // Chế độ thêm mới
        form.resetFields();
      }
    }
  }, [open, item, form]);

  // ---------------------------------------------------------------------------
  // SUBMIT FORM
  // ---------------------------------------------------------------------------
  const onFinish = async (values) => {
    try {
      // payload gửi lên BE
      const payload = {
        dishId: dishId,
        ingredientId: values.ingredientId,
        quantity: values.quantity,
      };

      if (item) {
        // ---------------- SỬA ĐỊNH LƯỢNG ----------------
        await updateRecipeItem(item.id, payload);
        message.success("Cập nhật định lượng thành công");
      } else {
        // ---------------- THÊM ĐỊNH LƯỢNG ----------------
        await addRecipeItem(payload);
        message.success("Thêm định lượng thành công");
      }

      onClose();
      reload(); // Reload lại bảng định lượng

    } catch (err) {
      console.error(err);
      message.error("Lưu dữ liệu thất bại");
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={item ? "Cập nhật định lượng" : "Thêm định lượng"}
      footer={null}
      destroyOnClose
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
      >
        {/* CHỌN NGUYÊN LIỆU */}
        <Form.Item
          label="Nguyên liệu"
          name="ingredientId"
          rules={[
            { required: true, message: "Vui lòng chọn nguyên liệu" },
          ]}
        >
          <Select
            placeholder="Chọn nguyên liệu"
            options={ingredients}
          />
        </Form.Item>

        {/* SỐ LƯỢNG */}
        <Form.Item
          label="Số lượng cho 1 phần món"
          name="quantity"
          rules={[
            { required: true, message: "Vui lòng nhập số lượng" },
          ]}
        >
          <InputNumber
            min={0.0001}
            step={0.1}
            precision={3}
            placeholder="Nhập số lượng"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          style={{ marginTop: 10 }}
        >
          {item ? "Cập nhật" : "Thêm mới"}
        </Button>
      </Form>
    </Modal>
  );
}
