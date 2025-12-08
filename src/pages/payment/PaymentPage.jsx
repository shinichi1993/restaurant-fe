// src/pages/payment/PaymentPage.jsx
// ======================================================================
// Trang quản lý danh sách thanh toán (Payment)
//
// Chức năng chính:
//  - Hiển thị danh sách payment (lấy từ API /api/payments)
//  - Filter theo khoảng ngày thanh toán (paidAt from - to)
//  - Nút "Lọc" để gọi lại API với from/to
//  - Nút "Xóa lọc" reset toàn bộ filter (Rule 30)
//  - Xem chi tiết payment qua PaymentDetailModal
//
// Quy ước UI:
//  - Không bọc AdminLayout (Rule 14) – Layout đã xử lý ở AppRoutes
//  - Sử dụng Card + Table theo chuẩn Rule 27
//  - Table dùng prop variant (Rule 29)
//  - Thời gian hiển thị theo format dd/MM/yyyy HH:mm (Rule 26)
// ======================================================================

import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Row,
  Col,
  DatePicker,
  Button,
  Tag,
  Space,
  message,
} from "antd";
import {
  ReloadOutlined,
  ClearOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { getPayments, getPaymentDetail } from "../../api/paymentApi";
import PaymentDetailModal from "../../components/payment/PaymentDetailModal";

const { RangePicker } = DatePicker;

// Hàm format datetime theo rule: dd/MM/yyyy HH:mm
const formatDateTime = (value) => {
  if (!value) return "";
  return dayjs(value).format("DD/MM/YYYY HH:mm");
};

export default function PaymentPage() {
  // ------------------------------------------------------------------
  // STATE CHÍNH
  // ------------------------------------------------------------------
  const [payments, setPayments] = useState([]); // danh sách payment hiển thị
  const [loading, setLoading] = useState(false); // trạng thái loading table

  // Filter ngày thanh toán
  const [fromDate, setFromDate] = useState(null); // dayjs | null
  const [toDate, setToDate] = useState(null); // dayjs | null

  // Modal chi tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // ------------------------------------------------------------------
  // HÀM LOAD DANH SÁCH PAYMENT (KHÔNG FILTER)
  // ------------------------------------------------------------------
  const loadPayments = async () => {
    try {
      setLoading(true);
      // Gọi API không truyền from/to → BE trả về toàn bộ
      const data = await getPayments(null, null);
      setPayments(data);
    } catch (err) {
      console.error("Lỗi load payment:", err);
      //message.error("Không thể tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  };

  // Lần đầu vào trang → load toàn bộ
  useEffect(() => {
    loadPayments();
  }, []);

  // ------------------------------------------------------------------
  // HÀM LỌC THEO KHOẢNG NGÀY
  // ------------------------------------------------------------------
  const handleFilter = async () => {
    try {
      setLoading(true);

      // Convert dayjs → string yyyy-MM-dd (để BE parse LocalDateTime)
      const fromStr = fromDate ? fromDate.format("YYYY-MM-DD") : null;
      const toStr = toDate ? toDate.format("YYYY-MM-DD") : null;

      const data = await getPayments(fromStr, toStr);
      setPayments(data);
    } catch (err) {
      console.error("Lỗi lọc payment:", err);
      //message.error("Không thể lọc danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // HÀM XÓA LỌC – RESET TẤT CẢ FILTER VỀ MẶC ĐỊNH (Rule 30)
  // ------------------------------------------------------------------
  const handleClearFilter = () => {
    setFromDate(null);
    setToDate(null);
    // Sau khi reset filter → load lại toàn bộ danh sách
    loadPayments();
  };

  // ------------------------------------------------------------------
  // HÀM MỞ MODAL CHI TIẾT
  // (Nếu sau này muốn gọi API chi tiết riêng thì chỉnh tại đây)
  // ------------------------------------------------------------------
  const openDetail = async (payment) => {
    try {
      // Nếu muốn luôn lấy bản mới nhất từ BE:
      // const detail = await getPaymentDetail(payment.id);
      // setSelectedPayment(detail);

      // Tạm thời: dùng luôn data đã có; nếu cần detail hơn thì bật đoạn trên
      setSelectedPayment(payment);
      setDetailOpen(true);
    } catch (err) {
      console.error("Lỗi load chi tiết payment:", err);
      //message.error("Không thể tải chi tiết thanh toán");
    }
  };

  // ------------------------------------------------------------------
  // CẤU HÌNH CỘT TABLE
  // ------------------------------------------------------------------
  const columns = [
    {
      title: "Mã order",
      dataIndex: "orderId",
      key: "orderId",
      render: (orderId) => <span>#{orderId}</span>,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <span>
          {amount?.toLocaleString("vi-VN")}{" "}
          <span style={{ color: "#999" }}>đ</span>
        </span>
      ),
    },
    {
      title: "Phương thức",
      dataIndex: "method",
      key: "method",
      render: (method) => {
        if (method === "CASH") return <Tag color="green">Tiền mặt</Tag>;
        if (method === "MOMO") return <Tag color="purple">Momo</Tag>;
        if (method === "BANKING") return <Tag color="blue">Chuyển khoản</Tag>;
        return <Tag>{method}</Tag>;
      },
    },
    {
      title: "Thời gian thanh toán",
      dataIndex: "paidAt",
      key: "paidAt",
      render: (value) => formatDateTime(value),
    },
    {
      title: "Người tạo",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (uid) => (uid ? `User #${uid}` : "-"),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => openDetail(record)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  // ------------------------------------------------------------------
  // RENDER UI
  // ------------------------------------------------------------------
  return (
    <Card variant="outlined" style={{ margin: 20 }}>
      {/* Hàng filter trên cùng */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* Bộ lọc ngày – dùng RangePicker cho tiện chọn */}
        <Col span={10}>
          <RangePicker
            style={{ width: "100%" }}
            value={
              fromDate && toDate ? [fromDate, toDate] : null
            }
            onChange={(dates) => {
              if (!dates) {
                setFromDate(null);
                setToDate(null);
              } else {
                setFromDate(dates[0]);
                setToDate(dates[1]);
              }
            }}
          />
        </Col>

        {/* Nút Lọc */}
        <Col span={4}>
          <Button
            icon={<ReloadOutlined />}
            style={{ width: "100%" }}
            onClick={handleFilter}
          >
            Lọc
          </Button>
        </Col>

        {/* Nút Xóa lọc – Rule 30, type default, icon ClearOutlined */}
        <Col span={4}>
          <Button
            type="default"
            icon={<ClearOutlined />}
            style={{ width: "100%" }}
            onClick={handleClearFilter}
          >
            Xóa lọc
          </Button>
        </Col>
      </Row>

      {/* Bảng danh sách payment */}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={payments}
        columns={columns}
        variant="borderless"
      />

      {/* Modal chi tiết payment */}
      <PaymentDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        payment={selectedPayment}
      />
    </Card>
  );
}
