// src/pages/pos/PosTablePage.jsx
// --------------------------------------------------------------
// PosTablePage – Trang danh sách bàn cho chế độ POS Tablet
// Mục đích:
//  - Hiển thị toàn bộ bàn dưới dạng grid, card to, dễ bấm
//  - Cho phép filter theo trạng thái + tìm kiếm theo tên
//  - Khi chọn 1 bàn (không bị DISABLED) → chuyển sang màn Order
//
// Lưu ý:
//  - Dùng cùng API bàn với Module 16 (TablePage)
//  - Chỉ hiển thị, không xử lý logic order ở đây
// --------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, Spin, Tag, message, Select, Input, Button, Space } from "antd";
import { useNavigate } from "react-router-dom";

// TODO: Import api lấy danh sách bàn từ module hiện tại
// Tên hàm dưới đây chỉ là gợi ý, bạn sửa lại theo đúng file api của bạn.
// Ví dụ: nếu ở module 16 đang dùng fetchTables(), thì đổi lại cho khớp.
import { fetchTables as apiFetchTables } from "../../api/tableApi";
import { fetchAllSettings } from "../../api/settingApi"; // ✅ Thêm dòng này
import MotionWrapper from "../../components/common/MotionWrapper";

/**
 * Hàm map status bàn sang màu Tag của antd
 * ----------------------------------------------------
 * - AVAILABLE  → xanh lá
 * - OCCUPIED   → cam
 * - DISABLED   → đỏ nhạt/xám
 */
const getStatusColor = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "green";
    case "OCCUPIED":
      return "orange";
    case "DISABLED":
      return "red";
    default:
      return "default";
  }
};

/**
 * Hàm map status sang nhãn tiếng Việt
 */
const getStatusLabel = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "Đang trống";
    case "OCCUPIED":
      return "Đang phục vụ";
    case "DISABLED":
      return "Tạm ngưng";
    default:
      return status || "Không xác định";
  }
};

const PosTablePage = () => {
  const navigate = useNavigate();

  // Danh sách bàn lấy từ API
  const [tables, setTables] = useState([]);

  // Trạng thái loading khi gọi API
  const [loading, setLoading] = useState(false);

  // Bộ lọc trạng thái bàn (ALL / AVAILABLE / OCCUPIED / DISABLED)
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Bộ lọc theo từ khoá (tên bàn, mã bàn)
  const [searchKeyword, setSearchKeyword] = useState("");

  // ----------------------------------------------------------
  // Cấu hình thời gian tự động refresh POS (giây)
  // Lấy từ system_setting.key = pos.refresh_interval_sec
  //  - 0 hoặc giá trị không hợp lệ → KHÔNG tự động refresh
  // ----------------------------------------------------------
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(0);

  // ----------------------------------------------------------
  // Hàm gọi API lấy danh sách bàn
  // ----------------------------------------------------------
  const loadTables = async () => {
    try {
        setLoading(true);

        const res = await apiFetchTables(); // 🔥 gọi đúng API thật

        const data = Array.isArray(res) ? res : res?.content || [];
        setTables(data);

    } catch (err) {
        console.error("❌ Lỗi khi tải danh sách bàn:", err);
        message.error("Không tải được danh sách bàn");
    } finally {
        setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Load cấu hình POS để lấy thời gian refresh (pos.refresh_interval_sec)
  // ----------------------------------------------------------
  const loadPosSettings = async () => {
    try {
      const res = await fetchAllSettings();
      const data = res.data || [];

      const posRefreshSetting = data.find(
        (s) => s.settingKey === "pos.refresh_interval_sec"
      );

      if (!posRefreshSetting || !posRefreshSetting.settingValue) {
        // Không cấu hình hoặc rỗng → không auto refresh
        setRefreshIntervalSec(0);
        return;
      }

      // Convert string → number
      const parsed = Number(posRefreshSetting.settingValue);
      if (Number.isNaN(parsed) || parsed <= 0) {
        setRefreshIntervalSec(0);
      } else {
        setRefreshIntervalSec(parsed);
      }
    } catch (err) {
      console.error("Lỗi load cấu hình POS (refresh_interval_sec):", err);
      // Nếu lỗi → không auto refresh, tránh làm phiền user
      setRefreshIntervalSec(0);
    }
  };

  // ----------------------------------------------------------
  // Gọi API lần đầu khi component mount
  // ----------------------------------------------------------
  useEffect(() => {
    loadTables();
    loadPosSettings();
  }, []);

  // ----------------------------------------------------------
  // Tự động refresh danh sách bàn theo cấu hình POS
  // ----------------------------------------------------------
  useEffect(() => {
    // Nếu không cấu hình hoặc <= 0 → không auto refresh
    if (!refreshIntervalSec || refreshIntervalSec <= 0) {
      return;
    }

    // Đổi sang millisecond
    const intervalMs = refreshIntervalSec * 1000;

    const timerId = setInterval(() => {
      loadTables();
    }, intervalMs);

    // Clear interval khi unmount hoặc khi refreshIntervalSec thay đổi
    return () => clearInterval(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshIntervalSec]);

  // ----------------------------------------------------------
  // Hàm xử lý khi chọn một bàn
  // ----------------------------------------------------------
  const handleSelectTable = (table) => {
    // Nếu bàn đang bị DISABLED thì không cho vào order
    if (table.status === "DISABLED") {
      message.warning("Bàn này đang tạm ngưng, không thể order");
      return;
    }

    // Điều hướng sang màn order của bàn đó
    navigate(`/pos/table/${table.id}/order`);
  };

  // ----------------------------------------------------------
  // Hàm reset bộ lọc (status + keyword)
  // ----------------------------------------------------------
  const handleResetFilter = () => {
    setStatusFilter("ALL");
    setSearchKeyword("");
  };

  // ----------------------------------------------------------
  // Tính toán danh sách bàn sau khi áp dụng filter
  // ----------------------------------------------------------
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      // Filter theo trạng thái
      if (statusFilter !== "ALL" && table.status !== statusFilter) {
        return false;
      }

      // Filter theo từ khoá tìm kiếm
      if (searchKeyword?.trim()) {
        const keyword = searchKeyword.trim().toLowerCase();
        const name = (table.name || "").toLowerCase();
        const code = (table.code || "").toLowerCase();
        return name.includes(keyword) || code.includes(keyword);
      }

      return true;
    });
  }, [tables, statusFilter, searchKeyword]);

  // ----------------------------------------------------------
  // Giao diện render
  // ----------------------------------------------------------

  if (loading) {
    // Loading toàn trang – dùng cho lần load đầu
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        <Spin tip="Đang tải danh sách bàn..." />
      </div>
    );
  }

  return (
    <MotionWrapper>
    <>
        <div>
        {/* ------------------------------------------------------
            Khu vực filter phía trên
        ------------------------------------------------------ */}
        <Space
            style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}
            align="center"
        >
            {/* Bên trái: Filter trạng thái + tìm kiếm */}
            <Space wrap>
            {/* Filter trạng thái bàn */}
            <Select
                style={{ width: 180 }}
                value={statusFilter}
                onChange={setStatusFilter}
                // Rule 29: dùng variant thay cho bordered
                variant="outlined"
                options={[
                { label: "Tất cả trạng thái", value: "ALL" },
                { label: "Đang trống", value: "AVAILABLE" },
                { label: "Đang phục vụ", value: "OCCUPIED" },
                { label: "Tạm ngưng", value: "DISABLED" },
                ]}
            />

            {/* Ô tìm kiếm theo tên/mã bàn */}
            <Input
                placeholder="Tìm theo tên/mã bàn"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                allowClear
                style={{ width: 220 }}
            />
            </Space>

            {/* Bên phải: Nút Xóa lọc + Làm mới */}
            <Space>
            {/* Nút Xóa lọc – bắt buộc theo rule filter */}
            <Button variant="outlined" onClick={handleResetFilter}>
                Xóa lọc
            </Button>

            {/* Nút làm mới danh sách bàn – reload từ server */}
            <Button
                type="primary"
                variant="solid"
                onClick={loadTables}
            >
                Làm mới
            </Button>
            </Space>
        </Space>

        {/* ------------------------------------------------------
            Ghi chú trạng thái để nhân viên dễ hiểu
        ------------------------------------------------------ */}
        <Space style={{ marginBottom: 16 }}>
            <span>Chú thích:</span>
            <Tag color={getStatusColor("AVAILABLE")}>Đang trống</Tag>
            <Tag color={getStatusColor("OCCUPIED")}>Đang phục vụ</Tag>
            <Tag color={getStatusColor("DISABLED")}>Tạm ngưng</Tag>
        </Space>

        {/* ------------------------------------------------------
            Grid hiển thị danh sách bàn
        ------------------------------------------------------ */}
        <Row gutter={[16, 16]}>
            {filteredTables.map((table) => (
            <Col
                key={table.id}
                xs={12}  // 2 cột trên màn hình nhỏ (tablet dọc)
                sm={8}   // 3 cột
                md={6}   // 4 cột trên màn hình lớn hơn
                lg={4}
            >
                <Card
                // Dùng variant theo Rule 29
                variant="outlined"
                // Card to hơn bình thường cho dễ bấm
                style={{
                    minHeight: 120,
                    cursor: table.status === "DISABLED" ? "not-allowed" : "pointer",
                    opacity: table.status === "DISABLED" ? 0.6 : 1,
                }}
                onClick={() => handleSelectTable(table)}
                >
                {/* Tên/mã bàn */}
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                    {table.name || table.code || `Bàn #${table.id}`}
                </div>

                {/* Trạng thái bàn */}
                <Tag color={getStatusColor(table.status)}>
                    {getStatusLabel(table.status)}
                </Tag>

                {/* Có thể hiển thị thêm thông tin khác nếu có:
                    - Số khách hiện tại
                    - Ghi chú
                    - Mã QR ...
                */}
                </Card>
            </Col>
            ))}

            {/* Trường hợp không có bàn nào sau filter */}
            {filteredTables.length === 0 && (
            <Col span={24}>
                <div
                style={{
                    textAlign: "center",
                    padding: "40px 0",
                    fontSize: 16,
                    opacity: 0.8,
                }}
                >
                Không có bàn nào phù hợp với bộ lọc hiện tại
                </div>
            </Col>
            )}
        </Row>
        </div>
    </>
    </MotionWrapper>
  );
};

export default PosTablePage;
