// BackupRestorePage.jsx – Phase 4.4
// ------------------------------------------------------------
// Trang Admin Backup/Restore Database
// - Export backup ZIP
// - Restore từ file ZIP (có confirm bắt buộc)
// UI theo Rule 27 + Rule 29 (variant thay cho bordered)
// ------------------------------------------------------------
import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Checkbox, Divider, Upload, Typography, message, Space } from "antd";
import { DownloadOutlined, UploadOutlined, WarningOutlined } from "@ant-design/icons";
import { exportBackupZip, restoreBackupZip } from "../../api/backupApi";

const { Title, Text } = Typography;

export default function BackupRestorePage() {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [file, setFile] = useState(null);

  const canRestore = useMemo(() => !!file && confirm && !restoring, [file, confirm, restoring]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await exportBackupZip();

      // Tạo link download trong browser
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_${new Date().toISOString().replaceAll(":", "-")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      message.success("Đã tạo và tải file backup.");
    } catch (e) {
      message.error("Tạo backup thất bại. Vui lòng thử lại.");
    } finally {
      setDownloading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      await restoreBackupZip(file, true);
      message.success("Restore thành công. Vui lòng refresh trang để kiểm tra dữ liệu.");
      // Reset trạng thái sau restore
      setFile(null);
      setConfirm(false);
    } catch (e) {
      message.error("Restore thất bại. Kiểm tra file backup hoặc điều kiện Order NEW/SERVING.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Title level={3} style={{ marginBottom: 8 }}>Backup / Restore Database</Title>
      <Text type="secondary">
        Backup/Restore theo dạng ZIP + JSON. Restore sẽ XÓA TOÀN BỘ dữ liệu hiện tại và ghi đè bằng dữ liệu trong file.
      </Text>

      <Divider />

      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card variant="borderless">
          <Title level={4}>1) Tạo backup</Title>
          <Text>Nhấn nút để tạo file backup và tải về máy.</Text>
          <div style={{ marginTop: 12 }}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={downloading}
              onClick={handleDownload}
            >
              Tạo & Tải Backup
            </Button>
          </div>
        </Card>

        <Card variant="borderless">
          <Title level={4}>2) Restore từ backup</Title>

          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message="Cảnh báo"
            description="Restore sẽ TRUNCATE toàn bộ dữ liệu hiện tại. Hãy chắc chắn bạn đã hiểu và chọn đúng file."
          />

          <div style={{ marginTop: 12 }}>
            <Upload
              beforeUpload={(f) => {
                setFile(f);
                return false; // chặn auto upload, mình tự bấm Restore
              }}
              maxCount={1}
              onRemove={() => setFile(null)}
            >
              <Button icon={<UploadOutlined />}>Chọn file backup (.zip)</Button>
            </Upload>

            <div style={{ marginTop: 12 }}>
              <Checkbox checked={confirm} onChange={(e) => setConfirm(e.target.checked)}>
                Tôi hiểu việc restore sẽ XÓA TOÀN BỘ dữ liệu hiện tại
              </Checkbox>
            </div>

            <div style={{ marginTop: 12 }}>
              <Button
                danger
                type="primary"
                disabled={!canRestore}
                loading={restoring}
                onClick={handleRestore}
              >
                Restore ngay
              </Button>
            </div>
          </div>
        </Card>
      </Space>
    </div>
  );
}
