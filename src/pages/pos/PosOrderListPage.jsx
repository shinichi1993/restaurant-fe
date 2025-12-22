// PosOrderListPage.jsx – POS Order List (màn hình thu ngân)
// ======================================================================
// EPIC 4 – POS Cashier Screen
//
// Mục tiêu thực tế:
//  1) Hiển thị order CHƯA thanh toán (NEW + SERVING)
//  2) Gõ tay → gợi ý realtime theo orderCode
//  3) Quét QR / ENTER → chốt chính xác 1 order
//  4) Xem nhanh – In phiếu – Thanh toán ngay
//
// Quy ước POS:
//  - Scanner luôn bắn ENTER cuối chuỗi
//  - Gõ tay không cần nhập full mã
//
// Rule áp dụng:
//  - AntD Card variant="borderless" (Rule 29)
//  - Có nút "Xóa lọc" (Rule 30)
//  - Comment tiếng Việt đầy đủ (Rule 13)
// ======================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Tag,
  Space,
  Drawer,
  Descriptions,
  message,
  Select,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  ClearOutlined,
} from "@ant-design/icons";

import { getOrders, updateOrderStatus } from "../../api/orderApi";
import { exportOrderSlipPdf } from "../../api/orderSlipApi";
import { openPdfAndPrint } from "../../utils/printUtils";
import PaymentModal from "../../components/payment/PaymentModal";
import { APP_MODE } from "../../constants/appMode";

export default function PosOrderListPage() {
  // ==============================================================
  // STATE – DATA
  // ==============================================================

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  // ==============================================================
  // STATE – SEARCH (RẤT QUAN TRỌNG – TÁCH RÕ)
  // ==============================================================

  // Text đang gõ / scanner đang bắn
  const [searchText, setSearchText] = useState("");

  // Text dùng để gợi ý realtime (gõ tay)
  const [suggestText, setSuggestText] = useState("");

  // Text đã ENTER (scan thành công / xác nhận)
  const [submittedSearch, setSubmittedSearch] = useState("");

  // Lọc trạng thái (NEW / SERVING)
  const [status, setStatus] = useState("");

  // ==============================================================
  // STATE – UI
  // ==============================================================

  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [openPay, setOpenPay] = useState(false);
  const [payOrder, setPayOrder] = useState(null);

  const searchInputRef = useRef(null);

  // ==============================================================
  // LOAD ORDERS – chỉ lấy order CHƯA thanh toán
  // ==============================================================

  const loadOrders = async () => {
    try {
      setLoading(true);

      const params = { paid: false };
      if (status) params.status = status;

      const res = await getOrders(params);
      setOrders(res || []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách order POS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [status]);

  // Auto focus input khi mở trang
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // ==============================================================
  // RULE 30 – XÓA LỌC
  // ==============================================================

  const clearFilter = () => {
    setSearchText("");
    setSuggestText("");
    setSubmittedSearch("");
    setStatus("");
    searchInputRef.current?.focus();
  };

    // ==========================================================
    // FILTER GỢI Ý REALTIME (gõ tay)
    // - Luôn lọc theo status đang chọn
    // ==========================================================
    const suggestedOrders = useMemo(() => {
        let list = orders;

        // 1️⃣ Filter theo trạng thái nếu có chọn
        if (status) {
            list = list.filter((o) => o.status === status);
        }

        // 2️⃣ Filter theo text gợi ý
        if (!suggestText) return list;

        const s = suggestText.toLowerCase();
        return list.filter((o) =>
            (o.orderCode || "").toLowerCase().includes(s)
        );
    }, [orders, suggestText, status]);

  // ==============================================================
  // FILTER 2 – SAU KHI ENTER / SCAN
  // ==============================================================

  const displayedOrders = useMemo(() => {
    if (!submittedSearch) return suggestedOrders;

    const s = submittedSearch.toLowerCase();
    return orders.filter((o) =>
      (o.orderCode || "").toLowerCase().includes(s)
    );
  }, [orders, suggestedOrders, submittedSearch]);

  // ==============================================================
  // ENTER / SCAN → CHỐT ORDER
  // ==============================================================

  const handlePressEnter = () => {
    const value = searchText.trim();
    if (!value) return;

    // Scanner luôn bắn ENTER → set submittedSearch
    setSubmittedSearch(value);
  };

  // ==============================================================
  // UI HELPERS
  // ==============================================================

  const renderStatusTag = (st) => {
    if (st === "NEW") return <Tag color="blue">Mới</Tag>;
    if (st === "SERVING") return <Tag color="orange">Đang phục vụ</Tag>;
    if (st === "PAID") return <Tag color="green">Đã thanh toán</Tag>;
    return <Tag>{st}</Tag>;
  };

  // ==============================================================
  // ACTIONS
  // ==============================================================

  const openQuickView = (order) => {
    setSelectedOrder(order);
    setOpenDrawer(true);
  };

  const openPayment = (order) => {
    setPayOrder(order);
    setOpenPay(true);
  };

  const handlePaidSuccess = async () => {
    setOpenPay(false);
    message.success("Thanh toán thành công");
    await loadOrders();
    setOpenDrawer(false);
    setSelectedOrder(null);
  };

  const handleChangeStatus = async (orderId) => {
    try {
      await updateOrderStatus(orderId, "SERVING");
      message.success("Đã bắt đầu phục vụ");
      await loadOrders();
    } catch (err) {
      console.error(err);
      message.error("Không thể cập nhật trạng thái order");
    }
  };

  const handlePrintOrderSlip = async (order) => {
    try {
      const pdfBlob = await exportOrderSlipPdf(order.id);
      openPdfAndPrint(pdfBlob);
    } catch (err) {
      console.error(err);
      message.error("Không thể in phiếu gọi món");
    }
  };

  // ==============================================================
  // UI
  // ==============================================================

  return (
    <Card
      variant="borderless"
      style={{ margin: 16, borderRadius: 12 }}
      title="POS – Danh sách order (Chưa thanh toán)"
      extra={
        <Button icon={<ReloadOutlined />} onClick={loadOrders}>
          Tải lại
        </Button>
      }
    >
      {/* ================= FILTER BAR ================= */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col xs={24} md={10}>
          <Input
            ref={searchInputRef}
            size="large"
            prefix={<SearchOutlined />}
            placeholder="Quét QR hoặc nhập mã Order..."
            value={searchText}
            onChange={(e) => {
              const v = e.target.value;
              setSearchText(v);
              setSuggestText(v); // gợi ý realtime
              setSubmittedSearch(""); // reset trạng thái scan
            }}
            onPressEnter={handlePressEnter}
          />
        </Col>

        <Col xs={24} md={6}>
          <Select
            size="large"
            placeholder="Lọc trạng thái"
            allowClear
            style={{ width: "100%" }}
            value={status}
            onChange={(v) => setStatus(v || "")}
            options={[
              { value: "NEW", label: "Mới" },
              { value: "SERVING", label: "Đang phục vụ" },
            ]}
          />
        </Col>

        <Col xs={24} md={4}>
          <Button icon={<ClearOutlined />} block onClick={clearFilter}>
            Xóa lọc
          </Button>
        </Col>
      </Row>

      {/* ================= ORDER CARD LIST ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {displayedOrders.map((order) => (
          <Card
            key={order.id}
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              cursor: "pointer",
            }}
            onClick={() => openQuickView(order)}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {order.orderCode}
            </div>

            <div style={{ marginTop: 8 }}>
              {renderStatusTag(order.status)}
            </div>

            <div style={{ marginTop: 8 }}>
              Tổng tiền:{" "}
              <strong>
                {order.totalAmount ?? order.totalPrice ?? 0}
              </strong>
            </div>

            <div style={{ marginTop: 16 }}>
              <Space>
                {order.status === "NEW" && (
                  <Button
                    size="large"
                    block
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeStatus(order.id);
                    }}
                  >
                    Bắt đầu phục vụ
                  </Button>
                )}

                <Button
                  size="large"
                  block
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrintOrderSlip(order);
                  }}
                >
                  In phiếu
                </Button>

                {order.status === "SERVING" && (
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={(e) => {
                      e.stopPropagation();
                      openPayment(order);
                    }}
                  >
                    Thanh toán
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        ))}
      </div>

      {/* ================= DRAWER ================= */}
      <Drawer
        title="Chi tiết Order"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        width={520}
      >
        {selectedOrder && (
          <>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Mã Order">
                {selectedOrder.orderCode}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {renderStatusTag(selectedOrder.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Bàn">
                {selectedOrder.tableName || "—"}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>

      {/* ================= PAYMENT MODAL ================= */}
      <PaymentModal
        open={openPay}
        onClose={() => setOpenPay(false)}
        order={payOrder}
        contextMode={APP_MODE.POS}
        onPaidSuccess={handlePaidSuccess}
      />
    </Card>
  );
}
