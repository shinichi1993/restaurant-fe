// src/pages/settings/AdvancedSettingsPage.jsx
// ---------------------------------------------------------------------
// AdvancedSettingsPage – Màn hình cấu hình hệ thống nâng cao (Module 20)
// ---------------------------------------------------------------------
// Refactor mục tiêu:
//  - Render động 100% theo metadata BE trả về (KHÔNG hard-code key)
//  - Thêm key mới trong DB → FE tự hiển thị
//  - Lưu theo từng tab (group) → chỉ gửi các key thuộc group đó
//  - Hỗ trợ dependency hiển thị (dependsOnKey/dependsOnValue)
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

// Lựa chọn mẫu cho các setting kiểu SELECT (mở rộng dần theo key)
// Lưu ý: Đây là optional. Nếu chưa có options thì fallback INPUT/STRING.
const SELECT_OPTIONS_BY_KEY = {
  "invoice.print_layout": [
    { label: "A5 – Khổ A5 dọc", value: "A5" },
    { label: "Thermal – Giấy nhiệt 80mm", value: "THERMAL" },
  ],
  "report.default_export": [
    { label: "PDF", value: "PDF" },
    { label: "Excel", value: "EXCEL" },
  ],
};

function toFormValue(item) {
  const { settingValue, valueType } = item;

  if (valueType === "NUMBER") {
    const num = settingValue !== null ? Number(settingValue) : undefined;
    return Number.isNaN(num) ? undefined : num;
  }
  if (valueType === "BOOLEAN") {
    return String(settingValue ?? "").trim().toLowerCase() === "true";
  }
  return settingValue ?? "";
}

function toRawString(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (value === null || value === undefined) return "";
  return String(value);
}

const AdvancedSettingsPage = () => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchAllSettings();
      const data = res.data || [];
      setSettings(data);

      const values = {};
      data.forEach((item) => {
        if (!item?.settingKey) return;
        values[item.settingKey] = toFormValue(item);
      });
      form.setFieldsValue(values);
    } catch (e) {
      console.error("Lỗi load cấu hình hệ thống:", e);
      // message.error("Không tải được cấu hình hệ thống, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group settings theo settingGroup để sinh Tabs
  const grouped = useMemo(() => {
    const map = {};
    settings.forEach((s) => {
      const group = s.settingGroup || "OTHER";
      if (!map[group]) map[group] = [];
      map[group].push(s);
    });

    // Sort trong từng group theo orderIndex rồi fallback key
    Object.keys(map).forEach((g) => {
      map[g].sort((a, b) => {
        const oa = a.orderIndex ?? 0;
        const ob = b.orderIndex ?? 0;
        if (oa !== ob) return oa - ob;
        const ka = a.settingKey || "";
        const kb = b.settingKey || "";
        return ka.localeCompare(kb);
      });
    });

    return map;
  }, [settings]);

  const buildPayloadByGroup = (groupKey, values) => {
    const list = grouped[groupKey] || [];
    const payload = [];

    list.forEach((s) => {
      const key = s.settingKey;
      if (!key) return;

      // Nếu editable = false thì bỏ qua (không gửi)
      if (s.editable === false) return;

      // Chỉ gửi những field tồn tại trong form
      if (!(key in values)) return;

      payload.push({
        settingKey: key,
        settingValue: toRawString(values[key]),
      });
    });

    return payload;
  };

  const handleSaveGroup = async (groupKey) => {
    try {
      const values = await form.validateFields();
      const payload = buildPayloadByGroup(groupKey, values);

      if (!payload.length) {
        message.warning("Không có dữ liệu thay đổi để lưu.");
        return;
      }

      setSaving(true);
      await updateSettings(payload);
      message.success("Lưu cấu hình thành công.");
      await loadSettings();
    } catch (e) {
      console.error("Lỗi lưu cấu hình:", e);
      // message.error("Lưu cấu hình thất bại, vui lòng kiểm tra lại.");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (s) => {
    const key = s.settingKey;

    // Nếu BE định nghĩa kiểu SELECT theo inputType hoặc theo key mapping
    const selectOptions = SELECT_OPTIONS_BY_KEY[key];

    if (s.inputType === "SELECT" || selectOptions) {
      return (
        <Select
          placeholder="Chọn giá trị"
          options={selectOptions || []}
          allowClear
          disabled={s.editable === false}
        />
      );
    }

    if (s.inputType === "SWITCH" || s.valueType === "BOOLEAN") {
      return <Switch disabled={s.editable === false} />;
    }

    if (s.inputType === "NUMBER" || s.valueType === "NUMBER") {
      return (
        <InputNumber
          min={s.minValue ?? undefined}
          max={s.maxValue ?? undefined}
          style={{ width: "100%" }}
          disabled={s.editable === false}
        />
      );
    }

    // Mặc định INPUT
    return <Input placeholder={s.settingKey} disabled={s.editable === false} />;
  };

  const renderSettingItem = (s) => {
    const key = s.settingKey;

    // Nếu setting phụ thuộc key khác → render có điều kiện bằng shouldUpdate
    if (s.dependsOnKey) {
      return (
        <Form.Item
          key={key}
          noStyle
          shouldUpdate={(prev, cur) => prev?.[s.dependsOnKey] !== cur?.[s.dependsOnKey]}
        >
          {() => {
            const depValue = form.getFieldValue(s.dependsOnKey);

            // Chuẩn hóa so sánh: boolean/number/string
            const expectedRaw = String(s.dependsOnValue ?? "").trim().toLowerCase();
            const currentRaw = String(depValue ?? "").trim().toLowerCase();

            // Ví dụ depends_on_value = "true" thì depValue phải true
            const ok = currentRaw === expectedRaw;

            if (!ok) return null;

            return (
              <Form.Item
                label={s.label || s.settingKey}
                name={s.settingKey}
                tooltip={s.description || undefined}
                valuePropName={s.valueType === "BOOLEAN" || s.inputType === "SWITCH" ? "checked" : "value"}
              >
                {renderInput(s)}
              </Form.Item>
            );
          }}
        </Form.Item>
      );
    }

    return (
      <Form.Item
        key={key}
        label={s.label || s.settingKey}
        name={s.settingKey}
        tooltip={s.description || undefined}
        valuePropName={s.valueType === "BOOLEAN" || s.inputType === "SWITCH" ? "checked" : "value"}
      >
        {renderInput(s)}
      </Form.Item>
    );
  };

  const tabItems = useMemo(() => {
    const groups = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    return groups.map((g) => {
      const firstItem = grouped[g]?.[0];
      const tabLabel =
        firstItem?.settingGroupLabel || g; // fallback an toàn

      return {
        key: g,
        label: tabLabel, // ✅ dùng label tiếng Việt
        children: (
          <>
            {(grouped[g] || []).map((s) => renderSettingItem(s))}
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                variant="solid"
                onClick={() => handleSaveGroup(g)}
                loading={saving}
              >
                Lưu cấu hình
              </Button>
            </div>
          </>
        ),
      };
    });
  }, [grouped, saving]);

  return (
    <Card variant="bordered" style={{ width: "100%" }}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Title level={6}>Cấu hình hệ thống nâng cao</Title>
          <Text type="secondary">
            Các cấu hình được render động theo dữ liệu từ hệ thống. Thêm key mới trong DB → tự hiển thị.
          </Text>
        </div>

        {loading ? (
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
          <Form form={form} layout="vertical">
            <Tabs defaultActiveKey={tabItems?.[0]?.key || "OTHER"} items={tabItems} />
          </Form>
        )}
      </Space>
    </Card>
  );
};

export default AdvancedSettingsPage;
