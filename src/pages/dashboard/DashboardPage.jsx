// DashboardPage.jsx – Màn hình tổng quan Dashboard hệ thống
// ====================================================================
// Chức năng chính:
//  - Hiển thị các thẻ thống kê nhanh (summary):
//      + Doanh thu hôm nay
//      + Số order hôm nay
//      + Tổng số order
//      + Doanh thu trung bình 7 ngày gần nhất
//  - Hiển thị "biểu đồ" doanh thu 7 ngày gần nhất (dạng danh sách + thanh ngang)
//  - Hiển thị bảng Top món bán chạy (TOP Dish)
// --------------------------------------------------------------------
// Quy tắc áp dụng:
//  - Không bọc AdminLayout trực tiếp (Rule 14) → Layout đã được bọc ở AppRoutes
//  - UI/UX theo chuẩn Ant Design (Rule 27)
//  - Card / Table sử dụng thuộc tính variant (không dùng bordered) (Rule 29)
//  - Toàn bộ comment dùng tiếng Việt (Rule 13)
// ====================================================================

// ------------------------------------------------------------
// Detect responsive breakpoint của Ant Design
// ------------------------------------------------------------
import { Grid } from "antd";
const { useBreakpoint } = Grid;

import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Typography,
  message,
  Spin,
} from "antd";
import {
  DollarCircleOutlined,
  ShoppingCartOutlined,
  OrderedListOutlined,
  LineChartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  getDashboardSummary,
  getRevenueLast7Days,
  getTopDishes,
} from "../../api/dashboardApi";

const { Title, Text } = Typography;

export default function DashboardPage() {
  // ============================
  // STATE CHÍNH CỦA DASHBOARD
  // ============================
  const [summary, setSummary] = useState(null); // Dữ liệu tổng quan summary
  const [revenue7Days, setRevenue7Days] = useState([]); // Doanh thu 7 ngày
  const [topDishes, setTopDishes] = useState([]); // Top món bán chạy

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingTopDishes, setLoadingTopDishes] = useState(false);

  // ------------------------------------------------------------
  // Detect thiết bị mobile
  // - screens.md = true  → desktop / tablet
  // - screens.md = false → mobile
  // ------------------------------------------------------------
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // ====================================================================
  // HÀM LOAD DỮ LIỆU DASHBOARD TỪ BE
  // ====================================================================

  /**
   * Load toàn bộ dữ liệu Dashboard:
   *  - Summary
   *  - Doanh thu 7 ngày gần nhất
   *  - Top món bán chạy
   *
   * Được gọi 1 lần khi mở màn hình (useEffect).
   */
  const loadDashboard = async () => {
    try {
      // Chia nhỏ loading theo từng block để UI mượt hơn
      setLoadingSummary(true);
      setLoadingChart(true);
      setLoadingTopDishes(true);

      // Gọi 3 API song song (Promise.all)
      const [summaryRes, revenueRes, topDishRes] = await Promise.all([
        getDashboardSummary(),
        getRevenueLast7Days(),
        getTopDishes(5),
      ]);

      setSummary(summaryRes);
      setRevenue7Days(revenueRes);
      setTopDishes(topDishRes);
    } catch (err) {
      console.error("Lỗi load Dashboard:", err);
      //message.error("Không thể tải dữ liệu Dashboard");
    } finally {
      setLoadingSummary(false);
      setLoadingChart(false);
      setLoadingTopDishes(false);
    }
  };

  // Gọi loadDashboard lần đầu
  useEffect(() => {
    loadDashboard();
  }, []);

  // ====================================================================
  // TÍNH TOÁN PHỤ – DÙNG CHO "BIỂU ĐỒ" DOANH THU 7 NGÀY
  // ====================================================================

  /**
   * Tính giá trị lớn nhất trong 7 ngày để scale chiều dài thanh.
   * Nếu không có dữ liệu hoặc toàn 0 → tránh chia cho 0.
   */
  const maxRevenue =
    revenue7Days.length > 0
      ? Math.max(...revenue7Days.map((i) => Number(i.totalRevenue || 0)))
      : 0;

  // ====================================================================
  // CẤU HÌNH CỘT BẢNG TOP MÓN BÁN CHẠY
  // ====================================================================
  const topDishColumns = [
    {
      title: "Món ăn",
      dataIndex: "dishName",
      key: "dishName",
      render: (text) => (
        <span>
          <TrophyOutlined style={{ marginRight: 6 }} />
          {text}
        </span>
      ),
    },
    {
      title: "Số lượng bán",
      dataIndex: "totalQuantity",
      key: "totalQuantity",
    },
    {
      title: "Doanh thu",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      render: (value) =>
        value != null ? value.toLocaleString("vi-VN") + " đ" : "0 đ",
    },
  ];

  // ====================================================================
  // RENDER UI DASHBOARD
  // ====================================================================

  return (
    <div style={{ padding: 20 }}>
      {/* TIÊU ĐỀ MÀN HÌNH */}
      <Title level={3} style={{ marginBottom: 20 }}>
        Dashboard tổng quan
      </Title>

      {/* HÀNG 1 – CÁC THẺ THỐNG KÊ NHANH */}
      <Row gutter={[16, 16]}>
        {/* Doanh thu hôm nay */}
        <Col xs={24} sm={12} md={6}>
          <Card
            variant="outlined"
            style={{ height: "100%" }}
          >
            {loadingSummary || !summary ? (
              <Spin />
            ) : (
              <Statistic
                title="Doanh thu hôm nay"
                value={summary.revenueToday}
                prefix={<DollarCircleOutlined />}
                valueStyle={{ color: "#3f8600" }}
                precision={0}
                suffix=" đ"
              />
            )}
          </Card>
        </Col>

        {/* Số order hôm nay */}
        <Col xs={24} sm={12} md={6}>
          <Card
            variant="outlined"
            style={{ height: "100%" }}
          >
            {loadingSummary || !summary ? (
              <Spin />
            ) : (
              <Statistic
                title="Số order hôm nay"
                value={summary.ordersToday}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            )}
          </Card>
        </Col>

        {/* Tổng số order */}
        <Col xs={24} sm={12} md={6}>
          <Card
            variant="outlined"
            style={{ height: "100%" }}
          >
            {loadingSummary || !summary ? (
              <Spin />
            ) : (
              <Statistic
                title="Tổng số order"
                value={summary.totalOrders}
                prefix={<OrderedListOutlined />}
              />
            )}
          </Card>
        </Col>

        {/* Doanh thu TB 7 ngày */}
        <Col xs={24} sm={12} md={6}>
          <Card
            variant="outlined"
            style={{ height: "100%" }}
          >
            {loadingSummary || !summary ? (
              <Spin />
            ) : (
              <Statistic
                title="Doanh thu TB 7 ngày"
                value={summary.averageRevenue7Days}
                prefix={<LineChartOutlined />}
                valueStyle={{ color: "#722ed1" }}
                precision={0}
                suffix=" đ"
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* HÀNG 2 – BIỂU ĐỒ + TOP DISH */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {/* "Biểu đồ" doanh thu 7 ngày gần nhất (dạng list + thanh ngang) */}
        <Col xs={24} md={14}>
          <Card
            title="Doanh thu 7 ngày gần nhất"
            variant="outlined"
          >
            {loadingChart ? (
              <Spin />
            ) : revenue7Days.length === 0 ? (
              <Text>Chưa có dữ liệu doanh thu.</Text>
            ) : (
              <div>
                {revenue7Days.map((item) => {
                  const value = Number(item.totalRevenue || 0);
                  // Tính % để vẽ thanh ngang (nếu maxRevenue = 0 thì cho 0%)
                  const percent =
                    maxRevenue > 0 ? Math.round((value / maxRevenue) * 100) : 0;

                  return (
                    <div
                      key={item.date}
                      style={{
                        marginBottom: 8,
                      }}
                    >
                      {/* Dòng ngày + số tiền */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Text>
                          {dayjs(item.date).format("DD/MM")}{" "}
                        </Text>
                        <Text strong>
                          {value.toLocaleString("vi-VN")} đ
                        </Text>
                      </div>

                      {/* Thanh "biểu đồ" đơn giản */}
                      <div
                        style={{
                          background: "#f5f5f5",
                          height: 8,
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percent}%`,
                            height: "100%",
                            background: "#1890ff",
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Bảng Top món bán chạy */}
        <Col xs={24} md={10}>
          <Card
            title="Top món bán chạy"
            variant="outlined"
          >
            {loadingTopDishes ? (
              <Spin />
            ) : (
              <Table
                rowKey="dishId"
                dataSource={topDishes}
                columns={topDishColumns}
                size="small"
                pagination={false}
                variant="borderless"
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
