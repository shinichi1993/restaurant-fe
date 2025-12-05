import axiosInstance from "./axiosConfig";

/**
 * Wrapper API dùng chung cho toàn hệ thống
 * FE chỉ gọi get/post/put/delete từ file này.
 */

// GET
export const apiGet = (url, params = {}) => {
  return axiosInstance.get(url, { params });
};

// POST
export const apiPost = (url, data = {}) => {
  return axiosInstance.post(url, data);
};

// PUT
export const apiPut = (url, data = {}) => {
  return axiosInstance.put(url, data);
};

// DELETE
export const apiDelete = (url) => {
  return axiosInstance.delete(url);
};
