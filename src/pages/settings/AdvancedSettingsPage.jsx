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
//  - Khi bấm "Lưu cấu hình" ở từng tab → chỉ gửi các settingKey thuộc tab đó
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
import { fetchAllSettings, updateSettings } from "../../api/settingApi";

const { Title, Text } = Typography;

// =====================================================================
// 1. KHAI BÁO DANH SÁCH KEY THEO TỪNG TAB
// ---------------------------------------------------------------------
//  - Mục đích: khi lưu từng tab, FE sẽ chỉ build payload từ group key đó.
//  - Lưu ý: phải đồng bộ với các key trong bảng system_setting bên BE.
// =====================================================================
const TAB_KEYS = {
  RESTAURANT: [
    "restaurant.name",
    "restaurant.address",
    "restaurant.phone",
    "restaurant.tax_id",
  ],
  INVOICE: [
    "vat.rate",
    "invoice.print_layout", // Layout in hóa đơn (A5 / THERMAL)
  ],
  LOYALTY: [
    "loyalty.enabled",
    "loyalty.earn_rate",

    "loyalty.redeem.enabled",
    "loyalty.redeem.rate",
    "loyalty.redeem.max_percent",
  ],
  POS: [
    "pos.auto_send_kitchen",                // Tự động gửi order xuống bếp
    "pos.allow_cancel_item",               // Cho phép hủy món sau khi order
    "pos.allow_edit_after_send",           // Cho phép sửa số lượng món sau khi gửi bếp
    "pos.refresh_interval_sec",            // Thời gian auto refresh POS (giây)
    "pos.auto_order_serving_on_item_cooking", // 🔵 Tự động chuyển order → SERVING khi món bắt đầu COOKING
    "pos.simple_pos_mode",                     // 🔵 Bật chế độ POS đơn giản (Simple POS)
    "pos.simple_pos_require_table",            // 🔵 Trong Simple POS: bắt buộc chọn bàn hay không
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

  // --------------------------------------------------------------
  // 2. MAP DỮ LIỆU TỪ BE → FORM
  // --------------------------------------------------------------
  /**
   * Hàm convert list setting từ BE → object values cho Form
   * -------------------------------------------------------
   * - STRING  → giữ nguyên string
   * - NUMBER  → convert sang number (Number(settingValue))
   * - BOOLEAN → convert "true"/"false" → boolean
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
        values[settingKey] = settingValue?.toLowerCase() === "true";
      } else {
        // STRING / JSON
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
      //message.error("Không tải được cấu hình hệ thống, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------------------
  // 3. MAP SYSTEM_SETTING → MAP BY KEY ĐỂ TRA CỨU valueType (nếu cần)
  // --------------------------------------------------------------
  const settingMapByKey = useMemo(() => {
    const map = {};
    settings.forEach((s) => {
      map[s.settingKey] = s;
    });
    return map;
  }, [settings]);

  // --------------------------------------------------------------
  // 4. BUILD PAYLOAD CẬP NHẬT SETTING CHO MỖI TAB
  // --------------------------------------------------------------
  /**
   * Hàm build payload gửi lên BE khi lưu 1 nhóm setting.
   * ---------------------------------------------------
   * - groupKeys: danh sách settingKey của tab
   * - values: toàn bộ values hiện tại của form
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
   * - tabKey: key trong TAB_KEYS (RESTAURANT, INVOICE, POS...)
   */
  const handleSaveTab = async (tabKey) => {
    try {
      const groupKeys = TAB_KEYS[tabKey];
      if (!groupKeys || groupKeys.length === 0) return;

      // Lấy toàn bộ value hiện tại từ form (kèm validate)
      const values = await form.validateFields();

      const payload = buildUpdatePayload(groupKeys, values);
      if (payload.length === 0) {
        message.warning("Không có dữ liệu thay đổi để lưu.");
        return;
      }

      setSaving(true);
      await updateSettings(payload);
      message.success("Lưu cấu hình thành công.");

      // Reload lại settings để đồng bộ với BE
      await loadSettings();
    } catch (error) {
      console.error("Lỗi lưu cấu hình:", error);
      //message.error("Lưu cấu hình thất bại, vui lòng kiểm tra lại.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Render nút lưu cho từng tab (dùng chung cho tất cả).
   */
  const renderSaveButton = (tabKey) => (
    <div style={{ marginTop: 16 }}>
      <Button
        type="primary"
        variant="solid" // Rule 29 – dùng variant, tránh bordered cũ
        onClick={() => handleSaveTab(tabKey)}
        loading={saving}
      >
        Lưu cấu hình
      </Button>
    </div>
  );

  // -----------------------------------------------------------------
  // 5. DÙNG useWatch ĐỂ THEO DÕI TRẠNG THÁI SIMPLE POS MODE
  // -----------------------------------------------------------------
  //  - Mục đích: nếu "pos.simple_pos_mode" = false → ẩn field con
  //    "pos.simple_pos_require_table".
  //  - Khi bật Simple POS Mode → hiển thị thêm config con.
  // -----------------------------------------------------------------
  const simplePosMode = Form.useWatch("pos.simple_pos_mode", form);

  return (
    <Card
      // Rule 29: dùng variant thay cho bordered
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
            // Không dùng initialValues trực tiếp vì đã setFieldsValue sau khi load
          >
            <Tabs
              defaultActiveKey="RESTAURANT"
              items={[
                // ======================================================
                // TAB 1: THÔNG TIN NHÀ HÀNG
                // ======================================================
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

                      <Form.Item label="Mã số thuế" name="restaurant.tax_id">
                        <Input placeholder="Nhập mã số thuế (nếu có)" />
                      </Form.Item>

                      {renderSaveButton("RESTAURANT")}
                    </>
                  ),
                },

                // ======================================================
                // TAB 2: HÓA ĐƠN & THUẾ
                // ======================================================
                {
                  key: "INVOICE",
                  label: "Hóa đơn & Thuế",
                  children: (
                    <>
                      {/* CẤU HÌNH VAT MẶC ĐỊNH */}
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

                      {/* CẤU HÌNH LAYOUT IN HÓA ĐƠN (A5 / THERMAL) */}
                      {/*
                        - Liên kết với key invoice.print_layout trong bảng system_setting
                        - BE dùng giá trị này để chọn factory export PDF tương ứng
                        - Giá trị hợp lệ:
                            + "A5"      → hóa đơn A5 dọc
                            + "THERMAL" → hóa đơn giấy nhiệt 80mm
                      */}
                      <Form.Item
                        label="Layout in hóa đơn"
                        name="invoice.print_layout"
                        tooltip="Chọn kiểu in hóa đơn: A5 (quán lớn) hoặc giấy nhiệt 80mm."
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng chọn layout in hóa đơn.",
                          },
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

                // ======================================================
                // TAB 3: LOYALTY
                //  - loyalty.enabled
                //  - loyalty.earn_rate
                //  - loyalty.redeem.enabled
                //  - loyalty.redeem.rate
                //  - loyalty.redeem.max_percent
                // ======================================================
                {
                  key: "LOYALTY",
                  label: "Loyalty (Tích điểm)",
                  children: (
                    <>
                      {/* ================================================== */}
                      {/* 1. BẬT / TẮT TÍNH NĂNG LOYALTY */}
                      {/* ================================================== */}
                      <Form.Item
                        label="Bật tính năng Loyalty"
                        name="loyalty.enabled"
                        valuePropName="checked"
                        tooltip="Nếu bật, hệ thống sẽ tích điểm và cho phép khách dùng điểm."
                      >
                        <Switch />
                      </Form.Item>

                      {/* ================================================== */}
                      {/* 2. TỶ LỆ TÍCH ĐIỂM */}
                      {/* ================================================== */}
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

                      {/* ================================================== */}
                      {/* 3. BẬT / TẮT DÙNG ĐIỂM (REDEEM) */}
                      {/* ================================================== */}
                      <Form.Item
                        label="Bật dùng điểm (Redeem)"
                        name="loyalty.redeem.enabled"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      {/* ================================================== */}
                      {/* 4. GIÁ TRỊ QUY ĐỔI ĐIỂM → TIỀN */}
                      {/* ================================================== */}
                      <Form.Item
                        label="Giá trị tiền cho 1 điểm (VNĐ)"
                        name="loyalty.redeem.rate"
                        tooltip="Ví dụ: 1000 = 1 điểm đổi 1.000đ"
                      >
                        <InputNumber min={0} step={100} style={{ width: "100%" }} />
                      </Form.Item>

                      {/* ================================================== */}
                      {/* 5. GIỚI HẠN TỐI ĐA ĐƯỢC REDEEM */}
                      {/* ================================================== */}
                      <Form.Item
                        label="Tỷ lệ tối đa được redeem (%)"
                        name="loyalty.redeem.max_percent"
                        tooltip="Ví dụ: 50 = tối đa dùng điểm cho 50% hóa đơn"
                      >
                        <InputNumber min={0} max={100} step={5} style={{ width: "100%" }} />
                      </Form.Item>

                      {/* ================================================== */}
                      {/* NÚT LƯU CẤU HÌNH LOYALTY */}
                      {/* ================================================== */}
                      {renderSaveButton("LOYALTY")}
                    </>
                  ),
                },

                // ======================================================
                // TAB 4: CẤU HÌNH POS
                // ======================================================
                {
                  key: "POS",
                  label: "Cấu hình POS",
                  children: (
                    <>
                      {/* 1. TỰ ĐỘNG GỬI ORDER XUỐNG BẾP */}
                      <Form.Item
                        label="Tự động gửi order xuống bếp"
                        name="pos.auto_send_kitchen"
                        valuePropName="checked"
                        tooltip="Nếu bật: sau khi tạo order, hệ thống sẽ tự chuyển món sang trạng thái 'Đã gửi bếp'."
                      >
                        <Switch />
                      </Form.Item>

                      {/* 2. CHO PHÉP HỦY MÓN SAU KHI ORDER */}
                      <Form.Item
                        label="Cho phép hủy món sau khi order"
                        name="pos.allow_cancel_item"
                        valuePropName="checked"
                        tooltip="Nếu tắt: nhân viên sẽ không thể hủy món (BE cũng sẽ chặn)."
                      >
                        <Switch />
                      </Form.Item>

                      {/* 3. CHO PHÉP SỬA SỐ LƯỢNG SAU KHI GỬI BẾP */}
                      <Form.Item
                        label="Cho phép sửa số lượng món sau khi gửi bếp"
                        name="pos.allow_edit_after_send"
                        valuePropName="checked"
                        tooltip="Nếu bật: có thể chỉnh sửa/giảm số lượng cả khi món đã ở trạng thái 'Đã gửi bếp'. Nếu tắt: chỉ cho gọi thêm, không được giảm."
                      >
                        <Switch />
                      </Form.Item>

                      {/* 4. THỜI GIAN AUTO REFRESH POS */}
                      <Form.Item
                        label="Thời gian refresh POS (giây)"
                        name="pos.refresh_interval_sec"
                        tooltip="Khoảng thời gian tự động reload dữ liệu trên màn hình POS Table. 0 = tắt auto refresh."
                      >
                        <InputNumber
                          min={0}
                          max={300}
                          step={5}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      {/* 5. AUTO ORDER → SERVING KHI MÓN BẮT ĐẦU COOKING */}
                      <Form.Item
                        label="Tự chuyển order sang SERVING khi có món bắt đầu COOKING"
                        name="pos.auto_order_serving_on_item_cooking"
                        valuePropName="checked"
                        tooltip="Nếu bật: khi bất kỳ món nào trong order chuyển sang trạng thái 'Đang nấu' (COOKING), hệ thống sẽ tự chuyển trạng thái order từ NEW → SERVING (dùng chủ yếu cho KitchenPage)."
                      >
                        <Switch />
                      </Form.Item>

                      {/* 6. SIMPLE POS MODE – CHẾ ĐỘ POS ĐƠN GIẢN */}
                      <Form.Item
                        label="Kích hoạt chế độ POS đơn giản (Simple POS Mode)"
                        name="pos.simple_pos_mode"
                        valuePropName="checked"
                        tooltip="Chế độ dành cho quán nhỏ/takeaway: luồng thao tác tối giản, nhân viên bếp có thể vừa order vừa thanh toán nhanh."
                      >
                        <Switch />
                      </Form.Item>

                      {/* 6.1. SIMPLE POS – CÓ BẮT BUỘC CHỌN BÀN HAY KHÔNG */}
                      {simplePosMode && (
                        <Form.Item
                          label="Trong Simple POS: bắt buộc chọn bàn khi order"
                          name="pos.simple_pos_require_table"
                          valuePropName="checked"
                          tooltip="Nếu bật: khi ở Simple POS Mode, nhân viên luôn phải chọn bàn trước khi order. Nếu tắt: có thể order không gắn bàn (phù hợp take-away)."
                        >
                          <Switch />
                        </Form.Item>
                      )}

                      {renderSaveButton("POS")}
                    </>
                  ),
                },

                // ======================================================
                // TAB 5: GIẢM GIÁ & BÁO CÁO
                // ======================================================
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
                        tooltip="Nếu tắt, hệ thống sẽ không áp dụng giảm giá mặc định khi hóa đơn đã dùng voucher."
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
