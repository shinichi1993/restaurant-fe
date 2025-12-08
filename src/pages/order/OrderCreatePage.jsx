// OrderCreatePage.jsx – Trang tạo Order (Module 16 cập nhật)
// ----------------------------------------------------------------------
// Chức năng mới bổ sung (Module 16):
//  - Nhận tableId từ URL (?tableId=5)
//  - Tự động điền vào form → bàn được chọn từ TablePage
//  - Không cho nhập tay tableName nữa (vì đã chuyển sang dùng tableId)
//  - Tải danh sách bàn từ API để hiển thị dropdown (nếu muốn chọn lại)
// ----------------------------------------------------------------------
//
// Quy tắc dự án:
//  - Comment tiếng Việt đầy đủ (Rule 13)
//  - Không bọc AdminLayout (Rule 14)
//  - UI theo Rule 27 + variant (Rule 29)
// ----------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  InputNumber,
  Button,
  Table,
  Select,
  Space,
  message,
} from "antd";

import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

import { createOrder } from "../../api/orderApi";
import { getDishes } from "../../api/dishApi";
import { fetchTables } from "../../api/tableApi"; // ⬅️ NEW: để load danh sách bàn

export default function OrderCreatePage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  // Danh sách món ăn
  const [dishes, setDishes] = useState([]);

  // Danh sách bàn (để chọn nếu người dùng muốn đổi)
  const [tables, setTables] = useState([]);

  // Giỏ hàng – danh sách món đã chọn
  const [items, setItems] = useState([]);

  const [loadingDishes, setLoadingDishes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ========================================================================
  // 1. ĐỌC tableId TỪ URL
  // ========================================================================

  /**
   * Lấy query param từ URL:
   *   /orders/create?tableId=3
   */
  const queryParams = new URLSearchParams(location.search);
  const tableIdFromUrl = queryParams.get("tableId"); // dạng chuỗi hoặc null

  // ========================================================================
  // 2. LOAD MÓN ĂN & DANH SÁCH BÀN
  // ========================================================================

  const loadDishes = async () => {
    try {
      setLoadingDishes(true);
      const res = await getDishes();
      setDishes(res);
    } catch (err) {
      console.error("Lỗi load món:", err);
      //message.error("Không thể tải danh sách món");
    } finally {
      setLoadingDishes(false);
    }
  };

  const loadTables = async () => {
    try {
      const res = await fetchTables();
      setTables(res || []);
    } catch (err) {
      console.error("Lỗi load bàn:", err);
      //message.error("Không thể tải danh sách bàn");
    }
  };

  useEffect(() => {
    loadDishes();
    loadTables();
  }, []);

  // ========================================================================
  // 3. TỰ ĐỘNG ĐIỀN tableId VÀO FORM (nếu có trên URL)
  // ========================================================================

  useEffect(() => {
    if (tableIdFromUrl) {
      form.setFieldsValue({
        tableId: Number(tableIdFromUrl),
      });
    }
  }, [tableIdFromUrl]);

  // ========================================================================
  // 4. THÊM MÓN VÀO GIỎ
  // ========================================================================

  const handleAddItem = () => {
    const dishId = form.getFieldValue("dishId");
    const quantity = form.getFieldValue("quantity");

    if (!dishId) {
      message.warning("Vui lòng chọn món");
      return;
    }
    if (!quantity || quantity <= 0) {
      message.warning("Số lượng phải > 0");
      return;
    }

    const dish = dishes.find((d) => d.id === dishId);
    if (!dish) {
      //message.error("Không tìm thấy món");
      return;
    }

    // Nếu món đã có → cộng dồn
    const idx = items.findIndex((i) => i.dishId === dishId);

    let newItems;
    if (idx >= 0) {
      newItems = [...items];
      newItems[idx].quantity += quantity;
    } else {
      newItems = [
        ...items,
        {
          dishId,
          dishName: dish.name,
          quantity,
        },
      ];
    }

    setItems(newItems);

    // reset trường món + số lượng
    form.setFieldsValue({
      dishId: null,
      quantity: 1,
    });
  };

  // ========================================================================
  // 5. XÓA MÓN KHỎI GIỎ
  // ========================================================================

  const handleRemoveItem = (dishId) => {
    const newItems = items.filter((i) => i.dishId !== dishId);
    setItems(newItems);
  };

  // ========================================================================
  // 6. SUBMIT – GỬI LÊN BE TẠO ORDER
  // ========================================================================

  const handleSubmit = async (values) => {
    if (!items.length) {
      message.warning("Vui lòng thêm ít nhất 1 món");
      return;
    }

    if (!values.tableId) {
      message.warning("Vui lòng chọn bàn");
      return;
    }

    const payload = {
      tableId: values.tableId,
      items: items.map((i) => ({
        dishId: i.dishId,
        quantity: i.quantity,
      })),
    };

    try {
      setSubmitting(true);

      await createOrder(payload);

      message.success("Tạo order thành công");
      navigate("/orders");
    } catch (err) {
      console.error(err);
      //message.error("Không thể tạo order");
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================================
  // 7. CÁC CỘT TABLE HIỂN THỊ GIỎ MÓN
  // ========================================================================

  const columns = [
    {
      title: "Món ăn",
      dataIndex: "dishName",
    },
    {
      title: "SL",
      dataIndex: "quantity",
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Button
          danger
          type="link"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.dishId)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  // ========================================================================
  // 8. RENDER UI
  // ========================================================================

  return (
    <Card title="Tạo Order mới" variant="outlined" style={{ margin: 20 }}>
      <Row gutter={24}>
        <Col span={10}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              quantity: 1,
            }}
            onFinish={handleSubmit}
          >
            {/* ------------------------------------------------------------
                CHỌN BÀN – đã đổi từ tableName → tableId
               ------------------------------------------------------------ */}
            <Form.Item
              label="Chọn bàn"
              name="tableId"
              rules={[{ required: true, message: "Vui lòng chọn bàn" }]}
            >
              <Select
                placeholder="Chọn bàn phục vụ"
                options={tables.map((t) => ({
                  value: t.id,
                  label: `${t.name} (${t.status})`,
                  disabled: t.status === "OCCUPIED" || t.status === "MERGED",
                }))}
              />
            </Form.Item>

            {/* CHỌN MÓN */}
            <Form.Item label="Món ăn" name="dishId">
              <Select
                placeholder="Chọn món"
                options={dishes.map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
                loading={loadingDishes}
                allowClear
              />
            </Form.Item>

            {/* SỐ LƯỢNG */}
            <Form.Item label="Số lượng" name="quantity">
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>

            {/* NÚT THÊM MÓN */}
            <Form.Item>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                style={{ width: "100%" }}
              >
                Thêm món vào giỏ
              </Button>
            </Form.Item>

            {/* NÚT TẠO ORDER */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ width: "100%" }}
              >
                Tạo order
              </Button>
            </Form.Item>
          </Form>
        </Col>

        {/* BẢNG GIỎ MÓN */}
        <Col span={14}>
          <Table
            title={() => "Danh sách món"}
            rowKey="dishId"
            dataSource={items}
            columns={columns}
            pagination={false}
            variant="borderless"
          />
        </Col>
      </Row>
    </Card>
  );
}
