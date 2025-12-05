// src/components/voucher/VoucherFormModal.jsx
// Modal thêm / sửa voucher
// -------------------------------------------------------------

import { Modal, Form, Input, InputNumber, DatePicker, Select } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

/**
 * props:
 *  - open: boolean
 *  - onCancel: đóng modal
 *  - onSubmit: callback submit form
 *  - loading: trạng thái submit
 *  - initialValues: dữ liệu khi edit
 */
export default function VoucherFormModal({
  open,
  onCancel,
  onSubmit,
  loading,
  initialValues,
}) {
  const [form] = Form.useForm();

  // Khi mở modal edit → set giá trị vào form
  if (open && initialValues) {
    form.setFieldsValue({
      ...initialValues,
      dateRange: [
        dayjs(initialValues.startDate),
        dayjs(initialValues.endDate),
      ],
    });
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const [start, end] = values.dateRange;

      const payload = {
        ...values,
        startDate: start.format("YYYY-MM-DDTHH:mm:ss"),
        endDate: end.format("YYYY-MM-DDTHH:mm:ss"),
      };

      delete payload.dateRange;

      onSubmit(payload);
    });
  };

  return (
    <Modal
      title={initialValues ? "Chỉnh sửa Voucher" : "Thêm Voucher"}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Lưu"
      cancelText="Đóng"
      width={600}
    >
      {/* Form nhập thông tin voucher */}
      <Form form={form} layout="vertical">
        {/* Mã voucher */}
        <Form.Item
          name="code"
          label="Mã voucher"
          rules={[{ required: true, message: "Vui lòng nhập mã voucher" }]}
        >
          <Input placeholder="VD: KM10" disabled={!!initialValues} />
        </Form.Item>

        {/* Mô tả */}
        <Form.Item name="description" label="Mô tả">
          <Input placeholder="Thông tin mô tả voucher" />
        </Form.Item>

        {/* Loại giảm giá */}
        <Form.Item
          name="discountType"
          label="Loại giảm giá"
          rules={[{ required: true, message: "Chọn loại giảm giá" }]}
        >
          <Select
            options={[
              { value: "PERCENT", label: "Giảm theo %" },
              { value: "FIXED", label: "Giảm theo số tiền" },
            ]}
          />
        </Form.Item>

        {/* Giá trị giảm */}
        <Form.Item
          name="discountValue"
          label="Giá trị giảm"
          rules={[{ required: true, message: "Nhập giá trị giảm" }]}
        >
          <InputNumber
            className="w-full"
            placeholder="VD: 10 hoặc 50000"
            min={0}
          />
        </Form.Item>

        {/* Giá trị đơn hàng tối thiểu */}
        <Form.Item name="minOrderAmount" label="Đơn tối thiểu">
          <InputNumber
            className="w-full"
            placeholder="VD: 100000"
            min={0}
          />
        </Form.Item>

        {/* Giảm tối đa */}
        <Form.Item name="maxDiscountAmount" label="Giảm tối đa">
          <InputNumber
            className="w-full"
            placeholder="VD: 30000"
            min={0}
          />
        </Form.Item>

        {/* Giới hạn sử dụng */}
        <Form.Item
          name="usageLimit"
          label="Số lần áp dụng"
          rules={[{ required: true, message: "Nhập số lần áp dụng" }]}
        >
          <InputNumber className="w-full" min={0} />
        </Form.Item>

        {/* Ngày bắt đầu - kết thúc */}
        <Form.Item
          name="dateRange"
          label="Thời gian áp dụng"
          rules={[{ required: true, message: "Chọn thời gian áp dụng" }]}
        >
          <RangePicker showTime format="DD/MM/YYYY HH:mm" className="w-full" />
        </Form.Item>

        {/* Trạng thái */}
        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[{ required: true, message: "Chọn trạng thái" }]}
        >
          <Select
            options={[
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "INACTIVE", label: "INACTIVE" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
