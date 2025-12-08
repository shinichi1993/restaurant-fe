// StockEntryPage.jsx – Trang quản lý nhập kho & điều chỉnh kho
// --------------------------------------------------------------
// Chức năng:
//  - Hiển thị lịch sử nhập kho / điều chỉnh kho
//  - Filter theo khoảng ngày (fromDate – toDate)
//  - Filter theo nguyên liệu (ingredientId)
//  - Nút Xóa lọc (Rule 30)
//  - Nhập kho (quantity > 0)
//  - Điều chỉnh kho (quantity âm hoặc dương)
//  - UI/UX chuẩn Rule 27
//  - Không bọc AdminLayout (Rule 14)
//  - Table/Card sử dụng variant (Rule 29)
// --------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Row,
  Col,
  Button,
  DatePicker,
  Space,
  Tag,
  message,
  Select,   // ⭐ FIX: Import Select
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  getStockEntries,
  filterStockEntries,
} from "../../api/stockEntryApi";

import { getIngredients } from "../../api/ingredientApi";
import StockEntryFormModal from "../../components/stock/StockEntryFormModal";
import AdjustStockModal from "../../components/stock/AdjustStockModal";

const { RangePicker } = DatePicker;

export default function StockEntryPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // State filter ngày
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // State filter nguyên liệu
  // --------------------------------------------------
  // ingredientOptions: chứa danh sách {value, label}
  // ingredientId: ID nguyên liệu cần lọc (null nếu không chọn)
  const [ingredientId, setIngredientId] = useState(null);
  const [ingredientOptions, setIngredientOptions] = useState([]);

  // State modal
  const [openAdd, setOpenAdd] = useState(false);
  const [openAdjust, setOpenAdjust] = useState(false);

  // --------------------------------------------------------------
  // Hàm load toàn bộ lịch sử nhập kho / điều chỉnh kho
  // --------------------------------------------------------------
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getStockEntries();
      setData(res);
    } catch (err) {
      console.error(err);
      //message.error("Không thể tải lịch sử nhập kho");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Hàm load danh sách nguyên liệu để hiển thị lên dropdown filter.
   * ---------------------------------------------------------------
   * - Gọi API getIngredients()
   * - Convert dữ liệu thành options {value, label}
   * - Lưu vào state để hiển thị trong Select
   */
  const loadIngredientOptions = async () => {
    try {
      const res = await getIngredients();
      setIngredientOptions(
        res.map((i) => ({
          value: i.id,
          label: `${i.name} (${i.unit})`,
        }))
      );
    } catch (err) {
      console.error(err);
      //message.error("Không thể tải danh sách nguyên liệu để lọc");
    }
  };

  // Load dữ liệu khi mở trang
  useEffect(() => {
    loadData();               // Load lịch sử nhập kho
    loadIngredientOptions();  // Load danh sách nguyên liệu cho dropdown
  }, []);

  // --------------------------------------------------------------
  // Hàm filter dữ liệu nhập kho
  // --------------------------------------------------------------
  const handleFilter = async () => {
    try {
      setLoading(true);

      const from = fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : null;
      const to = toDate ? dayjs(toDate).format("YYYY-MM-DD") : null;

      // B1: Filter theo ngày từ BE
      let res = await filterStockEntries(from, to);

      // B2: Filter tiếp theo nguyên liệu (nếu có chọn)
      if (ingredientId) {
        res = res.filter((item) => item.ingredientId === ingredientId);
      }

      setData(res);
    } catch (err) {
      console.error(err);
      //message.error("Không thể lọc dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------
  // Hàm reset toàn bộ filter theo Rule 30
  // --------------------------------------------------------------
  const clearFilter = () => {
    setFromDate(null);
    setToDate(null);
    setIngredientId(null);
    loadData();
  };

  // --------------------------------------------------------------
  // Cột dữ liệu cho bảng lịch sử
  // --------------------------------------------------------------
  const columns = [
    {
      title: "Nguyên liệu",
      dataIndex: "ingredientName",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      render: (qty) =>
        qty > 0 ? (
          <Tag color="green">+ {qty}</Tag>
        ) : (
          <Tag color="red">{qty}</Tag>
        ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (t) => dayjs(t).format("DD/MM/YYYY HH:mm"),
    },
  ];

  return (
    <Card variant="outlined" style={{ margin: 20 }}>
        {/* HÀNG 1 – BỘ LỌC */}
        <Row gutter={16} style={{ marginBottom: 16 }}>

            {/* Bộ lọc ngày */}
            <Col span={8}>
            <RangePicker
                style={{ width: "100%" }}
                value={
                fromDate && toDate ? [dayjs(fromDate), dayjs(toDate)] : null
                }
                onChange={(dates) => {
                if (!dates) {
                    setFromDate(null);
                    setToDate(null);
                } else {
                    setFromDate(dates[0]);
                    setToDate(dates[1]);
                }
                }}
            />
            </Col>

            {/* Lọc theo nguyên liệu */}
            <Col span={6}>
            <Select
                placeholder="Lọc theo nguyên liệu"
                allowClear
                style={{ width: "100%" }}
                value={ingredientId}
                onChange={(v) => setIngredientId(v)}
                options={ingredientOptions}
            />
            </Col>

            {/* Nút Lọc */}
            <Col span={4}>
            <Button
                icon={<ReloadOutlined />}
                style={{ width: "100%" }}
                onClick={handleFilter}
            >
                Lọc
            </Button>
            </Col>

            {/* Nút Xóa lọc */}
            <Col span={4}>
            <Button
                icon={<ClearOutlined />}
                style={{ width: "100%" }}
                onClick={clearFilter}
            >
                Xóa lọc
            </Button>
            </Col>
        </Row>

        {/* HÀNG 2 – HÀNH ĐỘNG */}
        <Row style={{ marginBottom: 16 }}>
            <Col span={24}>
            <Space style={{ width: "100%", justifyContent: "end" }}>
                <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setOpenAdd(true)}
                >
                Nhập kho
                </Button>

                <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => setOpenAdjust(true)}
                >
                Điều chỉnh kho
                </Button>
            </Space>
            </Col>
        </Row>

        {/* TABLE */}
        <Table
            rowKey="id"
            loading={loading}
            dataSource={data}
            columns={columns}
            variant="borderless"
        />

        {/* Modals */}
        <StockEntryFormModal
            open={openAdd}
            onClose={() => setOpenAdd(false)}
            reload={loadData}
        />

        <AdjustStockModal
            open={openAdjust}
            onClose={() => setOpenAdjust(false)}
            reload={loadData}
        />

        </Card>

  );
}
