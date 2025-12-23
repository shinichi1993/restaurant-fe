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
import PageFilterBar from "../../components/common/PageFilterBar";

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
    <Card 
      variant="outlined" 
      style={{ margin: 20 }}
      title={<span style={{ fontSize: 26, fontWeight: 600 }}>Quản lý kho</span>}
      >
        {/* =========================================================
          FILTER BAR – DÙNG TEMPLATE CHUNG
          Bên trái: lọc ngày + nguyên liệu + lọc + xóa lọc
          Bên phải: nhập kho + điều chỉnh kho
      ========================================================= */}
      <PageFilterBar
        filters={
          <>
            {/* ================= LỌC THEO KHOẢNG NGÀY ================= */}
            <RangePicker
              style={{ width: 260 }}
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

            {/* ================= LỌC THEO NGUYÊN LIỆU ================= */}
            <Select
              placeholder="Lọc theo nguyên liệu"
              allowClear
              style={{ width: 240 }}
              value={ingredientId}
              onChange={(v) => setIngredientId(v)}
              options={ingredientOptions}
            />

            {/* ================= NÚT LỌC ================= */}
            <Button
              icon={<ReloadOutlined />}
              onClick={handleFilter}
            >
              Lọc
            </Button>

            {/* ================= XÓA LỌC (RULE 30) ================= */}
            <Button
              icon={<ClearOutlined />}
              onClick={clearFilter}
            >
              Xóa lọc
            </Button>
          </>
        }
        actions={
          <>
            {/* ================= NHẬP KHO ================= */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpenAdd(true)}
            >
              Nhập kho
            </Button>

            {/* ================= ĐIỀU CHỈNH KHO ================= */}
            <Button
              icon={<EditOutlined />}
              onClick={() => setOpenAdjust(true)}
            >
              Điều chỉnh kho
            </Button>
          </>
        }
      />

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
