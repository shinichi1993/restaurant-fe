// OrderPage.jsx – Trang danh sách Order
// --------------------------------------------------------------
// Chức năng chính:
//  - Hiển thị danh sách order từ API /orders
//  - Tìm kiếm theo orderCode (mã Order)
//  - Lọc theo trạng thái (NEW / SERVING / PAID)
//  - Xóa filter (Rule 30)
//  - Xem chi tiết Order (modal)
//  - Xóa Order
//  - Chuyển trang sang màn hình tạo Order mới
//
// UI/UX theo Rule 27
// Table/Card sử dụng variant="borderless" theo Rule 29
// Không bọc AdminLayout (Rule 14)
// --------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Row,
  Col,
  Input,
  Select,
  Space,
  Tag,
  message,
  Card,
  Tabs,
} from "antd";

// ------------------------------------------------------------
// Detect mobile / desktop (Ant Design breakpoint)
// ------------------------------------------------------------
import { Grid } from "antd";
const { useBreakpoint } = Grid;

import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  ClearOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";

import {
  getOrders,
  deleteOrder,
  updateOrderStatus,
} from "../../api/orderApi";

import OrderDetailModal from "../../components/order/OrderDetailModal";
import PaymentModal from "../../components/payment/PaymentModal";
import { fetchAllSettings } from "../../api/settingApi"; // ✅ Thêm dòng này
import { APP_MODE } from "../../constants/appMode";

export default function OrderPage() {
    // ------------------------------------------------------------
  // Detect mobile
  // - screens.md = false → mobile
  // ------------------------------------------------------------
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const navigate = useNavigate();

  // --------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  // =======================================================
  // EPIC 3 – Tab trạng thái thanh toán (Admin)
  // UNPAID: Chưa thanh toán (NEW, SERVING)
  // PAID  : Đã thanh toán (PAID)
  // =======================================================
  const [activeTab, setActiveTab] = useState("UNPAID");

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [openPay, setOpenPay] = useState(false);       // Modal thanh toán
  const [payOrder, setPayOrder] = useState(null);      // Order đang thanh toán

  // --------------------------------------------------------------
  // Cấu hình POS lấy từ System Setting (Module 20)
  //  - allowCancelItem: cho phép xóa/hủy order hay không
  //  - allowEditAfterSend: dự phòng cho UI edit món sau khi SERVING (tạm chưa dùng)
  // --------------------------------------------------------------
  const [posSettings, setPosSettings] = useState({
    allowCancelItem: true,      // mặc định giữ hành vi cũ: cho xóa
    allowEditAfterSend: false,  // mặc định: không cho sửa sau khi gửi bếp
  });

  // --------------------------------------------------------------
  // LOAD DATA TỪ API
  // --------------------------------------------------------------
  const loadOrders = async () => {
    try {
      setLoading(true);

      // ==========================================================
      // EPIC 3 – Luôn lấy theo paid tab để ưu tiên order chưa thanh toán
      // ----------------------------------------------------------
      // UNPAID → paid=false (NEW, SERVING)
      // PAID   → paid=true  (PAID)
      // ==========================================================
      const params = {
        paid: activeTab === "PAID",
      };

      // Nếu user vẫn chọn status (UNPAID: NEW/SERVING) thì truyền lên BE
      // (PAID tab thường không cần status vì BE đã auto PAID theo paid=true)
      if (status) {
        params.status = status;
      }

      const res = await getOrders(params);
      setOrders(res);
    } catch (err) {
      console.error(err);
      // message.error("Không thể tải danh sách Order");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------
  // LOAD CẤU HÌNH POS TỪ API /api/settings (Module 20)
  // --------------------------------------------------------------
  const loadPosSettings = async () => {
    try {
      const res = await fetchAllSettings();
      const data = res.data || [];

      // Map settingKey → settingValue cho dễ đọc
      const map = {};
      data.forEach((s) => {
        if (s.settingKey) {
          map[s.settingKey] = s.settingValue;
        }
      });

      // Đọc các key POS
      const allowCancelItemRaw = map["pos.allow_cancel_item"];
      const allowEditAfterSendRaw = map["pos.allow_edit_after_send"];

      // Convert string → boolean với default
      const allowCancelItem =
        (allowCancelItemRaw ?? "true").toString().toLowerCase() === "true";

      const allowEditAfterSend =
        (allowEditAfterSendRaw ?? "false").toString().toLowerCase() === "true";

      setPosSettings({
        allowCancelItem,
        allowEditAfterSend,
      });
    } catch (err) {
      console.error("Lỗi load cấu hình POS:", err);
      // Không show error to quá to, chỉ log + để default state hoạt động
    }
  };

  useEffect(() => {
    // Load danh sách order
    loadOrders();
    // Load cấu hình POS (cho phép xóa / sửa...)
    loadPosSettings();
  }, [activeTab, status]);

  // --------------------------------------------------------------
  // HÀM XÓA LỌC (Rule 30)
  //  - Reset search
  //  - Reset status
  //  - Quay về tab mặc định UNPAID (ưu tiên order chưa thanh toán)
  // --------------------------------------------------------------
  const clearFilter = () => {
    setSearch("");
    setStatus("");
    setActiveTab("UNPAID");
  };

  // --------------------------------------------------------------
  // LỌC ORDER TRÊN FE
  // --------------------------------------------------------------
  const filteredOrders = orders.filter((o) => {
    const searchMatch = o.orderCode
      .toLowerCase()
      .includes(search.toLowerCase());

    const statusMatch = status ? o.status === status : true;

    return searchMatch && statusMatch;
  });

  // --------------------------------------------------------------
  // CẬP NHẬT TRẠNG THÁI ORDER
  // NEW → SERVING → PAID
  // --------------------------------------------------------------
  const handleChangeStatus = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      message.success("Cập nhật trạng thái thành công");
      loadOrders();
    } catch (err) {
      console.error(err);
      //message.error("Cập nhật trạng thái thất bại");
    }
  };

  // --------------------------------------------------------------
  // XÓA ORDER
  // --------------------------------------------------------------
  const handleDelete = async (id) => {
    try {
      await deleteOrder(id);
      message.success("Xóa order thành công");
      loadOrders();
    } catch (err) {
      console.error(err);
      //message.error("Xóa thất bại");
    }
  };

  // --------------------------------------------------------------
  // Mở modal thanh toán cho 1 order
  // --------------------------------------------------------------
  const handleOpenPayment = (record) => {
    setPayOrder(record);
    setOpenPay(true);
  };


  // --------------------------------------------------------------
  // CẤU HÌNH COLUMNS CHO TABLE
  // --------------------------------------------------------------
  const columns = [
    {
      title: "Mã Order",
      dataIndex: "orderCode",
      render: (text, record) => (
        <a
          onClick={() => {
            setSelectedOrder(record);
            setOpenDetail(true);
          }}
        >
          {text}
        </a>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (st) => {
        if (st === "NEW") return <Tag color="blue">Mới</Tag>;
        if (st === "SERVING") return <Tag color="orange">Đang phục vụ</Tag>;
        if (st === "PAID") return <Tag color="green">Đã thanh toán</Tag>;
        return st;
      },
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setSelectedOrder(record);
              setOpenDetail(true);
            }}
          >
            Chi tiết
          </Button>

          {/* Nếu đang NEW → Hiện nút Bắt đầu phục vụ */}
            {record.status === "NEW" && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleChangeStatus(record.id, "SERVING")}
              >
                Bắt đầu phục vụ
              </Button>
          )}

          {/* Nút Thanh toán – chỉ hiện khi đang SERVING */}
          {record.status === "SERVING" && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleOpenPayment(record)}
            >
              Thanh toán
            </Button>
          )}

          {posSettings.allowCancelItem && (
            <Button danger type="link" onClick={() => handleDelete(record.id)}>
              Xóa
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // --------------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------------
  return (
    <Card variant="outlined" style={{ margin: 20 }}>
      <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            // ======================================================
            // EPIC 3 – Đổi tab thì reset filter status + search
            // ======================================================
            setActiveTab(key);
            setSearch("");
            setStatus("");
          }}
          items={[
            { key: "UNPAID", label: "Chưa thanh toán" },
            { key: "PAID", label: "Đã thanh toán" },
          ]}
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* Tìm kiếm mã order */}
        <Col span={6}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm mã Order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>

        {/* Filter trạng thái */}
        <Col span={4}>
          <Select
            placeholder="Lọc trạng thái"
            allowClear
            style={{ width: "100%" }}
            value={status}
            onChange={(v) => setStatus(v)}
            options={
              activeTab === "UNPAID"
                ? [
                    { value: "NEW", label: "Mới" },
                    { value: "SERVING", label: "Đang phục vụ" },
                  ]
                : [
                    { value: "PAID", label: "Đã thanh toán" },
                  ]
            }
          />
        </Col>

        {/* Xóa lọc (Rule 30) */}
        <Col span={4}>
          <Button
            icon={<ClearOutlined />}
            style={{ width: "100%" }}
            onClick={clearFilter}
          >
            Xóa lọc
          </Button>
        </Col>

        {/* Tạo order mới - Nếu mobile sẽ k hiện */}
        {!isMobile && (
          <Col span={6}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ width: "100%" }}
              onClick={() => navigate("/orders/create")}
            >
              Tạo order mới
            </Button>
          </Col>
        )}
      </Row>

      {/* ==========================================================
          DESKTOP – TABLE (GIỮ NGUYÊN HÀNH VI CŨ)
      ========================================================== */}
      {!isMobile && (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredOrders}
          columns={columns}
          variant="borderless"
        />
      )}

      {/* ==========================================================
          MOBILE – CARD VIEW (VIEW ONLY)
      ========================================================== */}
      {isMobile && (
        <Space direction="vertical" style={{ width: "100%" }}>
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              variant="outlined"
              style={{ borderRadius: 10 }}
              onClick={() => {
                setSelectedOrder(order);
                setOpenDetail(true);
              }}
            >
              {/* Mã order */}
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {order.orderCode}
              </div>

              {/* Trạng thái */}
              <div style={{ marginTop: 6 }}>
                {order.status === "NEW" && <Tag color="blue">Mới</Tag>}
                {order.status === "SERVING" && <Tag color="orange">Đang phục vụ</Tag>}
                {order.status === "PAID" && <Tag color="green">Đã thanh toán</Tag>}
              </div>

              {/* Ghi chú */}
              <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
                Chạm để xem chi tiết
              </div>
            </Card>
          ))}
        </Space>
      )}

      {/* MODAL CHI TIẾT ORDER */}
      <OrderDetailModal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        order={selectedOrder}
      />

      {/* Modal thanh toán order */}
      <PaymentModal
        open={openPay}
        onClose={() => setOpenPay(false)}
        order={payOrder}
        reloadOrders={loadOrders}
        // ✅ EPIC 2: Admin dùng PaymentModal theo ngữ cảnh ADMIN
        contextMode={APP_MODE.ADMIN}
      />
    </Card>
  );
}
