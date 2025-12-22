// src/utils/modeStorage.js
// ======================================================================
// modeStorage – Lưu / đọc Working Mode từ localStorage
// Lưu ý:
//  - Chỉ lưu string thuộc APP_MODE
//  - Dùng để route guard và điều hướng sau login
// ======================================================================

import { APP_MODE } from "../constants/appMode";

const KEY = "WORKING_MODE";

/**
 * Lấy mode hiện tại từ localStorage
 * @returns {string|null}
 */
export const getWorkingMode = () => {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  const values = Object.values(APP_MODE);
  return values.includes(raw) ? raw : null;
};

/**
 * Lưu mode vào localStorage
 * @param {string} mode
 */
export const setWorkingMode = (mode) => {
  localStorage.setItem(KEY, mode);
};

/**
 * Xóa mode (khi logout hoặc muốn reset)
 */
export const clearWorkingMode = () => {
  localStorage.removeItem(KEY);
};
