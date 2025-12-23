import { Row, Col, Space } from "antd";

/**
 * PageFilterBar – Thanh filter dùng chung cho toàn hệ thống
 * --------------------------------------------------------
 * - filters: nhóm tìm kiếm / lọc (bên trái)
 * - actions: nút hành động chính (bên phải)
 * - Tự wrap khi màn hình nhỏ
 */
export default function PageFilterBar({ filters, actions }) {
  return (
    <Row
      gutter={[16, 8]}
      align="middle"
      style={{ marginBottom: 16 }}
    >
      {/* ================= FILTER GROUP ================= */}
      <Col flex="auto">
        <Space wrap>
          {filters}
        </Space>
      </Col>

      {/* ================= ACTION GROUP ================= */}
      {actions && (
        <Col>
          <Space>
            {actions}
          </Space>
        </Col>
      )}
    </Row>
  );
}
