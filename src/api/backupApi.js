// backupApi.js – Phase 4.4 Backup/Restore
// ------------------------------------------------------------
// Toàn bộ API phục vụ màn Admin Backup/Restore
// Comment tiếng Việt theo Rule 13
// ------------------------------------------------------------
import api from "./axiosConfig";

/**
 * Export file backup (ZIP)
 */
export async function exportBackupZip() {
  const res = await api.post("/api/admin/backup/export", null, {
    responseType: "blob",
  });
  return res.data;
}

/**
 * Restore từ file backup (ZIP)
 * - confirm bắt buộc true
 */
export async function restoreBackupZip(file, confirm) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/api/admin/backup/restore", formData, {
    params: { confirm },
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
