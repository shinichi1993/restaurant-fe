// src/components/notification/NotificationBell.jsx
// ======================================================================
// Chuông thông báo (Notification Bell) – Module 14
// ----------------------------------------------------------------------
// - Hiển thị icon chuông + badge số thông báo CHƯA ĐỌC (từ Context)
// - Khi click mở popover:
//     + Tab "Chưa đọc": 10 thông báo chưa đọc mới nhất
//     + Tab "Tất cả"  : 10 thông báo mới nhất (đọc / chưa đọc)
// - Click 1 thông báo → mark as READ (gọi API + update Context)
// - Nút "Đánh dấu tất cả đã đọc"
// ----------------------------------------------------------------------
// Dùng Ant Design Popover thay cho Dropdown để tránh lỗi
// "React.Children.only expected a single React element child"
// ======================================================================

import { useEffect, useState } from "react";
import {
  Badge,
  List,
  Spin,
  Button,
  Typography,
  Tabs,
  Popover,
} from "antd";
import {
  BellOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/notificationApi";
import { useNotificationContext } from "../../context/NotificationContext";

// Cấu hình dayjs
dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text } = Typography;

export default function NotificationBell() {
  // Lấy danh sách CHƯA ĐỌC từ context để hiển thị badge
  const { unread, setUnread } = useNotificationContext();

  // State cục bộ cho popup
  const [notifications, setNotifications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [open, setOpen] = useState(false);

  // ------------------------------------------------------------
  // GỌI API LẤY LIST ĐẦY ĐỦ
  // ------------------------------------------------------------
  const loadNotifications = async () => {
    try {
      setLoadingList(true);
      const data = await getMyNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error("Lỗi load thông báo:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    // Lần đầu mount, load 1 lần
    loadNotifications();
  }, []);

  // ------------------------------------------------------------
  // MỞ / ĐÓNG POPOVER
  //  - Khi mở → reload list mới nhất
  // ------------------------------------------------------------
  const handleOpenChange = (visible) => {
    setOpen(visible);
    if (visible) {
      loadNotifications();
    }
  };

  // ------------------------------------------------------------
  // TÍNH TOÁN LIST HIỂN THỊ
  // ------------------------------------------------------------
  
  // ===============================
  // 1. TOÀN BỘ notification đã sort
  // ===============================
  const sortedNotifications = [...notifications].sort(
    (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
  );

  // ===============================
  // 2. UNREAD: lọc từ TOÀN BỘ
  // ===============================
  const unreadNotifications = sortedNotifications
    .filter((n) => n.status === "UNREAD")
    .slice(0, 10); // chỉ giới hạn hiển thị 10 cái

  // ===============================
  // 3. ALL: lấy 10 cái mới nhất
  // ===============================
  const latestNotifications = sortedNotifications.slice(0, 10);

  // ------------------------------------------------------------
  // MARK READ 1 CÁI
  // ------------------------------------------------------------
  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);

      // Cập nhật context: remove khỏi unread
      setUnread((prev) => prev.filter((n) => n.id !== id));

      // Reload list trong popup
      await loadNotifications();
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  };

  // ------------------------------------------------------------
  // MARK READ TẤT CẢ
  // ------------------------------------------------------------
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();

      // Clear unread trong context
      setUnread([]);

      await loadNotifications();
    } catch (err) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", err);
    }
  };

  // ------------------------------------------------------------
  // ICON THEO TYPE
  // ------------------------------------------------------------
  const renderNotificationIcon = (type) => {
    switch (type) {
      case "ORDER":
        return <ShoppingCartOutlined style={{ marginRight: 6 }} />;
      case "STOCK":
        return <InboxOutlined style={{ marginRight: 6 }} />;
      default:
        return <InfoCircleOutlined style={{ marginRight: 6 }} />;
    }
  };

  // ------------------------------------------------------------
  // RENDER 1 ITEM TRONG LIST
  // ------------------------------------------------------------
  const renderNotificationItem = (item) => (
    <List.Item
      onClick={() => handleMarkRead(item.id)}
      style={{
        backgroundColor: item.status === "UNREAD" ? "#e6f7ff" : "#ffffff",
        borderRadius: 4,
        marginBottom: 6,
        padding: 10,
        cursor: "pointer",
      }}
    >
      <List.Item.Meta
        title={
          <Text strong>
            {renderNotificationIcon(item.type)}
            {item.title}
          </Text>
        }
        description={
          <>
            <div>{item.message}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(item.createdAt).fromNow()} ·{" "}
              {dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}
            </Text>
          </>
        }
      />
    </List.Item>
  );

  // ------------------------------------------------------------
  // NỘI DUNG POPOVER (Tabs + List)
  // ------------------------------------------------------------
  const popupContent = (
    <div style={{ width: 360, maxHeight: 420, padding: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text strong>Thông báo</Text>
        <Button size="small" onClick={handleMarkAllRead}>
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      <Spin spinning={loadingList}>
        <Tabs
          defaultActiveKey="unread"
          items={[
            {
              key: "unread",
              label: `Chưa đọc (${unreadNotifications.length}/${
                unread.length > 10 ? "10+" : unread.length
              })`,
              children: (
                <List
                  style={{ maxHeight: 300, overflowY: "auto" }}
                  dataSource={unreadNotifications}
                  locale={{ emptyText: "Không có thông báo chưa đọc" }}
                  renderItem={renderNotificationItem}
                />
              ),
            },
            {
              key: "all",
              label: "Tất cả",
              children: (
                <List
                  style={{ maxHeight: 300, overflowY: "auto" }}
                  dataSource={latestNotifications}
                  locale={{ emptyText: "Không có thông báo" }}
                  renderItem={renderNotificationItem}
                />
              ),
            },
          ]}
        />
      </Spin>
    </div>
  );

  // ------------------------------------------------------------
  // RENDER CHUÔNG + BADGE
  // ------------------------------------------------------------
  return (
    <Popover
      content={popupContent}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={handleOpenChange}
    >
      <Badge 
        count={unread.length > 10 ? "10+" : unread.length} 
        size="small" 
        offset={[0, 5]}
        >
        <BellOutlined
          style={{
            fontSize: 20,
            color: "#1677ff",
            cursor: "pointer",
            marginRight: 20,
          }}
        />
      </Badge>
    </Popover>
  );
}
