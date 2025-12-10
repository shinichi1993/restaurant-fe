// src/components/payment/SimplePaymentModal.jsx
// ============================================================================
// SimplePaymentModal – Thanh toán dành riêng cho Simple POS
// ----------------------------------------------------------------------------
// ❗ KHÁC BIỆT SO VỚI PaymentModal:
//  - Không tạo order khi mở modal
//  - Chỉ tạo order thật khi user bấm “Xác nhận thanh toán”
//  - Nếu đóng modal → KHÔNG tạo order, không để rác
//  - UI preview chỉ tính tạm local, còn tiền thật sẽ dựa vào calcPayment (BE)
// ============================================================================

import { useState } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  Typography,
  message,
  Descriptions,
  Space,
  Spin,
} from "antd";
import { useNavigate } from "react-router-dom";

import { simpleCreateOrder } from "../../api/orderApi";
import { calcPayment, createPayment } from "../../api/paymentApi";

const { Text } = Typography;
const { Option } = Select;

export default function SimplePaymentModal({
  open,
  onClose,
  cartItems,
  tableId,
}) {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // State BE
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null); // order sau khi tạo thật
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // ---------------------------------------------------------------------------
  // ĐÓNG MODAL → reset toàn bộ (vì không tạo order tạm nữa)
  // ---------------------------------------------------------------------------
  const handleCancel = () => {
    setOrder(null);
    setCalcResult(null);
    form.resetFields();
    onClose && onClose();
  };

  // ---------------------------------------------------------------------------
  // HÀM RENDER TIỀN (AN TOÀN, KHÔNG BAO GIỜ CRASH)
  // ---------------------------------------------------------------------------
  const renderTotal = () => {
    if (!calcResult || calculating) {
      return (
        <Spin size="small">
          <span style={{ marginLeft: 8 }}>Đang tính tiền...</span>
        </Spin>
      );
    }

    const originalTotal = Number(calcResult.originalTotal ?? 0);
    const totalDiscount = Number(calcResult.totalDiscount ?? 0);
    const voucherDiscount = Number(calcResult.voucherDiscount ?? 0);
    const defaultDiscount = Number(calcResult.defaultDiscount ?? 0);
    const vatPercent = Number(calcResult.vatPercent ?? 0);
    const vatAmount = Number(calcResult.vatAmount ?? 0);
    const finalAmount = Number(calcResult.finalAmount ?? originalTotal);

    return (
      <>
        <Text strong>Tổng gốc:</Text>{" "}
        <Text delete={totalDiscount > 0} type={totalDiscount ? "secondary" : "danger"}>
          {originalTotal.toLocaleString("vi-VN")} đ
        </Text>
        <br />

        {totalDiscount > 0 && (
          <>
            <Text strong>Giảm giá:</Text>{" "}
            <Text type="danger">-{totalDiscount.toLocaleString("vi-VN")} đ</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              (Voucher: {voucherDiscount.toLocaleString("vi-VN")} đ, mặc định:{" "}
              {defaultDiscount.toLocaleString("vi-VN")} đ)
            </Text>
            <br />
          </>
        )}

        <Text strong>VAT ({vatPercent}%):</Text>{" "}
        <Text>{vatAmount.toLocaleString("vi-VN")} đ</Text>
        <br />

        <Text strong>Tổng thanh toán:</Text>{" "}
        <Text type="danger" style={{ fontSize: 16, fontWeight: 700 }}>
          {finalAmount.toLocaleString("vi-VN")} đ
        </Text>
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // 🎯 XỬ LÝ KHI BẤM "XÁC NHẬN THANH TOÁN"
  // 1) Tạo order thật
  // 2) CalcPayment
  // 3) Tạo payment
  // ---------------------------------------------------------------------------
  const handleOk = async () => {
    if (!cartItems?.length) {
      message.error("Giỏ hàng trống");
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      // 1️⃣ Tạo order thật
      const payload = {
        tableId: tableId ?? null,
        items: cartItems.map((i) => ({
          dishId: i.dishId,
          quantity: i.quantity,
          note: i.note || null,
        })),
      };

      const resOrder = await simpleCreateOrder(payload);
      const createdOrder = resOrder.data;
      setOrder(createdOrder);

      // 2️⃣ Gọi calcPayment (BE tính đúng theo rule VAT + Voucher)
      setCalculating(true);
      const calc = await calcPayment({
        orderId: createdOrder.id,
        voucherCode: null,
      });
      setCalculating(false);

      const dataCalc = calc.data ?? calc;
      setCalcResult(dataCalc);

      const finalAmount = Number(dataCalc.finalAmount ?? 0);

      // Check khách trả
      if (Number(values.customerPaid) < finalAmount) {
        return message.error("Khách trả phải ≥ số tiền phải thanh toán");
      }

      // 3️⃣ Gọi API tạo Payment -> sinh Invoice
      const paymentRes = await createPayment({
        orderId: createdOrder.id,
        paymentMethod: values.paymentMethod,
        customerPaid: values.customerPaid,
        note: values.note || null,
      });

      message.success("Thanh toán Simple POS thành công!");

      // Redirect hóa đơn
      if (paymentRes.data?.invoiceId) {
        navigate(`/invoices/${paymentRes.data.invoiceId}`);
      }

      handleCancel(); // reset modal
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TÍNH PREVIEW LOCAL (để hiển thị ban đầu)
  // ---------------------------------------------------------------------------
  const subtotalLocal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const vatLocal = Math.round(subtotalLocal * 0.1);
  const finalLocal = subtotalLocal + vatLocal;

  const fakeOrderPreview = {
    code: "PREVIEW",
    tableName: tableId ? tableId : "Không gán bàn",
    subtotal: subtotalLocal,
    vat: vatLocal,
    finalAmount: finalLocal,
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title="Thanh toán đơn Simple POS"
      okText="Xác nhận thanh toán"
      cancelText="Hủy"
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnClose
    >
      {/* -------------------------------------------------------------------
          PREVIEW (chỉ hiển thị local trước khi tạo order thật)
      ------------------------------------------------------------------- */}
      <Descriptions
        size="small"
        column={1}
        bordered
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="Mã Order">
          {fakeOrderPreview.code}
        </Descriptions.Item>
        <Descriptions.Item label="Bàn">
          {fakeOrderPreview.tableName}
        </Descriptions.Item>
        <Descriptions.Item label="Tổng tạm tính">
          {fakeOrderPreview.subtotal.toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="VAT (10%)">
          {fakeOrderPreview.vat.toLocaleString("vi-VN")} đ
        </Descriptions.Item>
        <Descriptions.Item label="Thanh toán">
          <Text strong style={{ fontSize: 18, color: "red" }}>
            {fakeOrderPreview.finalAmount.toLocaleString("vi-VN")} đ
          </Text>
        </Descriptions.Item>
      </Descriptions>

      {/* -------------------------------------------------------------------
          FORM THANH TOÁN
      ------------------------------------------------------------------- */}
      <Form form={form} layout="vertical">
        <Form.Item
          label="Phương thức thanh toán"
          name="paymentMethod"
          rules={[{ required: true, message: "Chọn phương thức thanh toán" }]}
        >
          <Select placeholder="Chọn phương thức">
            <Option value="CASH">Tiền mặt</Option>
            <Option value="BANK_TRANSFER">Chuyển khoản</Option>
            <Option value="CARD">Thẻ</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Khách trả"
          name="customerPaid"
          rules={[
            { required: true, message: "Nhập số tiền khách trả" },
            {
              validator: (_, v) => {
                if (!v) return Promise.resolve();
                if (Number(v) < finalLocal)
                  return Promise.reject(
                    "Khách trả phải ≥ số tiền phải thanh toán"
                  );
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea rows={2} placeholder="Ghi chú thêm (nếu có)" />
        </Form.Item>
      </Form>

      <Space direction="vertical" style={{ marginTop: 8 }}>
        <Text type="secondary">
          • Order thật sẽ được tạo khi bạn bấm “Xác nhận thanh toán”.
        </Text>
        <Text type="secondary">
          • Đóng modal = không tạo order, không tạo rác trong hệ thống.
        </Text>
      </Space>
    </Modal>
  );
}
