// TopDishReportPage.jsx – Báo cáo top món bán chạy
// --------------------------------------------------------------
// Chức năng:
//  - Lọc ngày
//  - Lọc limit (top 5 / top 10 / top 20)
//  - Hiển thị bảng món bán chạy
// --------------------------------------------------------------

import { useEffect, useState } from "react";
import { Card, Row, Col, DatePicker, Button, Select, Table, message, Space } from "antd";
import { ReloadOutlined, ClearOutlined, FileExcelOutlined, FilePdfOutlined, } from "@ant-design/icons";
import dayjs from "dayjs";
import { 
  getTopDishes,
  exportTopDishesExcel,
  exportTopDishesPdf,
      } from "../../api/reportApi";

const { RangePicker } = DatePicker;

export default function TopDishReportPage() {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [limit, setLimit] = useState(10);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [exporting, setExporting] = useState(false);

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const from = fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : null;
      const to = toDate ? dayjs(toDate).format("YYYY-MM-DD") : null;
      const res = await exportTopDishesExcel(from, to, limit);
      downloadBlob(
        new Blob([res.data]),
        `top-dishes-${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (e) {
      console.error(e);
      message.error("Xuất Excel thất bại");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const from = fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : null;
      const to = toDate ? dayjs(toDate).format("YYYY-MM-DD") : null;
      const res = await exportTopDishesPdf(from, to, limit);
      downloadBlob(
        new Blob([res.data], { type: "application/pdf" }),
        `top-dishes-${dayjs().format("YYYYMMDD_HHmmss")}.pdf`
      );
    } catch (e) {
      console.error(e);
      message.error("Xuất PDF thất bại");
    } finally {
      setExporting(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const from = fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : null;
      const to = toDate ? dayjs(toDate).format("YYYY-MM-DD") : null;

      const res = await getTopDishes(from, to, limit);
      setData(res);
    } catch (err) {
      console.error(err);
      message.error("Không tải được báo cáo top món");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearFilter = () => {
    setFromDate(null);
    setToDate(null);
    setLimit(10);
    loadData();
  };

  const columns = [
    { title: "Món ăn", dataIndex: "dishName" },
    { title: "Số lượng bán", dataIndex: "totalQuantity" },
    { title: "Doanh thu", dataIndex: "totalRevenue", render: v => v.toLocaleString() + " đ" },
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
          <Select
            style={{ width: "100%" }}
            value={limit}
            onChange={setLimit}
            options={[
              { value: 5, label: "Top 5" },
              { value: 10, label: "Top 10" },
              { value: 20, label: "Top 20" },
            ]}
          />
        </Col>

        <Col span={4}>
          <Button icon={<ReloadOutlined />} style={{ width: "100%" }} onClick={loadData}>
            Lọc
          </Button>
        </Col>

        <Col span={4}>
          <Button icon={<ClearOutlined />} style={{ width: "100%" }} onClick={clearFilter}>
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

      <Table
        rowKey="dishId"
        dataSource={data}
        columns={columns}
        loading={loading}
        variant="borderless"
      />
    </Card>
  );
}
