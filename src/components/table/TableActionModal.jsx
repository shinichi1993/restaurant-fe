// TableActionModal.jsx – Modal thao tác nâng cao cho Bàn (Module 16)
// ---------------------------------------------------------------------------
// Mục đích:
//  - Hiển thị thông tin chi tiết của 1 bàn
//  - Cho phép thực hiện các tác vụ nâng cao:
//        + Tạo Order từ bàn này (nếu bàn đang trống – AVAILABLE)
//        + Xem Order đang phục vụ (nếu bàn đang OCCUPIED)
//        + Gộp bàn (Merge)
//        + Chuyển bàn (Change)
//        + Tách bàn (Split)
//  - Tất cả action đều gọi API từ tableApi.js
//
// Props nhận vào:
//  - open: boolean – mở/đóng modal
//  - onClose(): đóng modal
//  - table: object – bàn đang chọn
//  - tables: danh sách toàn bộ bàn (để chọn merge/change)
//  - reloadTables(): reload lại danh sách bàn cha (TablePage)
//  - navigateOrder(orderId): hàm mở trang Order chi tiết
//
// ---------------------------------------------------------------------------
// Quy tắc dự án:
//  - Comment tiếng Việt 100% (Rule 13)
//  - UI dùng Ant Design theo Rule 27 + variant rule 29
//  - Không xử lý logic phức tạp trong JSX – tách ra các hàm handler
// ---------------------------------------------------------------------------
import React, { useState, useEffect } from "react";

import {
  Modal,
  Button,
  Space,
  Select,
  message,
  Divider,
  Tag,
} from "antd";

import {
  mergeTable,
  changeTable,
  splitTable,
} from "../../api/tableApi";

export default function TableActionModal({
  open,
  onClose,
  table,
  tables,
  reloadTables,
  navigateOrder,
  createOrderFromTable,
}) {
  if (!table) return null;

  // Trạng thái chọn bàn đích khi merge / change
  const [targetTableId, setTargetTableId] = useState(null);

  // Reset dropdown mỗi lần mở modal
  useEffect(() => {
    setTargetTableId(null);
    }, [open]);

  // --------------------------------------------------------------------
  // HÀM RENDER TAG TRẠNG THÁI
  // --------------------------------------------------------------------
  const renderStatusTag = (st) => {
    if (st === "AVAILABLE") return <Tag color="green">Trống</Tag>;
    if (st === "OCCUPIED") return <Tag color="orange">Đang phục vụ</Tag>;
    if (st === "RESERVED") return <Tag color="red">Đã đặt trước</Tag>;
    if (st === "MERGED") return <Tag color="default">Đã gộp</Tag>;
    return <Tag>{st}</Tag>;
  };

  // --------------------------------------------------------------------
  // HANDLER: GỘP BÀN (MERGE)
  // --------------------------------------------------------------------
  const handleMerge = async () => {
    if (!targetTableId) {
      message.warning("Vui lòng chọn bàn đích để gộp");
      return;
    }
    try {
      await mergeTable({
        sourceTableId: table.id,
        targetTableId: targetTableId,
      });

      message.success("Gộp bàn thành công");
      reloadTables();
      onClose();
    } catch (err) {
      console.error(err);
      //message.error("Không thể gộp bàn");
    }
  };

  // --------------------------------------------------------------------
  // HANDLER: CHUYỂN BÀN (CHANGE TABLE)
  // --------------------------------------------------------------------
  const handleChangeTable = async () => {
    if (!targetTableId) {
      message.warning("Vui lòng chọn bàn mới để chuyển");
      return;
    }
    try {
      await changeTable({
        oldTableId: table.id,
        newTableId: targetTableId,
      });

      message.success("Chuyển bàn thành công");
      reloadTables();
      onClose();
    } catch (err) {
      console.error(err);
      //message.error("Không thể chuyển bàn");
    }
  };

  // --------------------------------------------------------------------
  // HANDLER: TÁCH BÀN (SPLIT)
  // --------------------------------------------------------------------
  const handleSplit = async () => {
    try {
      await splitTable(table.id);
      message.success("Tách bàn thành công");
      reloadTables();
      onClose();
    } catch (err) {
      console.error(err);
      //message.error("Không thể tách bàn");
    }
  };

  // --------------------------------------------------------------------
  // HANDLER: TẠO ORDER TỪ BÀN
  // --------------------------------------------------------------------
  const handleCreateOrder = () => {
    if (createOrderFromTable) {
      createOrderFromTable(table.id);
    }
  };

  // --------------------------------------------------------------------
  // HANDLER: XEM ORDER ĐANG PHỤC VỤ
  // --------------------------------------------------------------------
  const handleOpenOrder = () => {
    if (!table.currentOrderId) {
      message.warning("Bàn này không có order đang mở");
      return;
    }
    if (navigateOrder) {
      navigateOrder(table.currentOrderId);
    }
  };

  // --------------------------------------------------------------------
  // DANH SÁCH BÀN DÙNG ĐỂ CHỌN MERGE / CHANGE
  // Điều kiện:
  //   - Không được chọn chính nó
  //   - Không chọn bàn MERGED
  //   - Merge: bàn đích nên là OCCUPIED hoặc AVAILABLE
  // --------------------------------------------------------------------
  const selectableTables = tables
    ?.filter((t) => t.id !== table.id)
    ?.map((t) => ({
      value: t.id,
      label: `${t.name} (${t.status})`,
      disabled: t.status === "MERGED",
    }));

  // --------------------------------------------------------------------
  // RENDER GIAO DIỆN MODAL
  // --------------------------------------------------------------------
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={`Thao tác bàn – ${table.name}`}
    >
      <p>
        <b>Tên bàn:</b> {table.name}
      </p>

      <p>
        <b>Trạng thái:</b> {renderStatusTag(table.status)}
      </p>

      <p>
        <b>Số ghế:</b> {table.capacity}
      </p>

      {table.mergedRootId && (
        <p>
          <b>Bàn gốc:</b> #{table.mergedRootId}
        </p>
      )}

      <Divider />

      {/* ================================================================
          1) Tạo Order từ bàn
          Điều kiện: bàn phải AVAILABLE
      ================================================================= */}
      {table.status === "AVAILABLE" && (
        <Button
          type="primary"
          block
          onClick={handleCreateOrder}
          style={{ marginBottom: 10 }}
        >
          Tạo Order từ bàn này
        </Button>
      )}

      {/* ================================================================
          2) Xem Order đang phục vụ
          Điều kiện: bàn đang OCCUPIED
      ================================================================= */}
      {table.status === "OCCUPIED" && (
        <Button
          type="primary"
          block
          onClick={handleOpenOrder}
          style={{ marginBottom: 10 }}
        >
          Xem Order đang phục vụ
        </Button>
      )}

      <Divider />

      {/* ================================================================
          3) Chọn bàn đích (dùng cho merge / change)
      ================================================================= */}
      <p><b>Chọn bàn khác:</b></p>
      <Select
        style={{ width: "100%", marginBottom: 10 }}
        placeholder="Chọn bàn khác"
        options={selectableTables}
        value={targetTableId}
        onChange={(v) => setTargetTableId(v)}
      />

      {/* ================================================================
          4) MERGE TABLE – Gộp bàn
          Điều kiện: bàn KHÔNG phải MERGED
      ================================================================= */}
      {table.status !== "MERGED" && (
        <Button
          block
          onClick={handleMerge}
          style={{ marginBottom: 10 }}
        >
          Gộp vào bàn đã chọn
        </Button>
      )}

      {/* ================================================================
          5) CHANGE TABLE – Chuyển bàn
          Điều kiện: bàn phải OCCUPIED (đang có order)
      ================================================================= */}
      {table.status === "OCCUPIED" && (
        <Button
          block
          onClick={handleChangeTable}
          style={{ marginBottom: 10 }}
        >
          Chuyển order sang bàn đã chọn
        </Button>
      )}

      {/* ================================================================
          6) SPLIT TABLE – Tách bàn
          Điều kiện: bàn đang MERGED
      ================================================================= */}
      {table.status === "MERGED" && (
        <Button
          danger
          block
          onClick={handleSplit}
          style={{ marginBottom: 10 }}
        >
          Tách bàn
        </Button>
      )}
    </Modal>
  );
}
