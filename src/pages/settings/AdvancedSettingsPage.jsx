// src/pages/settings/AdvancedSettingsPage.jsx
// ---------------------------------------------------------------------
// AdvancedSettingsPage – Màn hình cấu hình hệ thống nâng cao (Module 20)
// ---------------------------------------------------------------------
// Chức năng:
//  - Gọi API /api/settings để load toàn bộ cấu hình từ BE
//  - Hiển thị cấu hình theo 5 tab: Thông tin nhà hàng, Hóa đơn & Thuế,
//    Loyalty, POS, Giảm giá & Báo cáo.
//  - Cho phép chỉnh sửa từng nhóm cấu hình và lưu lại (PUT /api/settings)
//  - Áp dụng Rule 26 (data type) + Rule 27 (UI/UX) + Rule 29 (variant)
//
// Kỹ thuật:
//  - Dùng Ant Design: Tabs, Form, Input, InputNumber, Switch, Select, Button, Card
//  - Sử dụng 1 Form chung, mỗi Tab sử dụng một nhóm field khác nhau
//  - Khi bấm "Lưu [TAB]" → chỉ gửi các settingKey thuộc tab đó lên BE
// ---------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import {
  Tabs,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  Card,
  Space,
  Spin,
  message,
  Typography,
} from "antd";
import {
  fetchAllSettings,
  updateSettings,
} from "../../api/settingApi";

const { Title, Text } = Typography;

// Danh sách key theo từng tab để dễ map & gửi payload
const TAB_KEYS = {
  RESTAURANT: [
    "restaurant.name",
    "restaurant.address",
    "restaurant.phone",
    "restaurant.tax_id",
  ],
  INVOICE: ["vat.rate",
    "invoice.print_layout", // 🔵 thêm key layout in hóa đơn
  ],
  LOYALTY: [
    "loyalty.enabled",
    "loyalty.earn_rate",
    "loyalty.redeem_rate",
    "loyalty.min_redeem_point",
  ],
  POS: [
    "pos.auto_send_kitchen",
    "pos.allow_cancel_item",
    "pos.allow_edit_after_send",
    "pos.refresh_interval_sec",
  ],
  DISCOUNT_REPORT: [
    "discount.default_percent",
    "discount.max_percent",
    "discount.allow_with_voucher",
    "discount.use_default",
    "report.default_export",
    "report.pdf_footer",
    "report.pdf_show_logo",
  ],
};

// Các lựa chọn định dạng export report
const REPORT_EXPORT_OPTIONS = [
  { label: "PDF", value: "PDF" },
  { label: "Excel", value: "EXCEL" },
];

const AdvancedSettingsPage = () => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState([]); // danh sách system_setting từ BE
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Hàm convert list setting từ BE → object cho Form initialValues
   * -------------------------------------------------------------
   * - STRING  → giữ nguyên string
   * - NUMBER  → convert sang number (dùng parseFloat)
   * - BOOLEAN → convert sang boolean
   */
  const mapSettingsToFormValues = (list) => {
    const values = {};
    list.forEach((item) => {
      const { settingKey, settingValue, valueType } = item;

      if (!settingKey) return;

      if (valueType === "NUMBER") {
        const num = settingValue !== null ? Number(settingValue) : undefined;
        values[settingKey] = Number.isNaN(num) ? undefined : num;
      } else if (valueType === "BOOLEAN") {
        // BE lưu là "true"/"false" → FE convert sang boolean
        values[settingKey] = settingValue?.toLowerCase() === "true";
      } else {
        // STRING / JSON: giữ nguyên string
        values[settingKey] = settingValue ?? "";
      }
    });
    return values;
  };

  /**
   * Load dữ liệu cấu hình từ BE khi mở trang.
   */
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchAllSettings();
      const data = res.data || [];

      setSettings(data);

      // Map dữ liệu vào form
      const formValues = mapSettingsToFormValues(data);
      form.setFieldsValue(formValues);
    } catch (error) {
      console.error("Lỗi load cấu hình hệ thống:", error);
      message.error("Không tải được cấu hình hệ thống, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Lấy ra danh sách SystemSetting theo settingKey (để lấy valueType)
   * Dùng useMemo để tránh tính lại nhiều lần.
   */
  const settingMapByKey = useMemo(() => {
    const map = {};
    settings.forEach((s) => {
      map[s.settingKey] = s;
    });
    return map;
  }, [settings]);

  /**
   * Hàm build payload gửi lên BE khi lưu 1 nhóm setting.
   * ---------------------------------------------------
   * - groupKeys: danh sách settingKey của tab
   * - values: toàn bộ values của form hiện tại
   */
  const buildUpdatePayload = (groupKeys, values) => {
    const payload = [];

    groupKeys.forEach((key) => {
      if (!(key in values)) return;

      let raw = values[key];

      // Convert boolean → string "true"/"false"
      if (typeof raw === "boolean") {
        raw = raw ? "true" : "false";
      }

      // Convert number → string
      if (typeof raw === "number") {
        raw = String(raw);
      }

      // Cho null/undefined → empty string để tránh null pointer ở BE
      if (raw === null || raw === undefined) {
        raw = "";
      }

      payload.push({
        settingKey: key,
        settingValue: raw,
      });
    });

    return payload;
  };

  /**
   * Hàm xử lý lưu cấu hình cho 1 tab.
   * --------------------------------
   * - tab: key của TAB_KEYS (RESTAURANT, INVOICE...)
   */
  const handleSaveTab = async (tabKey) => {
    try {
      const groupKeys = TAB_KEYS[tabKey];
      if (!groupKeys || groupKeys.length === 0) return;

      // Lấy toàn bộ value hiện tại từ form
      const values = await form.validateFields();

      const payload = buildUpdatePayload(groupKeys, values);
      if (payload.length === 0) {
        message.warning("Không có dữ liệu thay đổi để lưu.");
        return;
      }

      setSaving(true);
      await updateSettings(payload);
      message.success("Lưu cấu hình thành công.");

      // Reload lại setting để đồng bộ với BE (updatedAt, valueType...)
      await loadSettings();
    } catch (error) {
      console.error("Lỗi lưu cấu hình:", error);
      // Nếu BE trả message chi tiết, có thể lấy error.response.data.message
      message.error("Lưu cấu hình thất bại, vui lòng kiểm tra lại.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Render nút lưu cho từng tab.
   * ----------------------------
   * - Đặt bên dưới nhóm field, rõ ràng từng khu vực.
   */
  const renderSaveButton = (tabKey) => (
    <div style={{ marginTop: 16 }}>
      <Button
        type="primary"
        onClick={() => handleSaveTab(tabKey)}
        loading={saving}
      >
        Lưu cấu hình
      </Button>
    </div>
  );

  return (
    <Card
      // Rule 29: dùng variant thay vì bordered
      variant="bordered"
      style={{ width: "100%" }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Title level={4}>Cấu hình hệ thống nâng cao</Title>
          <Text type="secondary">
            Tại đây bạn có thể thay đổi các tham số hoạt động của hệ thống
            (tên nhà hàng, VAT, Loyalty, POS, giảm giá, báo cáo...). Mỗi tab
            tương ứng với một nhóm cấu hình riêng.
          </Text>
        </div>

        {loading ? (
          // Loading toàn trang khi đang fetch dữ liệu
          <div
            style={{
              width: "100%",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spin tip="Đang tải cấu hình..." />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            // Không dùng initialValues ở đây vì đã setFieldsValue sau khi load
          >
            <Tabs
              defaultActiveKey="RESTAURANT"
              items={[
                {
                  key: "RESTAURANT",
                  label: "Thông tin nhà hàng",
                  children: (
                    <>
                      <Form.Item
                        label="Tên nhà hàng"
                        name="restaurant.name"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập tên nhà hàng.",
                          },
                        ]}
                      >
                        <Input placeholder="Nhập tên nhà hàng" />
                      </Form.Item>

                      <Form.Item
                        label="Địa chỉ nhà hàng"
                        name="restaurant.address"
                      >
                        <Input placeholder="Nhập địa chỉ nhà hàng" />
                      </Form.Item>

                      <Form.Item
                        label="Số điện thoại liên hệ"
                        name="restaurant.phone"
                      >
                        <Input placeholder="Nhập số điện thoại" />
                      </Form.Item>

                      <Form.Item
                        label="Mã số thuế"
                        name="restaurant.tax_id"
                      >
                        <Input placeholder="Nhập mã số thuế (nếu có)" />
                      </Form.Item>

                      {renderSaveButton("RESTAURANT")}
                    </>
                  ),
                },
                {
                  key: "INVOICE",
                  label: "Hóa đơn & Thuế",
                  children: (
                    <>
                      {/* ================================================================== */}
                      {/*  CẤU HÌNH VAT                                                    */}
                      {/* ================================================================== */}
                      <Form.Item
                        label="Thuế VAT mặc định (%)"
                        name="vat.rate"
                        tooltip="Thuế VAT áp dụng cho hóa đơn. Ví dụ: 10 = 10%."
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          step={0.5}
                          style={{ width: "100%" }}
                          placeholder="Nhập % VAT"
                        />
                      </Form.Item>
                      {/* ================================================================== */}
                      {/*  🔵 CẤU HÌNH LAYOUT IN HÓA ĐƠN (A5 / THERMAL)                      */}
                      {/* ================================================================== */}
                      {/* 
                        - Liên kết với key invoice.print_layout trong bảng system_setting
                        - FE hiển thị dạng Select để chọn layout in hóa đơn
                        - BE đọc giá trị này dùng trong Export PDF Factory
                        - Giá trị hợp lệ:
                            + "A5"        → hóa đơn A5 dọc
                            + "THERMAL"   → hóa đơn giấy nhiệt 80mm
                      */}
                      <Form.Item
                        label="Layout in hóa đơn"
                        name="invoice.print_layout"
                        tooltip="Chọn kiểu in hóa đơn: A5 (quán lớn) hoặc giấy nhiệt 80mm."
                        rules={[
                          { required: true, message: "Vui lòng chọn layout in hóa đơn." },
                        ]}
                      >
                        <Select
                          placeholder="Chọn layout in"
                          options={[
                            { label: "A5 – Khổ A5 dọc", value: "A5" },
                            { label: "Thermal – Giấy nhiệt 80mm", value: "THERMAL" },
                          ]}
                        />
                      </Form.Item>
                      {renderSaveButton("INVOICE")}
                    </>
                  ),
                },
                {
                  key: "LOYALTY",
                  label: "Loyalty (Tích điểm)",
                  children: (
                    <>
                      <Form.Item
                        label="Bật tính năng Loyalty"
                        name="loyalty.enabled"
                        valuePropName="checked"
                        tooltip="Nếu bật, hệ thống sẽ tích điểm và cho phép khách dùng điểm."
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item
                        label="Tỷ lệ tích điểm (điểm trên mỗi 1.000đ)"
                        name="loyalty.earn_rate"
                        tooltip="Ví dụ: nhập 1 nghĩa là cứ mỗi 1.000đ sẽ được 1 điểm."
                      >
                        <InputNumber
                          min={0}
                          step={0.1}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Tỷ lệ quy đổi điểm (giá trị tiền trên 1 điểm)"
                        name="loyalty.redeem_rate"
                        tooltip="Ví dụ: nhập 1000 nghĩa là 1 điểm đổi được 1.000đ."
                      >
                        <InputNumber
                          min={0}
                          step={100}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Điểm tối thiểu để được redeem"
                        name="loyalty.min_redeem_point"
                      >
                        <InputNumber
                          min={0}
                          step={1}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      {renderSaveButton("LOYALTY")}
                    </>
                  ),
                },
                {
                  key: "POS",
                  label: "Cấu hình POS",
                  children: (
                    <>
                      <Form.Item
                        label="Tự động gửi order xuống bếp"
                        name="pos.auto_send_kitchen"
                        valuePropName="checked"
                        tooltip="Nếu bật: sau khi tạo order, hệ thống sẽ tự gửi món xuống bếp."
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item
                        label="Cho phép hủy món sau khi order"
                        name="pos.allow_cancel_item"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item
                        label="Cho phép sửa số lượng món sau khi gửi bếp"
                        name="pos.allow_edit_after_send"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item
                        label="Thời gian refresh POS (giây)"
                        name="pos.refresh_interval_sec"
                        tooltip="Khoảng thời gian tự động reload dữ liệu trên màn hình POS."
                      >
                        <InputNumber
                          min={0}
                          max={300}
                          step={5}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      {renderSaveButton("POS")}
                    </>
                  ),
                },
                {
                  key: "DISCOUNT_REPORT",
                  label: "Giảm giá & Báo cáo",
                  children: (
                    <>
                      <Form.Item
                        label="Giảm giá mặc định (%)"
                        name="discount.default_percent"
                        tooltip="Áp dụng nếu không dùng voucher. Để 0 nếu không giảm."
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          step={0.5}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Giảm giá tối đa cho 1 hóa đơn (%)"
                        name="discount.max_percent"
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          step={0.5}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Cho phép dùng giảm giá mặc định cùng voucher"
                        name="discount.allow_with_voucher"
                        valuePropName="checked"
                        tooltip="Nếu tắt, hệ thống sẽ không áp dụng giảm giá mặc định cho bất kỳ hóa đơn nào."
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item
                        label="Bật giảm giá mặc định"
                        name="discount.use_default"
                        valuePropName="checked"
                        tooltip="Tắt mục này nếu muốn vô hiệu hóa hoàn toàn giảm giá mặc định."
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item
                        label="Định dạng export báo cáo mặc định"
                        name="report.default_export"
                      >
                        <Select
                          options={REPORT_EXPORT_OPTIONS}
                          placeholder="Chọn định dạng export mặc định"
                          allowClear
                        />
                      </Form.Item>

                      <Form.Item
                        label="Footer mặc định cho file PDF"
                        name="report.pdf_footer"
                      >
                        <Input.TextArea
                          autoSize={{ minRows: 2, maxRows: 4 }}
                          placeholder="Ví dụ: Cảm ơn Quý khách đã sử dụng dịch vụ!"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Hiển thị logo trên báo cáo PDF"
                        name="report.pdf_show_logo"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      {renderSaveButton("DISCOUNT_REPORT")}
                    </>
                  ),
                },
              ]}
            />
          </Form>
        )}
      </Space>
    </Card>
  );
};

export default AdvancedSettingsPage;
