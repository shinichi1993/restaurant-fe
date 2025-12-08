// src/pages/pos/simple/SimplePosTablePage.jsx
// ============================================================================
// SimplePosTablePage – Màn hình chọn bàn cho chế độ Simple POS
// ----------------------------------------------------------------------------
// Chức năng:
//  - Load danh sách bàn từ BE (sử dụng lại API đang dùng ở PosTablePage)
//  - Hiển thị dạng grid card dễ bấm trên tablet
//  - Khi click 1 bàn → điều hướng sang SimplePosOrderPage
//      path: /pos/simple/order
//      state: { tableId, tableName }
// ----------------------------------------------------------------------------
// LƯU Ý:
//  - Không sửa logic cũ của PosTablePage.
//  - Nếu sau này muốn chế độ "không cần bàn" (take-away) → có thể thêm
//    1 nút "Order không gán bàn" để vào thẳng SimplePosOrderPage.
// ============================================================================

import { useEffect, useState } from "react";
import { Row, Col, Card, Button, Space, Typography, Spin, message } from "antd";
import { useNavigate } from "react-router-dom";

import MotionWrapper from "../../../components/common/MotionWrapper";

// ⚠️ IMPORT API BÀN
// Hãy sửa dòng import dưới đây cho giống file PosTablePage hiện tại.
// VD nếu ở PosTablePage bạn dùng:
//   import { getRestaurantTables } from "../../api/tableApi";
// thì ở đây cũng dùng y hệt:
import { fetchTables } from "../../../api/tableApi";

const { Text, Title } = Typography;

export default function SimplePosTablePage() {
  const navigate = useNavigate();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Load danh sách bàn từ BE
  // ---------------------------------------------------------------------------
  const loadTables = async () => {
    try {
      setLoading(true);
      // Tuỳ theo API của bạn trả về dạng nào:
      //  - Nếu res.data là mảng: dùng res.data
      //  - Nếu res đã là mảng: dùng res
      //  const data = Array.isArray(res?.data) ? res.data : res;
      const data = await fetchTables();
      setTables(data || []);
    } catch (err) {
      console.error("Lỗi load danh sách bàn Simple POS:", err);
      //message.error("Không tải được danh sách bàn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  // ---------------------------------------------------------------------------
  // Khi chọn 1 bàn → đi đến màn SimplePosOrderPage, truyền tableId + tableName
  // ---------------------------------------------------------------------------
  const handleSelectTable = (table) => {
    navigate("/pos/simple/order", {
      state: {
        tableId: table.id,
        tableName: table.name || `Bàn ${table.id}`,
      },
    });
  };

  // Nếu muốn thêm chế độ "không cần bàn" → đi thẳng order:
  const handleOrderWithoutTable = () => {
    navigate("/pos/simple/order", {
      state: {
        tableId: null,
        tableName: "Mang đi / Không gán bàn",
      },
    });
  };

  return (
    <MotionWrapper>
      <div style={{ marginBottom: 16 }}>
        <Space
          style={{ width: "100%", justifyContent: "space-between" }}
          align="center"
        >
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              Chọn bàn – Simple POS
            </Title>
            <Text type="secondary">
              Chọn 1 bàn để bắt đầu gọi món. Phù hợp quán nhỏ / takeaway.
            </Text>
          </div>

          {/* Nút order không gán bàn (tùy config simple_pos_require_table) */}
          <Button
            variant="outlined"
            onClick={handleOrderWithoutTable}
          >
            Order không gán bàn
          </Button>
        </Space>
      </div>

      {loading ? (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin tip="Đang tải danh sách bàn..." />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {tables.map((table) => (
            <Col key={table.id} xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                variant="outlined"
                style={{ textAlign: "center" }}
                onClick={() => handleSelectTable(table)}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {table.name || `Bàn ${table.id}`}
                </div>
                <Text type="secondary">
                  Trạng thái:{" "}
                  <Text strong>
                    {table.status || "UNKNOWN"}
                  </Text>
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </MotionWrapper>
  );
}
