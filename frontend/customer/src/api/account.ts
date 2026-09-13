import { apiClient } from "@/api/client";
export async function getAccount(){return (await apiClient.get("/account")).data;}
