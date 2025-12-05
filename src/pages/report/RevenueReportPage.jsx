// RevenueReportPage.jsx – Báo cáo doanh thu
// --------------------------------------------------------------
// Chức năng:
//  - Bộ lọc fromDate – toDate
//  - Hiển thị tổng doanh thu, số đơn, doanh thu TB/ngày
//  - Bảng doanh thu theo từng ngày
//  - Thêm nút xuất Excel / PDF (Rule export)
// --------------------------------------------------------------
// UI theo Rule 27
// Không bọc AdminLayout (Rule 14)
// Table/Card dùng variant (Rule 29)
// --------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  DatePicker,
  Button,
  Table,
  Statistic,
  message,
  Space,
} from "antd";
import {
  ReloadOutlined,
  ClearOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getRevenueReport,
  exportRevenueExcel,
  exportRevenuePdf,
} from "../../api/reportApi";

const { RangePicker } = DatePicker;

export default function RevenueReportPage() {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState(null);

  // Hàm tiện ích: tải file blob về máy
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Load report
  const loadReport = async () => {
    try {
      setLoading(true);
      const from = fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : null;
      const to = toDate ? dayjs(toDate).format("YYYY-MM-DD") : null;

      const res = await getRevenueReport(from, to);
      setReport(res);
    } catch (err) {
      console.error(err);
      message.error("Không tải được báo cáo doanh thu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xóa lọc (Rule 30)
  const clearFilter = () => {
    setFromDate(null);
    setToDate(null);
    loadReport();
  };

  // Export Excel
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const from = fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : null;
      const to = toDate ? dayjs(toDate).format("YYYY-MM-DD") : null;

      const res = await exportRevenueExcel(from, to);
      downloadBlob(
        new Blob([res.data]),
        `revenue-${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (err) {
      console.error(err);
      message.error("Xuất Excel thất bại");
    } finally {
      setExporting(false);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const from = fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : null;
      const to = toDate ? dayjs(toDate).format("YYYY-MM-DD") : null;

      const res = await exportRevenuePdf(from, to);
      downloadBlob(
        new Blob([res.data], { type: "application/pdf" }),
        `revenue-${dayjs().format("YYYYMMDD_HHmmss")}.pdf`
      );
    } catch (err) {
      console.error(err);
      message.error("Xuất PDF thất bại");
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { title: "Ngày", dataIndex: "date" },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      render: (v) => (v ?? 0).toLocaleString() + " đ",
    },
    { title: "Số đơn", dataIndex: "orderCount" },
  ];

  return (
    <Card variant="outlined" style={{ margin: 20 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <RangePicker
            style={{ width: "100%" }}
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
          />
        </Col>

        <Col span={4}>
          <Button
            icon={<ReloadOutlined />}
            style={{ width: "100%" }}
            onClick={loadReport}
            loading={loading}
          >
            Lọc
          </Button>
        </Col>

        <Col span={4}>
          <Button
            icon={<ClearOutlined />}
            style={{ width: "100%" }}
            onClick={clearFilter}
            disabled={loading}
          >
            Xóa lọc
          </Button>
        </Col>

        {/* Nhóm nút Export nằm bên phải */}
        <Col span={8} style={{ textAlign: "right" }}>
          <Space>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel}
              loading={exporting}
            >
              Xuất Excel
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              onClick={handleExportPdf}
              loading={exporting}
            >
              Xuất PDF
            </Button>
          </Space>
        </Col>
      </Row>

      {report && (
        <>
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={8}>
              <Statistic
                title="Tổng doanh thu"
                value={report.totalRevenue || 0}
                suffix="đ"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tổng số đơn"
                value={report.totalOrders || 0}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Doanh thu trung bình/ngày"
                value={report.averageRevenuePerDay || 0}
                suffix="đ"
              />
            </Col>
          </Row>

          <Table
            rowKey="date"
            dataSource={report.items}
            columns={columns}
            loading={loading}
            variant="borderless"
          />
        </>
      )}
    </Card>
  );
}
