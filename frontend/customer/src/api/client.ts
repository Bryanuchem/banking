import axios from "axios";

import {
  clearAccessToken,
  getAccessToken,
} from "@/utils/storage";

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:8000/api/v1",
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error.config?.url ?? "");
    const isTwoFactorVerification =
      url.includes("/auth/2fa/authorize") ||
      url.includes("/auth/login/2fa");

    if (
      error.response?.status === 401 &&
      !isTwoFactorVerification
    ) {
      clearAccessToken();
    }

    return Promise.reject(error);
  },
);
