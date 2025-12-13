// PaymentModal.jsx – Modal thanh toán Order
// --------------------------------------------------------------
// Dùng ở OrderPage:
//  - Nhận vào order (id, orderCode, totalPrice)
//  - Cho nhập mã voucher (tùy chọn)
//  - Gọi API calcPayment để TÍNH THỬ số tiền phải trả
//      + Voucher + Discount mặc định + VAT
//  - Gọi API createPayment để TẠO payment + invoice thực tế
//  - Sau khi thanh toán xong → tự gọi API lấy invoice theo order
//    rồi redirect sang trang chi tiết hóa đơn
// --------------------------------------------------------------
// Lưu ý:
//  - Không thay đổi gì tới PaymentPage hiện tại
//  - Toàn bộ comment tiếng Việt (Rule 13)
//  - Tất cả logic TÍNH TOÁN SỐ TIỀN nằm ở BE (source-of-truth)
//  - FE chỉ:
//      + gửi input (member, voucher, redeem)
//      + hiển thị kết quả calc từ BE
//      + validate UI cơ bản (tiền khách trả)

// --------------------------------------------------------------

import {
  Modal,
  Form,
  Select,
  Input,
  Button,
  Typography,
  message,
  Spin,
  Card,
} from "antd";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { createPayment, calcPayment } from "../../api/paymentApi";
import { getInvoiceByOrderId } from "../../api/invoiceApi";

import { getMemberById, getActiveMemberByPhone } from "../../api/memberApi";

const { Text } = Typography;

export default function PaymentModal({ open, onClose, order, reloadOrders }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // ==========================================================
  // STATE CHÍNH TRONG MODAL
  // ==========================================================

  // Mã voucher mà người dùng nhập
  const [voucherCode, setVoucherCode] = useState("");

  // Kết quả tính tiền từ API /api/payments/calc
  // {
  //   originalTotal,
  //   voucherDiscount,
  //   defaultDiscount,
  //   totalDiscount,
  //   vatPercent,
  //   vatAmount,
  //   finalAmount,
  //   appliedVoucherCode
  // }
  const [calcResult, setCalcResult] = useState(null);

  // Loading khi gọi calcPayment
  const [calculating, setCalculating] = useState(false);

  // Loading khi bấm "Xác nhận thanh toán"
  const [submitting, setSubmitting] = useState(false);

  //Loading tiền thừa khi nhập tiền khách thanh toán
  const [customerPaid, setCustomerPaid] = useState(0);

  // ===============================
  // STATE MEMBER (LOYALTY)
  // ===============================
  const [memberPhone, setMemberPhone] = useState("");
  const [selectedMember, setSelectedMember] = useState(null); // MemberResponse
  const [searchingMember, setSearchingMember] = useState(false);

  // ===============================
  // STATE REDEEM POINT
  // ===============================

  // Số điểm hội viên muốn dùng để giảm giá
  const [redeemPoint, setRedeemPoint] = useState(0);

  // ==========================================================
  // REF dùng để chống race-condition khi gọi calcPayment
  // Mỗi lần gọi calc → tăng requestId
  // Chỉ nhận response của request mới nhất
  // ==========================================================
  const calcRequestIdRef = useRef(0);

  // ==========================================================
  // KHI MỞ PAYMENT MODAL
  // - Reset state
  // - Load member (nếu có)
  // - BẮT BUỘC gọi calcPayment để lấy VAT / discount mặc định
  // ==========================================================
  useEffect(() => {
    if (!open || !order) return;

    // Set form mặc định
    form.setFieldsValue({
      method: "CASH",
      note: `Thanh toán cho order ${order.orderCode}`,
    });

    // Reset state
    setVoucherCode("");
    setRedeemPoint(0);
    setCalcResult(null);

    // Nếu order đã có member → load
    if (order.memberId) {
      loadMemberById(order.memberId);
    }

    // ✅ LUÔN LUÔN TÍNH TIỀN KHI MỞ MODAL
    triggerCalcPayment();

    // Cleanup khi đóng modal
    return () => {
      form.resetFields();
      setCalcResult(null);
      setRedeemPoint(0);
    };
  }, [open, order]);

  // ==========================================================
  // TỰ ĐỘNG TÍNH LẠI TIỀN KHI:
  //  - Đổi hội viên
  //  - Đổi điểm redeem
  //  - Đổi voucher
  // ==========================================================
  useEffect(() => {
    if (!open || !order) return;
    triggerCalcPayment();
  }, [selectedMember?.id, redeemPoint, voucherCode]);

  // ==========================================================
  // HÀM DUY NHẤT dùng để tính tiền (SOURCE OF TRUTH)
  // ----------------------------------------------------------
  // Quy ước:
  //  - MỌI thay đổi ảnh hưởng tiền → GỌI HÀM NÀY
  //  - FE KHÔNG tự tính, chỉ hiển thị kết quả từ BE
  // ==========================================================
  const triggerCalcPayment = useCallback(async () => {
    if (!order?.id) return;

    const requestId = ++calcRequestIdRef.current;

    try {
      setCalculating(true);

      // ===============================
      // Build payload gửi BE
      // ===============================
      const payload = {
        orderId: order.id,
      };

      // Nếu có hội viên
      if (selectedMember?.id) {
        payload.memberId = selectedMember.id;
      }

      // Nếu có dùng điểm
      if (redeemPoint > 0) {
        payload.redeemPoint = redeemPoint;
      }

      // Nếu có voucher
      if (voucherCode?.trim()) {
        payload.voucherCode = voucherCode.trim();
      }

      const res = await calcPayment(payload);
      const data = res?.data ?? res;

      // ===============================
      // Chống race-condition:
      // chỉ nhận response mới nhất
      // ===============================
      if (requestId !== calcRequestIdRef.current) return;

      setCalcResult(data);
    } catch (err) {
      console.error("Lỗi calcPayment:", err);
    } finally {
      if (requestId === calcRequestIdRef.current) {
        setCalculating(false);
      }
    }
  }, [order?.id, selectedMember?.id, redeemPoint, voucherCode]);

  // ==========================================================
  // XỬ LÝ KHI BẤM NÚT "ÁP DỤNG" VOUCHER
  // ==========================================================
  const handleApplyVoucher = async () => {
    if (!order) return;

    if (!voucherCode.trim()) {
      message.warning("Vui lòng nhập mã voucher");
      return;
    }

    // Gọi triggerCalcPayment
    triggerCalcPayment();
  };

  // ==========================================================
  // XỬ LÝ SUBMIT THANH TOÁN
  // ==========================================================
  const handleSubmit = async (values) => {
    if (!order) return;

    try {
      setSubmitting(true);

      // Số tiền FE sẽ gửi lên cho BE:
      //  - Nếu đã có kết quả calc → dùng finalAmount
      //  - Nếu chưa gọi calc (hiếm) → fallback về order.totalPrice
      const finalAmount =
        calcResult && calcResult.finalAmount != null
          ? calcResult.finalAmount
          : order.totalPrice;

      const payload = {
        orderId: order.id,
        amount: finalAmount,
        method: values.method,
        note: values.note || null,
        customerPaid: values.customerPaid,
      };

      if (selectedMember?.id) {
        payload.memberId = selectedMember.id;
      }

      if (redeemPoint > 0) {
        payload.redeemPoint = redeemPoint;
      }

      // Nếu BE đã chấp nhận voucher (appliedVoucherCode != null)
      // → gửi kèm voucherCode cho createPayment
      if (calcResult && calcResult.appliedVoucherCode) {
        payload.voucherCode = calcResult.appliedVoucherCode;
      }

      // Gọi API tạo payment
      await createPayment(payload);

      message.success("Thanh toán thành công");

      // Reload lại danh sách order (status sẽ chuyển sang PAID)
      if (reloadOrders) {
        await reloadOrders();
      }

      // Sau khi thanh toán xong → gọi API lấy invoice theo order
      try {
        const invoice = await getInvoiceByOrderId(order.id);
        if (invoice && invoice.id) {
          // Điều hướng sang trang chi tiết hóa đơn
          navigate(`/invoices/${invoice.id}`);
        } else {
          message.warning(
            "Thanh toán xong nhưng chưa tìm thấy hóa đơn. Hãy kiểm tra lại ở mục Hóa đơn."
          );
        }
      } catch (err) {
        console.error(err);
        /*message.error(
          "Thanh toán xong nhưng không lấy được thông tin hóa đơn"
        );*/
      }

      // Đóng modal sau khi xong
      onClose();
    } catch (err) {
      console.error(err);
      /*message.error(
        err?.response?.data?.message || "Thanh toán thất bại. Vui lòng thử lại"
      );*/
    } finally {
      setSubmitting(false);
    }
  };

    // ==========================================================
    // XỬ LÝ Load member theo ID (dùng khi order đã có memberId)
    // ==========================================================
    const loadMemberById = async (memberId) => {
      try {
        // ✅ Gọi đúng API getMemberById thay vì searchMemberByPhone
        const res = await getMemberById(memberId);
        setSelectedMember(res);
        setMemberPhone(res.phone); // Đổ luôn SĐT ra ô input để user thấy
      } catch (e) {
        console.error("Không load được hội viên:", e);
      }
    };

  // ==========================================================
  // 🟢 TÌM HỘI VIÊN (CHỈ ACTIVE) – DÙNG RIÊNG CHO PAYMENT / POS
  // ==========================================================
  // Logic:
  // 1. Nhập SĐT
  // 2. Gọi API getActiveMemberByPhone
  // 3. Nếu member bị disable → BE trả lỗi → FE báo không tìm thấy
  // ==========================================================
  const handleSearchMember = async () => {
    // ❗ Validate input
    if (!memberPhone.trim()) {
      message.warning("Vui lòng nhập số điện thoại hội viên");
      return;
    }

    try {
      setSearchingMember(true);

      // ✅ GỌI API CHỈ TRẢ HỘI VIÊN ACTIVE
      const res = await getActiveMemberByPhone(memberPhone.trim());

      // ✅ Gán đúng MemberResponse
      setSelectedMember(res);

      message.success(`Tìm thấy hội viên: ${res.name}`);
    } catch (err) {
      // ❌ Không tìm thấy hoặc hội viên đã bị vô hiệu hóa
      setSelectedMember(null);

      message.warning(
        err?.response?.data?.message ||
          "Không tìm thấy hội viên hoặc hội viên đã bị vô hiệu hóa"
      );
    } finally {
      setSearchingMember(false);
    }
  };

  // ----------------------------------------------------------
  // Nếu chưa có order → không render gì (phòng bug null)
  // ----------------------------------------------------------
  if (!order) return null;

  // ==========================================================
  // HÀM HIỂN THỊ TỔNG TIỀN + CHI TIẾT GIẢM GIÁ + VAT
  // ==========================================================
  const renderTotalInfo = () => {
    // Nếu đã có kết quả calc từ BE
    if (calcResult) {
      const originalTotal = Number(
        calcResult.originalTotal ?? order.totalPrice ?? 0
      );
      const voucherDiscount = Number(calcResult.voucherDiscount ?? 0);
      const defaultDiscount = Number(calcResult.defaultDiscount ?? 0);
      const redeemDiscount = Number(calcResult.redeemDiscount ?? 0);
      const totalDiscount = Number(calcResult.totalDiscount ?? 0);
      const vatPercent = Number(calcResult.vatPercent ?? 0);
      const vatAmount = Number(calcResult.vatAmount ?? 0);
      const finalAmount = Number(calcResult.finalAmount ?? originalTotal);

      return (
        <>
          {/* Tổng gốc trước giảm */}
          <Text strong>Tổng tiền gốc: </Text>
          <Text
            delete={totalDiscount > 0}
            type={totalDiscount > 0 ? "secondary" : "danger"}
            style={{ marginRight: 8 }}
          >
            {originalTotal.toLocaleString("vi-VN")} đ
          </Text>
          <br />

          {/* Nếu có giảm giá (voucher / default) */}
          {totalDiscount > 0 && (
            <>
              <Text strong>Giảm giá: </Text>
              <Text type="danger" style={{ marginLeft: 4 }}>
                -{totalDiscount.toLocaleString("vi-VN")} đ
              </Text>
              <br />

              {/* Chi tiết từng loại giảm giá (nếu muốn nhìn rõ) */}
              <Text type="secondary" style={{ fontSize: 12 }}>
                (Voucher: {voucherDiscount.toLocaleString("vi-VN")} đ, giảm mặc
                định: {defaultDiscount.toLocaleString("vi-VN")} đ)
              </Text>
              <br />

              {/* Số điểm point sử dụng*/}
              {redeemDiscount > 0 && (
                <>
                  <Text strong>Dùng điểm: </Text>
                  <Text type="danger">
                    -{redeemDiscount.toLocaleString("vi-VN")} đ
                  </Text>
                  <br />
                </>
              )}
            </>
          )}

          {/* VAT */}
          {vatPercent > 0 && (
            <>
              <Text strong>
                VAT ({vatPercent.toLocaleString("vi-VN")}
                %):
              </Text>
              <Text style={{ marginLeft: 4 }}>
                {vatAmount.toLocaleString("vi-VN")} đ
              </Text>
              <br />
            </>
          )}

          {/* Điểm nhận được (Loyalty) */}
          {calcResult.loyaltyEarnedPoint > 0 && (
            <>
              <Text strong>Điểm nhận được: </Text>
              <Text type="success" style={{ fontSize: 14, fontWeight: 600 }}>
                {calcResult.loyaltyEarnedPoint} điểm
              </Text>
              <br />
            </>
          )}

          {/* Tổng cuối cùng phải trả */}
          <Text strong>Tổng phải thanh toán: </Text>
          <Text type="danger" style={{ fontSize: 16, fontWeight: 700 }}>
            {finalAmount.toLocaleString("vi-VN")} đ
          </Text>
        </>
      );
    }

    // Trường hợp chưa có calcResult (mới mở, chưa kịp gọi API)
    return (
      <>
        <Text strong>Tổng tiền: </Text>
        <Text type="danger">
          {Number(order.totalPrice || 0).toLocaleString("vi-VN")} đ
        </Text>
      </>
    );
  };

  // ==========================================================
  // RENDER MODAL
  // ==========================================================
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Thanh toán order ${order.orderCode}`}
      footer={null}
    >
      {/* Thông tin tóm tắt order */}
      <div style={{ marginBottom: 16 }}>
        <Text strong>Mã order: </Text>
        <Text>#{order.orderCode}</Text>
        <br />

        {/* Hiển thị tổng tiền + giảm giá + VAT */}
        <div style={{ marginTop: 8 }}>
          {calculating ? (
            // Khi đang gọi calcPayment → hiển thị loading nhỏ
            <Spin size="small">
              <span style={{ marginLeft: 8 }}>Đang tính tiền...</span>
            </Spin>
          ) : (
            renderTotalInfo()
          )}
        </div>
      </div>

      {/* =============================== */}
      {/* TÌM HỘI VIÊN */}
      {/* =============================== */}
      <div style={{ marginBottom: 16 }}>
        <Text strong>Số điện thoại hội viên:</Text>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <Input
            placeholder="Nhập SĐT hội viên"
            value={memberPhone}
            onChange={(e) => {
              // ✅ Khi user thay đổi SĐT → reset hội viên đã chọn
              setMemberPhone(e.target.value);
              setSelectedMember(null);
              setRedeemPoint(0); // ✅ reset điểm khi đổi hội viên
            }}
          />
          <Button loading={searchingMember} onClick={handleSearchMember}>
            Tìm
          </Button>
        </div>

        {/* Nếu tìm thấy hội viên */}
        {selectedMember && (
          <Card
            size="small"
            style={{ marginTop: 10, background: "#f6ffed", borderColor: "#b7eb8f" }}
          >
            <Text strong>{selectedMember.name}</Text>
            <br />
            <Text>SĐT: {selectedMember.phone}</Text>
            <br />
            <Text>Tier: {selectedMember.tier}</Text>
            <br />
            <Text>Điểm hiện tại: {selectedMember.totalPoint}</Text>
          </Card>
        )}

        {/* =============================== */}
        {/* REDEEM POINT (DÙNG ĐIỂM) */}
        {/* =============================== */}
        {selectedMember && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Dùng điểm hội viên:</Text>

            <Input
              type="number"
              min={0}
              max={selectedMember.totalPoint}
              value={redeemPoint}
              placeholder="Nhập số điểm muốn dùng"
              onChange={(e) => {
                const value = Number(e.target.value || 0);

                // ❌ Không cho nhập âm
                if (value < 0) return;

                // ❌ Không cho nhập quá số điểm hiện có
                if (value > selectedMember.totalPoint) {
                  message.warning("Số điểm vượt quá điểm hiện có của hội viên");
                  return;
                }

                // ✅ HỢP LỆ → SET STATE
                setRedeemPoint(value);
              }}
              style={{ marginTop: 8 }}
            />

            <Text type="secondary" style={{ fontSize: 12 }}>
              Điểm hiện có: {selectedMember.totalPoint}
            </Text>
          </div>
        )}
      </div>

      {/* Khu vực nhập và áp dụng voucher */}
      <div style={{ marginBottom: 16 }}>
        <Text strong>Mã voucher:</Text>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <Input
            placeholder="Nhập mã voucher"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
          />
          <Button onClick={handleApplyVoucher} disabled={!voucherCode}>
            Áp dụng
          </Button>
        </div>

        {/* Thông tin voucher đang áp dụng (nếu có) */}
        {calcResult && calcResult.appliedVoucherCode && (
          <div style={{ marginTop: 8 }}>
            <Text>
              Đã áp dụng voucher{" "}
              <Text strong>{calcResult.appliedVoucherCode}</Text>.
            </Text>
          </div>
        )}
      </div>

      {/* Form chọn phương thức thanh toán */}
      <Form 
        layout="vertical" 
        form={form}
        onValuesChange={(changed, all) => {
          if (changed.customerPaid !== undefined) {
            setCustomerPaid(Number(changed.customerPaid || 0));
          }
        }}
        onFinish={handleSubmit}
        >
          <Form.Item
            label="Phương thức thanh toán"
            name="method"
            rules={[{ required: true, message: "Vui lòng chọn phương thức" }]}
          >
            <Select
              placeholder="Chọn phương thức"
              options={[
                { value: "CASH", label: "Tiền mặt" },
                { value: "MOMO", label: "Momo" },
                { value: "BANK_TRANSFER", label: "Chuyển khoản" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Khách trả"
            name="customerPaid"
            rules={[
              { required: true, message: "Vui lòng nhập số tiền khách trả" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const finalAmount =
                    calcResult?.finalAmount ?? order.totalPrice ?? 0;

                  if (!value || Number(value) < finalAmount) {
                    return Promise.reject(
                      new Error("Số tiền khách trả phải ≥ tổng phải thanh toán")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
        >
          <Input type="number" min={0} placeholder="Nhập số tiền khách đưa" />
        </Form.Item>

        {calcResult && form.getFieldValue("customerPaid") && (
          <div style={{ marginBottom: 12 }}>
            <Text strong>Tiền thừa: </Text>
            <Text type="success" style={{ fontSize: 16 }}>
              {(
                Number(form.getFieldValue("customerPaid") ?? 0) -
                Number(calcResult.finalAmount ?? 0)
              ).toLocaleString("vi-VN")} đ
            </Text>
          </div>
        )}

        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea
            placeholder="Ghi chú thêm (nếu có)"
            rows={3}
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={submitting}
          disabled={calculating}
        >
          Xác nhận thanh toán
        </Button>
      </Form>
    </Modal>
  );
}
