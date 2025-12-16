// src/pages/audit/AuditLogPage.jsx
// ====================================================================
// AuditLogPage – Màn hình xem lịch sử Audit Log (Module 15)
// --------------------------------------------------------------------
// Chức năng:
//   ✔ Hiển thị danh sách Audit Log dạng bảng (Table + phân trang)
//   ✔ Bộ lọc (filter):
//        - Entity (text)
//        - User ID
//        - Action (dropdown lấy từ BE)
//   ✔ Nút "Tìm kiếm" gọi API searchAuditLogs()
//   ✔ Nút "Xóa lọc" reset filter + gọi lại API
//   ✔ Format thời gian theo Rule 26: dd/MM/yyyy HH:mm
//
// Chuẩn Rule 27 (UI/UX):
//   - Bọc trong Card (variant="outlined")
//   - Bố trí filter theo Row/Col gọn gàng
//   - Có nút "Xóa lọc" bắt buộc
// ====================================================================

import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Input,
  Select,
  Row,
  Col,
  Button,
  Tag,
  message,
} from "antd";
import { DatePicker, Modal } from "antd";

import dayjs from "dayjs";
import "dayjs/locale/vi";

import { searchAuditLogs, getAuditActions } from "../../api/auditApi";

dayjs.locale("vi"); // hiển thị datetime theo locale tiếng Việt (nếu cần)

export default function AuditLogPage() {
  // ==================================================================
  // STATE CHÍNH
  // ==================================================================

  // Dữ liệu bảng (content trong Page<AuditLogResponse>)
  const [data, setData] = useState([]);

  // Danh sách Action lấy từ BE (enum AuditAction)
  const [actions, setActions] = useState([]);

  // Loading cho Table
  const [loading, setLoading] = useState(false);

  // Phân trang
  const [page, setPage] = useState(0); // 0-based
  const [total, setTotal] = useState(0); // tổng số bản ghi

  // Bộ lọc (filter)
  const [entity, setEntity] = useState("");  // filter theo tên entity
  const [username, setUsername] = useState("");  // filter theo username
  const [action, setAction] = useState([]);  // filter theo AuditAction

  // Filter theo khoảng thời gian (Rule 26: dd/MM/yyyy HH:mm)
  const [dateRange, setDateRange] = useState(null);

  // Dùng để mở modal xem chi tiết audit log
  const [selectedLog, setSelectedLog] = useState(null);

  // Key dùng để trigger reload dữ liệu (khi filter thay đổi)
  const [reloadKey, setReloadKey] = useState(0);

  // ==================================================================
  // HÀM LOAD DANH SÁCH ACTION TỪ BE
  // ==================================================================
  const loadActions = async () => {
    try {
      const res = await getAuditActions();
      setActions(res || []); // res là array string
    } catch (e) {
      console.error(e);
      //message.error("Không tải được danh sách Action từ hệ thống");
    }
  };

  // ==================================================================
  // HÀM LOAD DỮ LIỆU AUDIT LOG THEO FILTER + PAGE
  // ==================================================================
  const loadData = async () => {
    try {
      setLoading(true);

      // Chuẩn bị query param cho BE
      const params = {
        page,           // số trang hiện tại (0-based)
        size: 20,       // fix 20 bản ghi / trang
        entity: entity || null, // nếu trống thì gửi null để BE bỏ qua filter
        username: username || null,
        actions: action.length ? action : null,
        // Filter theo thời gian – khớp DateTimeUtil BE (Rule 26)
        fromDate: dateRange
          ? dateRange[0].format("DD/MM/YYYY HH:mm")
          : null,

        toDate: dateRange
          ? dateRange[1].format("DD/MM/YYYY HH:mm")
          : null,
      };

      const res = await searchAuditLogs(params);

      // res là Page<AuditLogResponse>
      setData(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (e) {
      console.error(e);
      //message.error("Không tải được dữ liệu Audit Log");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================================
  // useEffect: Lần đầu vào trang → load action list + load data
  // Sau đó: Mỗi khi page thay đổi → tự load lại data
  // ==================================================================
  useEffect(() => {
    // Lần đầu mount: load action list (chỉ 1 lần)
    loadActions();
  }, []);

  useEffect(() => {
    // Mỗi khi page đổi → reload data theo page mới
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page,reloadKey]); // CHỈ phụ thuộc page, reload key, filter do mình control khi bấm nút

  // ==================================================================
  // ĐỊNH NGHĨA CỘT TABLE
  // ==================================================================
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 60,
      render: (v, record) => (
        <a onClick={() => setSelectedLog(record)}>
          {v}
        </a>
      ),
    },
    {
      title: "User",
      dataIndex: "username",
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (v) => <Tag color="purple">{v}</Tag>,
    },
    {
      title: "Entity",
      dataIndex: "entity",
    },
    {
      title: "Entity ID",
      dataIndex: "entityId",
    },
    {
      title: "IP",
      dataIndex: "ipAddress",
      width: 140,
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : ""),
    },
  ];

  // ==================================================================
  // RENDER UI
  // ==================================================================
  return (
    <Card
      title="Lịch sử Audit Log"
      variant="borderless"      // chuẩn Rule 27,  variant="borderless" thì là Rule 29: dùng variant
      style={{ margin: 20 }} // cách lề với layout chính
    >
      {/* ===========================================================
          HÀNG FILTER (ENTITY, USER ID, ACTION, TÌM KIẾM, XÓA LỌC)
      ============================================================ */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {/* Entity filter */}
        <Col span={6}>
          <Input
            placeholder="Entity (vd: user, order...)"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          />
        </Col>

        {/* UserName filter */}
        <Col span={6}>
          <Input
            placeholder="User name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Col>

        {/* Filter theo khoảng thời gian */}
        <Col span={6}>
          <DatePicker.RangePicker
            style={{ width: "100%" }}
            showTime
            format="DD/MM/YYYY HH:mm" // Rule 26
            value={dateRange}
            onChange={setDateRange}
            placeholder={["Từ ngày", "Đến ngày"]}
          />
        </Col>

        {/* Action filter (dropdown lấy từ BE) */}
        <Col span={6}>
          <Select
            placeholder="Action"
            mode="multiple"
            allowClear           // cho phép clear để bỏ filter
            value={action || undefined}
            onChange={setAction}
            style={{ width: "100%" }}
          >
            {actions.map((a) => (
              <Select.Option key={a} value={a}>
                {a}
              </Select.Option>
            ))}
          </Select>
        </Col>

        {/* Nút Tìm kiếm */}
        <Col span={3}>
          <Button
            type="primary"
            block
            onClick={() => {
              // Reset về trang 0 rồi gọi loadData với filter hiện tại
              setPage(0);
              setReloadKey((k) => k + 1); // trigger search
            }}
          >
            Tìm kiếm
          </Button>
        </Col>

        {/* Nút Xóa lọc – bắt buộc theo Rule mới */}
        <Col span={3}>
          <Button
            block
            onClick={() => {
              // Reset toàn bộ filter về mặc định
              setEntity("");
              setUsername("");
              setAction([]);       // FIX BUG
              setDateRange(null);  // Reset filter ngày

              // Reset về trang đầu
              setPage(0);

              // Trigger reload danh sách không filter
              setReloadKey((k) => k + 1);
            }}
            >
            Xóa lọc
          </Button>
        </Col>
      </Row>

      {/* ===========================================================
          BẢNG HIỂN THỊ LỊCH SỬ AUDIT
      ============================================================ */}
      <Table
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={loading}
        pagination={{
          current: page + 1,  // Antd dùng page 1-based
          pageSize: 20,
          total: total,
          onChange: (p) => setPage(p - 1), // convert 1-based → 0-based
        }}
      />

      {/* Modal hiển thị thông tin chi tiết Audit log */}
      <Modal
        open={!!selectedLog}
        title="Chi tiết Audit Log"
        onCancel={() => setSelectedLog(null)}
        footer={null}
        width={800}
      >
        {selectedLog && (
          <>
            <p><b>User:</b> {selectedLog.username}</p>
            <p><b>Action:</b> {selectedLog.action}</p>
            <p>
              <b>Entity:</b> {selectedLog.entity}
              {selectedLog.entityId ? ` (ID: ${selectedLog.entityId})` : ""}
            </p>
            <p><b>IP:</b> {selectedLog.ipAddress}</p>
            <p><b>User-Agent:</b> {selectedLog.userAgent}</p>

            <h4>Before</h4>
            <pre style={{ 
              background: "#f6f6f6",
              padding: 8,
              whiteSpace: "pre-wrap",     // ⭐ TỰ XUỐNG DÒNG
              wordBreak: "break-word",    // ⭐ CẮT CHUỖI DÀI
              maxHeight: 200,             // ⭐ KHÔNG QUÁ CAO
              overflowY: "auto",          // ⭐ SCROLL DỌC
            }}>
              {selectedLog.beforeData || "—"}
            </pre>

            <h4>After</h4>
            <pre style={{ 
              background: "#f6f6f6",
              padding: 8,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 200,
              overflowY: "auto",
             }}>
              {selectedLog.afterData || "—"}
            </pre>
          </>
        )}
      </Modal>
    </Card>
  );
}