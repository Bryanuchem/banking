import axios from "axios";
import { getAccessToken, clearAccessToken } from "@/utils/storage";
export const apiClient=axios.create({baseURL:import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",timeout:15000});
apiClient.interceptors.request.use((config)=>{const token=getAccessToken(); if(token) config.headers.Authorization=`Bearer ${token}`; return config;});
apiClient.interceptors.response.use((r)=>r,(e)=>{if(e.response?.status===401) clearAccessToken(); return Promise.reject(e);});
