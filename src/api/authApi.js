// authApi.js – gọi API auth cho FE

import api from "./axiosConfig";

export const login = async (data) => {
  const res = await api.post("/api/auth/login", data);
  return res.data;
};

export const registerUser = async (data) => {
  const res = await api.post("/api/auth/register", data);
  return res.data;
};

export const logout = async (username) => {
  const res = await api.delete(`/api/auth/logout/${username}`);
  return res.data;
};
