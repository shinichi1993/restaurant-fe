// src/pages/pos/KitchenPage.jsx
// ============================================================================
// KitchenPage – Màn hình Bếp (POS Advanced Phase 2)
// ----------------------------------------------------------------------------
// Chức năng:
//  - Hiển thị danh sách ORDER, trong mỗi ORDER có danh sách món cần chế biến
//  - Cho phép đầu bếp chuyển trạng thái từng món:
//       NEW → SENT_TO_KITCHEN → COOKING → DONE / CANCELED
//  - Cho phép hủy món nếu POS cho phép (BE kiểm tra bằng pos.allow_cancel_item)
//  - Lọc theo TRẠNG THÁI món (tab filter) + nút "Xóa lọc"
//  - Nút "Làm mới" để reload dữ liệu ngay lập tức
//  - AUTO REFRESH: tự reload mỗi X giây (polling)
//  - ÂM THANH: khi có order/món mới xuất hiện → phát tiếng "ting!"
//
// Layout:
//  - File này đã được bọc bằng PosLayout ở PosRoutes → KHÔNG bọc lại layout
//  - Bên trên: tiêu đề + filter + nút làm mới
//  - Bên dưới: danh sách KitchenOrderCard (mỗi card = 1 ORDER)
// ============================================================================

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Row,
  Col,
  Segmented,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Empty,
} from "antd";

import { getKitchenOrders, updateKitchenItemStatus } from "../../api/kitchenApi";
import KitchenOrderCard from "./KitchenOrderCard";

const { Title, Text } = Typography;

// Các option trạng thái cho filter
// value = null → không filter, hiện tất cả
const STATUS_OPTIONS = [
  { label: "Tất cả", value: null },
  { label: "Mới tạo", value: "NEW" },
  { label: "Đã gửi bếp", value: "SENT_TO_KITCHEN" },
  { label: "Đang nấu", value: "COOKING" },
  { label: "Hoàn thành", value: "DONE" },
  { label: "Đã hủy", value: "CANCELED" },
];

// 🔁 Thời gian auto refresh (ms)
//  - 5000ms = 5 giây
//  - Sau này nếu muốn mềm dẻo hơn có thể đọc từ SystemSetting (BE) rồi truyền xuống FE
const AUTO_REFRESH_INTERVAL_MS = 5000;

export default function KitchenPage() {
  // ------------------------------------------------------------
  // STATE QUẢN LÝ DỮ LIỆU
  // ------------------------------------------------------------

  // Danh sách order trả về từ BE (KitchenOrderResponse[])
  const [orders, setOrders] = useState([]);

  // Loading chung cho màn hình bếp
  const [loading, setLoading] = useState(false);

  // Trạng thái filter hiện tại (null = tất cả)
  const [statusFilter, setStatusFilter] = useState(null);

  // ------------------------------------------------------------
  // useRef phục vụ âm thanh + detect order mới
  // ------------------------------------------------------------
  const audioRef = useRef(null); // trỏ tới thẻ <audio>

  // Lưu tổng số món (items) của lần load trước
  const prevTotalItemsRef = useRef(0);

  // Đánh dấu lần load đầu tiên (để không phát tiếng)
  const isFirstLoadRef = useRef(true);

  // ------------------------------------------------------------
  // HÀM LOAD DỮ LIỆU TỪ BE
  // ------------------------------------------------------------
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // 1) Gọi API lấy danh sách order cho bếp
      const res = await getKitchenOrders();
      const newOrders = res.data || [];

      // 2) Tính tổng số món ở tất cả order hiện tại
      const currentTotalItems = newOrders.reduce((sum, order) => {
        const count = order.items ? order.items.length : 0;
        return sum + count;
      }, 0);

      const prevTotalItems = prevTotalItemsRef.current;

      // 3) Nếu KHÔNG phải lần load đầu tiên và
      //    tổng số món hiện tại > lần trước → coi như có order/món mới
      if (!isFirstLoadRef.current && currentTotalItems > prevTotalItems) {
        // Thử phát âm thanh nếu thẻ audio đã được gán ref
        if (audioRef.current) {
          try {
            // tua về đầu để nếu tiếng trước chưa chạy xong thì vẫn phát lại từ đầu
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
              // Một số trình duyệt chặn autoplay nếu user chưa tương tác
              // → bỏ qua lỗi, không cần hiển thị message
            });
          } catch (e) {
            // Không làm gì, tránh crash UI
            // console.log("Không phát được âm thanh", e);
          }
        }
      }

      // 4) Cập nhật ref cho lần sau
      prevTotalItemsRef.current = currentTotalItems;
      isFirstLoadRef.current = false;

      // 5) Lưu vào state
      setOrders(newOrders);
    } catch (error) {
      console.error(error);
      //message.error("Không tải được danh sách order cho bếp");
    } finally {
      setLoading(false);
    }
  }, []);

  // Lần đầu mount component → load dữ liệu ngay
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ------------------------------------------------------------
  // 6.2 – AUTO REFRESH MỖI X GIÂY
  // ------------------------------------------------------------
  useEffect(() => {
    // Dùng setInterval gọi lại loadData mỗi X giây.
    // Lưu ý: phải clearInterval khi component unmount để tránh memory leak.
    const intervalId = setInterval(() => {
      loadData();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadData]);

  // ------------------------------------------------------------
  // EVENT: ĐỔI FILTER TRẠNG THÁI
  // ------------------------------------------------------------
  const handleChangeFilter = (value) => {
    // value là 1 trong [null, "NEW", "SENT_TO_KITCHEN", ...]
    setStatusFilter(value);
  };

  const handleResetFilter = () => {
    setStatusFilter(null);
  };

  // ------------------------------------------------------------
  // EVENT: ĐỔI TRẠNG THÁI 1 MÓN
  // ------------------------------------------------------------
  const handleChangeStatus = async (orderItemId, nextStatus) => {
    try {
      setLoading(true);
      await updateKitchenItemStatus(orderItemId, nextStatus, null);
      message.success("Cập nhật trạng thái món thành công");
      await loadData(); // reload lại danh sách sau khi update
    } catch (error) {
      console.error(error);
      const msg =
        error?.response?.data?.message ||
        "Không cập nhật được trạng thái món";
      //message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // EVENT: HỦY MÓN
  // ------------------------------------------------------------
  const handleCancelItem = async (orderItemId) => {
    try {
      setLoading(true);
      await updateKitchenItemStatus(
        orderItemId,
        "CANCELED",
        "Hủy từ màn hình bếp"
      );
      message.success("Đã hủy món");
      await loadData();
    } catch (error) {
      console.error(error);
      const msg =
        error?.response?.data?.message || "Không thể hủy món (POS setting)";
      //message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // ÁP DỤNG FILTER TRẠNG THÁI TRÊN FE
  // ------------------------------------------------------------
  const filteredOrders = orders
    .map((order) => {
      // Nếu không filter → giữ nguyên toàn bộ items
      if (!statusFilter) return order;

      // Nếu có filter → chỉ giữ lại những món có status tương ứng
      const filteredItems = (order.items || []).filter(
        (item) => item.status === statusFilter
      );

      return {
        ...order,
        items: filteredItems,
      };
    })
    // Bỏ những order không còn món nào sau khi filter
    .filter((order) => order.items && order.items.length > 0);

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <>
      {/* Thẻ audio ẩn dùng để phát tiếng khi có order/món mới
          - src: /sounds/new-order.mp3 (đặt trong thư mục public/sounds/)
          - preload="auto": browser preload file để khi cần là phát được ngay
      */}
      <audio
        ref={audioRef}
        src="/sounds/notice-pop.mp3"
        preload="auto"
        style={{ display: "none" }}
      />

      <Row gutter={[16, 16]}>
        {/* Header + filter */}
        <Col span={24}>
          <Space
            direction="vertical"
            style={{ width: "100%", marginBottom: 8 }}
          >
            <Title level={4} style={{ marginBottom: 4 }}>
              Màn hình bếp
            </Title>
            <Text type="secondary">
              Hiển thị danh sách món cần chế biến. Đầu bếp thao tác để cập nhật
              trạng thái món theo luồng NEW → SENT_TO_KITCHEN → COOKING →
              DONE/CANCELED.
            </Text>

            <Row
              justify="space-between"
              align="middle"
              style={{ marginTop: 8 }}
            >
              <Col>
                <Space>
                  {/* Filter theo trạng thái món */}
                  <Segmented
                    options={STATUS_OPTIONS.map((opt) => ({
                      label: opt.label,
                      value: opt.value,
                    }))}
                    value={statusFilter}
                    onChange={handleChangeFilter}
                  />

                  {/* Nút Xóa lọc theo Rule filter FE */}
                  <Button onClick={handleResetFilter}>Xóa lọc</Button>
                </Space>
              </Col>

              <Col>
                <Space>
                  {/* Nút làm mới danh sách bằng tay (ngoài auto refresh) */}
                  <Button onClick={loadData}>Làm mới</Button>
                </Space>
              </Col>
            </Row>
          </Space>
        </Col>

        {/* Danh sách ORDER, mỗi order = 1 card */}
        <Col span={24}>
          <Spin spinning={loading}>
            {filteredOrders.length === 0 ? (
              <Empty description="Không có order nào trong bếp" />
            ) : (
              filteredOrders.map((order) => (
                <KitchenOrderCard
                  key={order.orderId}
                  order={order}
                  onChangeStatus={handleChangeStatus}
                  onCancelItem={handleCancelItem}
                />
              ))
            )}
          </Spin>
        </Col>
      </Row>
    </>
  );
}
