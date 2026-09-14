import axios from "axios";

import { getAccessToken } from "@/utils/storage";

const localApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8000/api/v1";

const cloudflareApiBaseUrl =
  import.meta.env.VITE_CLOUDFLARE_URL?.trim();

const isCloudflarePreview =
  typeof window !== "undefined" &&
  window.location.hostname.endsWith(
    ".trycloudflare.com",
  );

export const apiClient = axios.create({
  baseURL:
    isCloudflarePreview &&
    cloudflareApiBaseUrl
      ? cloudflareApiBaseUrl
      : localApiBaseUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
