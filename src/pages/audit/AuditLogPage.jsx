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
  const [userId, setUserId] = useState("");  // filter theo userId
  const [action, setAction] = useState([]);  // filter theo AuditAction

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
        userId: userId || null,
        actions: action.length ? action : null,
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
  }, [page]); // CHỈ phụ thuộc page, filter do mình control khi bấm nút

  // ==================================================================
  // ĐỊNH NGHĨA CỘT TABLE
  // ==================================================================
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 60,
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
      variant="outlined"      // chuẩn Rule 27
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

        {/* UserId filter */}
        <Col span={6}>
          <Input
            placeholder="User ID..."
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
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
              // Vì setPage là async, nhưng page=0 thường là giá trị hiện tại khi vừa vào
              // nên để chắc chắn, gọi loadData thêm 1 lần với filter mới
              // (trường hợp muốn "strict" hơn có thể bỏ, nhưng dùng thế này là ổn, dễ hiểu)
              loadData();
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
              // Reset tất cả filter về mặc định
              setEntity("");
              setUserId("");
              setAction("");

              // Reset về trang đầu
              setPage(0);

              // Gọi lại loadData để trả về list mặc định
              loadData();
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
    </Card>
  );
}