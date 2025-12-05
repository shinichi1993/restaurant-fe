// src/pages/voucher/VoucherPage.jsx
// Trang quản lý Voucher – Module 17
// -------------------------------------------------------------

import { useEffect, useState } from "react";
import { Table, Button, Space, Tag, Form, Input, Select, Row, Col, message } from "antd";
import {
  getVouchers,
  createVoucher,
  updateVoucher,
  deactivateVoucher,
} from "../../api/voucherApi";
import VoucherFormModal from "../../components/voucher/VoucherFormModal";

export default function VoucherPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [form] = Form.useForm();

  // Load voucher khi mở trang
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getVouchers();
      setVouchers(res);
    } catch (err) {
      message.error("Lỗi khi tải danh sách voucher");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset bộ lọc (Rule bắt buộc)
  const resetFilter = () => {
    form.resetFields();
    loadData();
  };

  // Submit form filter
  const handleSearch = () => {
    const { code, status } = form.getFieldsValue();

    let result = vouchers;

    if (code) result = result.filter((v) => v.code.toLowerCase().includes(code.toLowerCase()));
    if (status) result = result.filter((v) => v.status === status);

    setVouchers(result);
  };

  // Thêm mới
  const handleCreate = () => {
    setEditingVoucher(null);
    setModalOpen(true);
  };

  // Sửa
  const handleEdit = (record) => {
    setEditingVoucher(record);
    setModalOpen(true);
  };

  // Submit modal
  const handleSubmitModal = async (values) => {
    try {
      if (editingVoucher) {
        await updateVoucher(editingVoucher.id, values);
        message.success("Cập nhật voucher thành công");
      } else {
        await createVoucher(values);
        message.success("Thêm voucher thành công");
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi xử lý voucher");
    }
  };

  // Vô hiệu hóa
  const handleDeactivate = async (id) => {
    try {
      await deactivateVoucher(id);
      message.success("Đã vô hiệu hóa voucher");
      loadData();
    } catch (err) {
      message.error("Không thể vô hiệu hóa voucher");
    }
  };

  // Các cột bảng
  const columns = [
    { title: "Mã", dataIndex: "code", key: "code" },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    {
      title: "Loại",
      dataIndex: "discountType",
      render: (val) =>
        val === "PERCENT" ? <Tag color="green">Giảm %</Tag> : <Tag color="blue">Giảm tiền</Tag>,
    },
    {
      title: "Giá trị",
      dataIndex: "discountValue",
      render: (v) => v?.toLocaleString(),
    },
    {
      title: "Giảm tối đa",
      dataIndex: "maxDiscountAmount",
      render: (v) => v?.toLocaleString(),
    },
    {
      title: "Đơn tối thiểu",
      dataIndex: "minOrderAmount",
      render: (v) => v?.toLocaleString(),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "ACTIVE" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Sửa</Button>
          <Button danger onClick={() => handleDeactivate(record.id)}>
            Vô hiệu hóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <h2 style={{ marginBottom: 20 }}>Quản lý Voucher</h2>

      {/* Bộ lọc */}
      <Form form={form} layout="inline" style={{ marginBottom: 20 }}>
        <Form.Item name="code">
          <Input placeholder="Tìm theo mã" allowClear />
        </Form.Item>

        <Form.Item name="status">
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 150 }}
            options={[
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "INACTIVE", label: "INACTIVE" },
            ]}
          />
        </Form.Item>

        <Button type="primary" onClick={handleSearch}>
          Tìm kiếm
        </Button>

        <Button onClick={resetFilter} style={{ marginLeft: 10 }}>
          Xóa lọc
        </Button>

        <Button type="primary" style={{ marginLeft: "auto" }} onClick={handleCreate}>
          Thêm mới
        </Button>
      </Form>

      {/* Bảng dữ liệu */}
      <Table
        loading={loading}
        dataSource={vouchers}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      {/* Modal thêm/sửa */}
      <VoucherFormModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmitModal}
        initialValues={editingVoucher}
      />
    </>
  );
}
