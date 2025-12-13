// src/pages/member/MemberPage.jsx
// --------------------------------------------------------------
// Trang DANH SÁCH HỘI VIÊN
// - Search theo tên / SĐT
// - Tạo mới
// - Chỉnh sửa
// --------------------------------------------------------------

import { useEffect, useState } from "react";
import { Card, Button, Table, Input, Space, message, Tag } from "antd";
import {
    saveMember, 
    getAllMembers, 
    searchMembers,
    disableMember,
    restoreMember,
    } from "../../api/memberApi";
import MemberFormModal from "./MemberFormModal";

export default function MemberPage() {
    const [search, setSearch] = useState("");
    const [list, setList] = useState([]);

    const [loading, setLoading] = useState(false);

    // Modal form
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    // ----------------------------------------------------------
    // phoneArg: nếu truyền vào thì dùng phoneArg, nếu không → dùng state search
    // ----------------------------------------------------------
    // Tìm hội viên theo keyword (LIKE)
    // ----------------------------------------------------------
    const handleSearch = async (keywordArg) => {
        const keyword = (keywordArg ?? search).trim();

        if (!keyword) {
            // Gọi API lấy toàn bộ member
            const res = await getAllMembers();
            setList(res);
            return;
        }

        try {
            setLoading(true);

            // 🟢 Dùng API search LIST
            const res = await searchMembers(keyword);

            setList(res);
            setSearch(keyword);
        } catch (err) {
            setList([]);
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------------
    // Submit form tạo/sửa hội viên
    // ----------------------------------------------------------
    const handleSave = async (data) => {
    try {
        await saveMember(data);
        message.success("Lưu hội viên thành công");

        // Sau khi lưu:
        //  - Nếu có SĐT → search lại đúng SĐT đó để hiển thị member mới
        //  - Không phụ thuộc vào state search (tránh bị giá trị cũ)
        if (data.phone) {
        await handleSearch(data.phone);
        }

        setModalOpen(false);
        setEditing(null);
    } catch (err) {
        message.error("Lưu hội viên thất bại");
    }
    };

        // ----------------------------------------------------------
    // Vô hiệu hóa hội viên
    // ----------------------------------------------------------
    const handleDisable = async (id) => {
      try {
        await disableMember(id);
        message.success("Đã vô hiệu hoá hội viên");

        // Reload lại list theo trạng thái hiện tại:
        //  - Nếu đang search theo SĐT → gọi lại handleSearch
        //  - Nếu không search → loadAll()
        if (search.trim()) {
          await handleSearch(search);
        } else {
          const res = await getAllMembers();
          setList(res);
        }
      } catch (err) {
        console.error(err);
        message.error("Lỗi khi vô hiệu hoá hội viên");
      }
    };

    // ----------------------------------------------------------
    // Khôi phục hội viên
    // ----------------------------------------------------------
    const handleRestore = async (id) => {
      try {
        await restoreMember(id);
        message.success("Đã khôi phục hội viên");

        if (search.trim()) {
          await handleSearch(search);
        } else {
          const res = await getAllMembers();
          setList(res);
        }
      } catch (err) {
        console.error(err);
        message.error("Lỗi khi khôi phục hội viên");
      }
    };

    const columns = [
        {
        title: "Tên",
        dataIndex: "name",
        },
        {
        title: "SĐT",
        dataIndex: "phone",
        },
        {
        title: "Hạng",
        dataIndex: "tier",
        },
        {
        title: "Tổng điểm",
        dataIndex: "totalPoint",
        },
        {
        title: "Trạng thái",
        dataIndex: "active",
        render: (value) =>
            value ? (
            <Tag color="green">Đang hoạt động</Tag>
            ) : (
            <Tag color="red">Đã vô hiệu hoá</Tag>
            ),
        },
        {
        title: "Action",
        render: (_, record) => (
            <Space>
            <Button
                type="link"
                onClick={() => {
                setEditing(record);
                setModalOpen(true);
                }}
            >
                Sửa
            </Button>

            {record.active ? (
                <Button
                danger
                type="link"
                onClick={() => handleDisable(record.id)}
                >
                Vô hiệu hoá
                </Button>
            ) : (
                <Button
                type="link"
                onClick={() => handleRestore(record.id)}
                >
                Khôi phục
                </Button>
            )}
            </Space>
        ),
        },
    ];

    // ----------------------------------------------------------
    // Tải toàn bộ danh sách hội viên khi mở trang
    // ----------------------------------------------------------
    useEffect(() => {
    const loadAll = async () => {
        try {
        setLoading(true);
        const res = await getAllMembers();
        setList(res);
        } catch (err) {
        console.error(err);
        message.error("Không tải được danh sách hội viên");
        } finally {
        setLoading(false);
        }
    };

    loadAll();
    }, []);

    // ----------------------------------------------------------
    // Tìm realtime khi nhập >= 3 ký tự
    // ----------------------------------------------------------
    useEffect(() => {
        if (search.trim().length >= 3) {
            handleSearch(search);
        }
    }, [search]);

  return (
    <Card title="Quản lý hội viên" style={{ minHeight: "80vh" }}>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Nhập số điện thoại"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 200 }}
        />

        <Button type="primary" onClick={() => handleSearch()}>
          Tìm
        </Button>

        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          Thêm hội viên
        </Button>
      </Space>

      <Table
        loading={loading}
        dataSource={list}
        columns={columns}
        rowKey="id"
        pagination={false}
      />

      {/* Modal form */}
      <MemberFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
        initial={editing}
      />
    </Card>
  );
}
