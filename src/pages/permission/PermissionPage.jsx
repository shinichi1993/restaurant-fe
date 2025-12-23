// src/pages/permission/PermissionPage.jsx
// --------------------------------------------------------------
// Màn hình xem danh sách quyền (READ ONLY)
//  - Không cho sửa/xóa để tránh rủi ro
//  - Chỉ hiển thị code, name, description, group
// --------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Card, Table, Tag, Input, Button } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { getPermissions } from "../../api/permissionApi";
import PageFilterBar from "../../components/common/PageFilterBar";

export default function PermissionPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  // State tìm kiếm (Rule 30)
  const [search, setSearch] = useState("");

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await getPermissions();
      setPermissions(data || []);
    } catch (err) {
      console.error(err);
      //message.error("Không tải được danh sách quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  // Xóa hàm lọc permision
  const clearFilter = () => {
    setSearch("");
  };

  // Thêm cột group (prefix của code) cho dễ nhìn
  const dataWithGroup = useMemo(
      () =>
    (permissions || [])
      .filter((p) => {
        if (!search) return true;
        const keyword = search.toLowerCase();
        return (
          p.code?.toLowerCase().includes(keyword) ||
          p.name?.toLowerCase().includes(keyword)
        );
      })
      .map((p) => {
        const code = p.code || "";
        const [prefix] = code.split("_");
        return {
          ...p,
          group: prefix || "OTHER",
        };
      }),
    [permissions, search]
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
      title={<span style={{ fontSize: 26, fontWeight: 600 }}>Danh sách quyền</span>}
      variant="outlined"
      style={{ margin: 20 }}
    >
      <PageFilterBar
        filters={
          <>
            {/* ================= TÌM THEO CODE / TÊN ================= */}
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm theo mã hoặc tên quyền"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />

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
