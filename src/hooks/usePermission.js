// usePermission.js – Hook check permission từ localStorage
// --------------------------------------------------------
// Mục tiêu:
//  - Tránh đọc localStorage rải rác khắp dự án
//  - Chuẩn hóa check permission cho Menu / Button / Route
// --------------------------------------------------------

export const getPermissionsFromStorage = () => {
  try {
    const raw = localStorage.getItem("permissions");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
};

/**
 * Kiểm tra có 1 permission hay không
 * @param {string} code - VD: USER_VIEW
 */
export const hasPermission = (code) => {
  const perms = getPermissionsFromStorage();
  return perms.includes(code);
};

/**
 * Kiểm tra có ÍT NHẤT 1 permission trong danh sách
 * @param {string[]} codes
 */
export const hasAnyPermission = (codes = []) => {
  const perms = getPermissionsFromStorage();
  return codes.some((c) => perms.includes(c));
};

/**
 * Kiểm tra có TẤT CẢ permission trong danh sách
 * @param {string[]} codes
 */
export const hasAllPermissions = (codes = []) => {
  const perms = getPermissionsFromStorage();
  return codes.every((c) => perms.includes(c));
};
