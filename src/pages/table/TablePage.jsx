// TablePage.jsx – Trang quản lý danh sách Bàn (Module 16)
// ----------------------------------------------------------------------
// Chức năng:
//  - Hiển thị danh sách bàn dạng grid
//  - Thêm/sửa/xóa bàn
//  - Search + filter + xóa lọc
//  - ⬆️ NEW: Mở TableActionModal để: tạo order từ bàn, gộp/chuyển/tách bàn
//
// Quy tắc:
//  - Không bọc AdminLayout (Rule 14)
//  - UI theo Rule 27, Table variant Rule 29
//  - Toàn bộ comment tiếng Việt (Rule 13)
// ----------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Select,
  Input,
  Modal,
  Form,
  InputNumber,
  message,
} from "antd";

import {
  ReloadOutlined,
  PlusOutlined,
  ClearOutlined,
} from "@ant-design/icons";

import {
  fetchTables,
  createTable,
  updateTable,
  deleteTable,
} from "../../api/tableApi";

import TableCard from "../../components/table/TableCard"; // ⬅️ NEW
import TableActionModal from "../../components/table/TableActionModal"; // ⬅️ NEW
import { useNavigate } from "react-router-dom";

export default function TablePage() {
  // =====================================================================
  // STATE QUẢN LÝ DỮ LIỆU
  // =====================================================================

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState("");
  const [searchName, setSearchName] = useState("");

  const [form] = Form.useForm();
  const [formVisible, setFormVisible] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  // NEW — State cho TableActionModal
  const [actionVisible, setActionVisible] = useState(false); // mở modal thao tác
  const [selectedTable, setSelectedTable] = useState(null); // bàn được chọn

  const navigate = useNavigate();

  // =====================================================================
  // LOAD DATA
  // =====================================================================

  const loadTables = async () => {
    try {
      setLoading(true);
      const res = await fetchTables();
      setTables(res || []);
    } catch (err) {
      console.error("Lỗi load bàn:", err);
      //message.error("Không thể tải danh sách bàn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  // =====================================================================
  // FILTER + SEARCH
  // =====================================================================

  const handleClearFilter = () => {
    setFilterStatus("");
    setSearchName("");
  };

  const filteredTables = tables.filter((t) => {
    const nameMatch = t.name.toLowerCase().includes(searchName.toLowerCase());
    const statusMatch = filterStatus ? t.status === filterStatus : true;
    return nameMatch && statusMatch;
  });

  // =====================================================================
  // FORM CREATE / EDIT
  // =====================================================================

  const handleOpenCreate = () => {
    setEditingTable(null);
    form.resetFields();
    form.setFieldsValue({ capacity: 1 });
    setFormVisible(true);
  };

  const handleOpenEdit = (table) => {
    setEditingTable(table);
    form.setFieldsValue({
      name: table.name,
      capacity: table.capacity,
    });
    setFormVisible(true);
  };

  const handleCloseForm = () => {
    setFormVisible(false);
    setEditingTable(null);
    form.resetFields();
  };

  const handleSubmitForm = async (values) => {
    try {
      const payload = {
        name: values.name,
        capacity: values.capacity,
      };

      if (editingTable) {
        await updateTable(editingTable.id, payload);
        message.success("Cập nhật bàn thành công");
      } else {
        await createTable(payload);
        message.success("Tạo bàn mới thành công");
      }

      handleCloseForm();
      loadTables();
    } catch (err) {
      console.error("Lỗi lưu bàn:", err);
      //message.error("Không thể lưu bàn");
    }
  };

  // =====================================================================
  // DELETE TABLE
  // =====================================================================

  const handleDeleteTable = (table) => {
    Modal.confirm({
      title: "Xác nhận xóa bàn",
      content: `Bạn có chắc chắn muốn xóa bàn "${table.name}" không?`,
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteTable(table.id);
          message.success("Xóa bàn thành công");
          loadTables();
        } catch (err) {
          console.error("Lỗi xóa bàn:", err);
          message.error(
            err?.response?.data?.message ||
              "Không thể xóa bàn. Có thể bàn đang có order mở."
          );
        }
      },
    });
  };

  // =====================================================================
  // OPEN TABLE ACTION MODAL
  // =====================================================================

  /**
   * Mở modal thao tác nâng cao (Module 16):
   * - Gộp bàn
   * - Chuyển bàn
   * - Tách bàn
   * - Tạo order từ bàn
   * - Xem order đang phục vụ
   */
  const handleOpenAction = (table) => {
    setSelectedTable(table);
    setActionVisible(true);
  };

  // Tạo order từ TableActionModal
  const createOrderFromTable = (tableId) => {
    navigate(`/orders/create?tableId=${tableId}`);
  };

  // Mở order chi tiết (khi bàn đang phục vụ)
  const navigateOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  // =====================================================================
  // RENDER UI
  // =====================================================================

  return (
    <>
      <Card
        title="Quản lý Bàn"
        variant="outlined"
        style={{ margin: 20 }}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadTables}>
              Tải lại
            </Button>

            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              Thêm bàn
            </Button>
          </Space>
        }
      >
        {/* FILTER BAR */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input
              placeholder="Tìm tên bàn..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </Col>

          <Col span={6}>
            <Select
              placeholder="Lọc trạng thái"
              allowClear
              style={{ width: "100%" }}
              value={filterStatus || undefined}
              onChange={(v) => setFilterStatus(v || "")}
              options={[
                { value: "AVAILABLE", label: "Trống" },
                { value: "OCCUPIED", label: "Đang phục vụ" },
                { value: "RESERVED", label: "Đã đặt trước" },
                { value: "MERGED", label: "Đã gộp" },
              ]}
            />
          </Col>

          <Col span={4}>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilter}
              style={{ width: "100%" }}
            >
              Xóa lọc
            </Button>
          </Col>
        </Row>

        {/* GRID BÀN */}
        <Row gutter={[16, 16]}>
          {filteredTables.map((table) => (
            <Col xs={24} sm={12} md={8} lg={6} key={table.id}>
              <TableCard
                table={table}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteTable}
                onAction={handleOpenAction} // ⬅️ NEW: mở modal thao tác nâng cao
              />
            </Col>
          ))}

          {!loading && filteredTables.length === 0 && (
            <Col span={24}>
              <p>Không có bàn phù hợp điều kiện lọc.</p>
            </Col>
          )}
        </Row>
      </Card>

      {/* ================================================================
          MODAL THÊM / SỬA BÀN
      ================================================================= */}
      <Modal
        open={formVisible}
        onCancel={handleCloseForm}
        onOk={() => form.submit()}
        okText={editingTable ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        title={editingTable ? "Cập nhật bàn" : "Thêm bàn mới"}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleSubmitForm}>
          <Form.Item
            label="Tên bàn"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên bàn" }]}
          >
            <Input placeholder="VD: Bàn 1, VIP 02..." />
          </Form.Item>

          <Form.Item
            label="Số ghế"
            name="capacity"
            rules={[{ required: true, message: "Vui lòng nhập số ghế" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ================================================================
          MODAL THAO TÁC BÀN (MERGE / CHANGE / SPLIT / TẠO ORDER)
      ================================================================= */}
      <TableActionModal
        open={actionVisible}
        onClose={() => setActionVisible(false)}
        table={selectedTable}
        tables={tables}
        reloadTables={loadTables}
        navigateOrder={navigateOrder}
        createOrderFromTable={createOrderFromTable}
      />
    </>
  );
}
