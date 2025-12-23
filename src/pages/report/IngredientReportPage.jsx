// IngredientReportPage.jsx – Báo cáo nguyên liệu
// --------------------------------------------------------------
// Chức năng:
//  - Bộ lọc ngày (from → to)
//  - Bảng 1: Nguyên liệu TIÊU HAO (StockEntry quantity âm)
//  - Bảng 2: Nguyên liệu NHẬP KHO (StockEntry quantity dương)
//  - Export Excel / PDF cho từng bảng
// --------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  DatePicker,
  Button,
  Table,
  message,
  Space,
  Typography,
} from "antd";
import {
  ReloadOutlined,
  ClearOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  getIngredientUsage,
  getStockEntryReport,
  exportIngredientUsageExcel,
  exportIngredientUsagePdf,
  exportStockEntryExcel,
  exportStockEntryPdf,
} from "../../api/reportApi";
import PageFilterBar from "../../components/common/PageFilterBar";

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function IngredientReportPage() {
  // ---------------------- STATE ----------------------
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [usageData, setUsageData] = useState([]); // tiêu hao
  const [stockData, setStockData] = useState([]); // nhập kho

  const [loadingUsage, setLoadingUsage] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);

  const [exporting, setExporting] = useState(false);

  // ---------------------- UTIL: Download file blob ----------------------
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ---------------------- UTIL: build params ----------------------
  const buildRangeParam = () => {
    return {
      from: fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : null,
      to: toDate ? dayjs(toDate).format("YYYY-MM-DD") : null,
    };
  };

  // ---------------------- LOAD DATA ----------------------
  const loadUsage = async () => {
    try {
      setLoadingUsage(true);
      const { from, to } = buildRangeParam();
      const res = await getIngredientUsage(from, to);
      setUsageData(res);
    } catch (err) {
      console.error(err);
      //message.error("Không tải được báo cáo tiêu hao");
    } finally {
      setLoadingUsage(false);
    }
  };

  const loadStock = async () => {
    try {
      setLoadingStock(true);
      const { from, to } = buildRangeParam();
      const res = await getStockEntryReport(from, to);
      setStockData(res);
    } catch (err) {
      console.error(err);
      //message.error("Không tải được báo cáo nhập kho");
    } finally {
      setLoadingStock(false);
    }
  };

  // Load lần đầu
  useEffect(() => {
    loadUsage();
    loadStock();
  }, []);

  // ---------------------- CLEAR FILTER ----------------------
  const clearFilter = () => {
    setFromDate(null);
    setToDate(null);
    loadUsage();
    loadStock();
  };

  // ---------------------- EXPORT TIÊU HAO ----------------------
  const handleExportUsageExcel = async () => {
    try {
      setExporting(true);
      const { from, to } = buildRangeParam();
      const res = await exportIngredientUsageExcel(from, to);
      downloadBlob(
        new Blob([res.data]),
        `ingredient-usage-${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (e) {
      console.error(e);
      //message.error("Xuất Excel tiêu hao thất bại");
    } finally {
      setExporting(false);
    }
  };

  const handleExportUsagePdf = async () => {
    try {
      setExporting(true);
      const { from, to } = buildRangeParam();
      const res = await exportIngredientUsagePdf(from, to);
      downloadBlob(
        new Blob([res.data], { type: "application/pdf" }),
        `ingredient-usage-${dayjs().format("YYYYMMDD_HHmmss")}.pdf`
      );
    } catch (e) {
      console.error(e);
      //message.error("Xuất PDF tiêu hao thất bại");
    } finally {
      setExporting(false);
    }
  };

  // ---------------------- EXPORT NHẬP KHO ----------------------
  const handleExportStockExcel = async () => {
    try {
      setExporting(true);
      const { from, to } = buildRangeParam();
      const res = await exportStockEntryExcel(from, to);
      downloadBlob(
        new Blob([res.data]),
        `stock-entry-${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (e) {
      console.error(e);
      //message.error("Xuất Excel nhập kho thất bại");
    } finally {
      setExporting(false);
    }
  };

  const handleExportStockPdf = async () => {
    try {
      setExporting(true);
      const { from, to } = buildRangeParam();
      const res = await exportStockEntryPdf(from, to);
      downloadBlob(
        new Blob([res.data], { type: "application/pdf" }),
        `stock-entry-${dayjs().format("YYYYMMDD_HHmmss")}.pdf`
      );
    } catch (e) {
      console.error(e);
      //message.error("Xuất PDF nhập kho thất bại");
    } finally {
      setExporting(false);
    }
  };

  // ---------------------- TABLE COLUMNS ----------------------
  const usageColumns = [
    { title: "Nguyên liệu", dataIndex: "ingredientName" },
    { title: "Đơn vị", dataIndex: "unit" },
    {
      title: "Tiêu hao",
      dataIndex: "totalUsed",
      render: (v) => (v ?? 0).toLocaleString(),
    },
  ];

  const stockColumns = [
    { title: "Nguyên liệu", dataIndex: "ingredientName" },
    { title: "Đơn vị", dataIndex: "unit" },
    {
      title: "Nhập kho",
      dataIndex: "totalImportedAmount",
      render: (v) => (v ?? 0).toLocaleString(),
    },
  ];

  // ---------------------- UI ----------------------
  return (
    <div style={{ padding: 20 }} >
      {/* Bộ lọc */}
      <Card variant="outlined" style={{ marginBottom: 16 }} title={<span style={{ fontSize: 26, fontWeight: 600 }}>Báo cáo nguyên liệu và Kho</span>}>
        <PageFilterBar
          filters={
            <>
              {/* ================= LỌC KHOẢNG NGÀY ================= */}
              <RangePicker
                value={fromDate && toDate ? [dayjs(fromDate), dayjs(toDate)] : null}
                onChange={(dates) => {
                  if (!dates) {
                    setFromDate(null);
                    setToDate(null);
                  } else {
                    setFromDate(dates[0]);
                    setToDate(dates[1]);
                  }
                }}
                style={{ width: 260 }}
              />

              {/* ================= NÚT LỌC ================= */}
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  loadUsage();
                  loadStock();
                }}
              >
                Lọc
              </Button>

              {/* ================= XÓA LỌC – RULE 30 ================= */}
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilter}
              >
                Xóa lọc
              </Button>
            </>
          }
        />
      </Card>

      {/* TIÊU HAO */}
      <Card
        variant="outlined"
        style={{ marginBottom: 20 }}
        title={
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={5} style={{ margin: 0 }}>
                Báo cáo NGUYÊN LIỆU TIÊU HAO
              </Title>
            </Col>
            <Col>
              <Space>
                <Button
                  size="small"
                  icon={<FileExcelOutlined />}
                  onClick={handleExportUsageExcel}
                  loading={exporting}
                >
                  Excel
                </Button>
                <Button
                  size="small"
                  icon={<FilePdfOutlined />}
                  onClick={handleExportUsagePdf}
                  loading={exporting}
                >
                  PDF
                </Button>
              </Space>
            </Col>
          </Row>
        }
      >
        <Table
          rowKey="ingredientId"
          dataSource={usageData}
          columns={usageColumns}
          loading={loadingUsage}
          variant="borderless"
        />
      </Card>

      {/* NHẬP KHO */}
      <Card
        variant="outlined"
        title={
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={5} style={{ margin: 0 }}>
                Báo cáo NHẬP KHO NGUYÊN LIỆU
              </Title>
            </Col>
            <Col>
              <Space>
                <Button
                  size="small"
                  icon={<FileExcelOutlined />}
                  onClick={handleExportStockExcel}
                  loading={exporting}
                >
                  Excel
                </Button>
                <Button
                  size="small"
                  icon={<FilePdfOutlined />}
                  onClick={handleExportStockPdf}
                  loading={exporting}
                >
                  PDF
                </Button>
              </Space>
            </Col>
          </Row>
        }
      >
        <Table
          rowKey="ingredientId"
          dataSource={stockData}
          columns={stockColumns}
          loading={loadingStock}
          variant="borderless"
        />
      </Card>
    </div>
  );
}
