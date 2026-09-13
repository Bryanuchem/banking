import { apiClient } from "@/api/client";
export async function getProfile(){return (await apiClient.get("/auth/me")).data;}
