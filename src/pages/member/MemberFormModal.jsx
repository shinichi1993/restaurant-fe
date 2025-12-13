// src/pages/member/MemberFormModal.jsx
// --------------------------------------------------------------
// Modal form tạo / chỉnh sửa hội viên Membership
// --------------------------------------------------------------
// FIXED:
//  - Reset form đúng cách khi tạo mới
//  - Load dữ liệu khi chỉnh sửa
//  - Không còn bug giữ dữ liệu cũ
// --------------------------------------------------------------

import { Modal, Form, Input, DatePicker, InputNumber, Typography } from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";

const { TextArea } = Input;

export default function MemberFormModal({ open, onClose, onSubmit, initial }) {
  const [form] = Form.useForm();

  // ---------------------------------------------------------
  // 🟢 useEffect — Xử lý mở modal
  //  - Nếu sửa → fill form
  //  - Nếu tạo mới → reset form
  // ---------------------------------------------------------
  useEffect(() => {
    if (open) {
      if (initial) {
        // 👉 SỬA: đổ dữ liệu vào form
        form.setFieldsValue({
          ...initial,
          birthday: initial.birthday ? dayjs(initial.birthday) : null,
        });
      } else {
        // 👉 TẠO MỚI: reset sạch form
        form.resetFields();
      }
    }
  }, [open, initial]);

  // ---------------------------------------------------------
  // 🟢 Handle Submit
  // ---------------------------------------------------------
  const handleFinish = (values) => {
    const payload = {
      ...values,
      id: initial?.id ?? null,
      birthday: values.birthday
        ? values.birthday.format("YYYY-MM-DD")
        : null,
    };

    onSubmit(payload);

    // 👉 Reset form sau khi submit (fix lỗi giữ dữ liệu cũ)
    form.resetFields();

    // 👉 Đóng modal
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "Cập nhật hội viên" : "Tạo hội viên mới"}
      okText="Lưu"
      onCancel={() => {
        form.resetFields(); // 👉 RESET FORM khi bấm Cancel/X
        onClose();
      }}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Form.Item
          label="Tên hội viên"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên" }]}
        >
          <Input placeholder="Nhập tên hội viên" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
        >
          <Input placeholder="Nhập SĐT" maxLength={15} />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input placeholder="Email (không bắt buộc)" />
        </Form.Item>

        <Form.Item label="Ngày sinh" name="birthday">
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Địa chỉ" name="address">
          <Input placeholder="Nhập địa chỉ (tùy chọn)" />
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <TextArea rows={3} placeholder="Ghi chú thêm (nếu có)" />
        </Form.Item>

        {/* Chỉ hiển thị khi sửa */}
        {initial && (
          <>
            <Form.Item label="Tổng điểm hiện tại">
              <InputNumber
                style={{ width: "100%" }}
                value={initial.totalPoint}
                disabled
              />
            </Form.Item>

            <Form.Item label="Tổng điểm tích luỹ (lifetime)">
              <InputNumber
                style={{ width: "100%" }}
                value={initial.lifetimePoint}
                disabled
              />
            </Form.Item>

            <Form.Item label="Hạng (tier)">
              <Input value={initial.tier} disabled />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
