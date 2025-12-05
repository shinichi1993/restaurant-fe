// src/components/role/RoleFormModal.jsx
// --------------------------------------------------------------
// Modal Form dùng chung cho:
//  - Thêm mới vai trò
//  - Chỉnh sửa vai trò
// Chức năng chính:
//  - Nhập name, code, description
//  - Chọn danh sách permission (checkbox theo nhóm prefix)
//  - Nâng cấp:
//      + Tìm kiếm quyền trong modal
//      + Chọn tất cả quyền
//      + Bỏ chọn tất cả
//      + Chọn toàn bộ quyền trong 1 nhóm (CATEGORY, USER...)
//      + Collapse nhóm quyền cho gọn
//      + Validate tránh trùng mã vai trò (code) trên FE
// --------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Checkbox,
  Spin,
  Divider,
  Typography,
  Collapse,
  Space,
} from "antd";
import { getPermissions } from "../../api/permissionApi";

const { Text } = Typography;
const { Panel } = Collapse;

export default function RoleFormModal({
  open,
  onClose,
  onSubmit,
  initialValues, // { id?, name, code, description, permissionIds? / permissions? }
  existingRoles = [], // Danh sách role hiện có để check trùng code
}) {
  const [form] = Form.useForm();
  const [loadingPerm, setLoadingPerm] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  // ⭐ State quản lý danh sách quyền đang chọn
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // ----------------------------------------------------------
  // LOAD DANH SÁCH PERMISSION
  // ----------------------------------------------------------
  const loadPermissions = async () => {
    try {
      setLoadingPerm(true);
      const data = await getPermissions();
      setPermissions(data || []);
    } catch (err) {
      console.error("Lỗi load permission", err);
    } finally {
      setLoadingPerm(false);
    }
  };

  // ----------------------------------------------------------
  // Khi mở modal, set giá trị form + permission
  // ----------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    loadPermissions();
    setSearchKeyword("");

    if (initialValues) {
      // Lấy danh sách permissionIds từ DTO
      const permissionIds =
        initialValues.permissionIds ??
        initialValues.permissions?.map((p) => p.id) ??
        [];

      // Set form field
      form.setFieldsValue({
        name: initialValues.name,
        code: initialValues.code,
        description: initialValues.description,
      });

      // Set state quyền đang chọn
      setSelectedPermissions(permissionIds);
    } else {
      form.resetFields();
      setSelectedPermissions([]);
    }
  }, [open, initialValues, form]);

  // ----------------------------------------------------------
  // GROUP PERMISSION THEO PREFIX CODE (CATEGORY_VIEW -> CATEGORY)
  // ----------------------------------------------------------
  const groupedPermissions = useMemo(() => {
    const groups = {};

    (permissions || []).forEach((p) => {
      const prefix = p.code?.split("_")[0] || "OTHER";
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(p);
    });

    return Object.entries(groups)
      .map(([groupKey, perms]) => ({ groupKey, perms }))
      .sort((a, b) => a.groupKey.localeCompare(b.groupKey));
  }, [permissions]);

  // ----------------------------------------------------------
  // LỌC THEO TỪ KHÓA TÌM KIẾM
  // ----------------------------------------------------------
  const visibleGroups = useMemo(() => {
    if (!searchKeyword) return groupedPermissions;

    const kw = searchKeyword.toLowerCase();

    return groupedPermissions
      .map((g) => {
        const filteredPerms = g.perms.filter((p) => {
          const code = (p.code || "").toLowerCase();
          const name = (p.name || "").toLowerCase();
          return code.includes(kw) || name.includes(kw);
        });
        return { ...g, perms: filteredPerms };
      })
      .filter((g) => g.perms.length > 0);
  }, [groupedPermissions, searchKeyword]);

  // ----------------------------------------------------------
  // TIỆN ÍCH XỬ LÝ CHECKBOX
  // ----------------------------------------------------------

  // Chọn TẤT CẢ quyền
  const handleSelectAll = () => {
    const allIds = permissions.map((p) => p.id);
    setSelectedPermissions(allIds);
  };

  // Bỏ chọn TẤT CẢ quyền
  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  // Chọn / bỏ chọn 1 nhóm (CATEGORY, USER...)
  const toggleGroup = (groupPermIds, checked) => {
    const current = new Set(selectedPermissions);

    if (checked) {
      groupPermIds.forEach((id) => current.add(id));
    } else {
      groupPermIds.forEach((id) => current.delete(id));
    }

    setSelectedPermissions(Array.from(current));
  };

  // Khi click từng checkbox trong group
  const handleChangeCheckboxGroup = (groupIds, checkedList) => {
    setSelectedPermissions(prev => {
        const set = new Set(prev);

        // Bỏ hết quyền của nhóm hiện tại
        groupIds.forEach(id => set.delete(id));

        // Thêm lại các quyền được check trong nhóm
        checkedList.forEach(id => set.add(id));

        return Array.from(set);
    });
    };

  // ----------------------------------------------------------
  // SUBMIT FORM
  // ----------------------------------------------------------
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const payload = {
          name: values.name?.trim(),
          code: values.code?.trim().toUpperCase(),
          description: values.description?.trim(),
          permissionIds: selectedPermissions || [],
        };
        onSubmit(payload);
      })
      .catch(() => {
        // validate fail – không làm gì
      });
  };

  return (
    <Modal
      open={open}
      title={initialValues ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
      onCancel={onClose}
      onOk={handleOk}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        {/* Tên vai trò */}
        <Form.Item
          label="Tên vai trò"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên vai trò" }]}
        >
          <Input placeholder="VD: Quản trị hệ thống" />
        </Form.Item>

        {/* Mã vai trò + validate trùng code */}
        <Form.Item
          label="Mã vai trò"
          name="code"
          rules={[
            { required: true, message: "Vui lòng nhập mã vai trò" },
            {
              pattern: /^[A-Z0-9_]+$/,
              message: "Chỉ cho phép chữ IN HOA, số và dấu gạch dưới",
            },
            () => ({
              // Validate trùng mã trên FE
              validator(_, value) {
                if (!value) return Promise.resolve();

                const currentId = initialValues?.id;
                const codeNorm = value.trim().toUpperCase();

                const duplicated = (existingRoles || []).some((r) => {
                  const roleCode = (r.code || "").toUpperCase();
                  if (currentId && r.id === currentId) return false; // chính nó
                  return roleCode === codeNorm;
                });

                if (duplicated) {
                  return Promise.reject(
                    new Error("Mã vai trò đã tồn tại, vui lòng chọn mã khác")
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Input placeholder="VD: ADMIN, MANAGER, STAFF" />
        </Form.Item>

        {/* Mô tả */}
        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn về vai trò" />
        </Form.Item>

        {/* PHÂN QUYỀN CHI TIẾT */}
        <Divider orientation="left">
          <Text strong>Phân quyền chi tiết</Text>
        </Divider>

        {loadingPerm ? (
          <Spin tip="Đang tải danh sách quyền..." />
        ) : (
          // Form.Item này chỉ để hiển thị label / layout, không bind value
          <Form.Item>
            <div
              style={{
                maxHeight: 360,
                overflowY: "auto",
                border: "1px solid #f0f0f0",
                padding: 12,
                borderRadius: 4,
              }}
            >
              {/* Thanh công cụ: search + chọn/bỏ tất cả */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <Input
                  allowClear
                  placeholder="Tìm theo mã / tên quyền..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{ maxWidth: 260 }}
                />
                <Space>
                  <a onClick={handleSelectAll}>Chọn tất cả</a>
                  <a onClick={handleClearAll}>Bỏ chọn tất cả</a>
                </Space>
              </div>

              {/* Checkbox.Group được control bằng state selectedPermissions */}
              <Collapse bordered={false}>
                {visibleGroups.map((group) => {
                    const groupIds = group.perms.map((p) => p.id);
                    const allChecked = groupIds.every(id => selectedPermissions.includes(id));
                    const someChecked =
                    !allChecked && groupIds.some(id => selectedPermissions.includes(id));

                    return (
                    <Panel
                        key={group.groupKey}
                        header={
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <Text strong>{group.groupKey}</Text>
                            <Checkbox
                            checked={allChecked}
                            indeterminate={someChecked}
                            onChange={(e) => toggleGroup(groupIds, e.target.checked)}
                            onClick={(e) => e.stopPropagation()} // tránh đóng collapse
                            >
                            <Text type="secondary">Chọn nhóm</Text>
                            </Checkbox>
                        </div>
                        }
                    >
                        {/* ❗ Checkbox.Group CHỈ nên wrap các checkbox con trong nhóm */}
                        <Checkbox.Group
                            value={selectedPermissions.filter(id => groupIds.includes(id))}
                            onChange={(checkedList) => handleChangeCheckboxGroup(groupIds, checkedList)}
                            style={{ width: "100%" }}
                        >
                        {group.perms.map((p) => (
                            <Checkbox key={p.id} value={p.id} style={{ display: "block" }}>
                            <Text code>{p.code}</Text> {p.name}
                            </Checkbox>
                        ))}
                        </Checkbox.Group>
                    </Panel>
                    );
                })}
              </Collapse>
            </div>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}