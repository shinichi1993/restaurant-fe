// src/pages/permission/PermissionPage.jsx
// --------------------------------------------------------------
// Màn hình xem danh sách quyền (READ ONLY)
//  - Không cho sửa/xóa để tránh rủi ro
//  - Chỉ hiển thị code, name, description, group
// --------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Card, Table, Tag, message } from "antd";
import { getPermissions } from "../../api/permissionApi";

export default function PermissionPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await getPermissions();
      setPermissions(data || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  // Thêm cột group (prefix của code) cho dễ nhìn
  const dataWithGroup = useMemo(
    () =>
      (permissions || []).map((p) => {
        const code = p.code || "";
        const [prefix] = code.split("_");
        return {
          ...p,
          group: prefix || "OTHER",
        };
      }),
    [permissions]
  );

  const columns = [
    {
      title: "Nhóm",
      dataIndex: "group",
      render: (g) => <Tag>{g}</Tag>,
    },
    {
      title: "Mã quyền",
      dataIndex: "code",
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: "Tên quyền",
      dataIndex: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
    },
  ];

  return (
    <Card
      title="Danh sách quyền (Permission)"
      variant="outlined"
      style={{ margin: 20 }}
    >
      <Table
        rowKey="id"
        dataSource={dataWithGroup}
        columns={columns}
        loading={loading}
        variant="borderless"
      />
    </Card>
  );
}
