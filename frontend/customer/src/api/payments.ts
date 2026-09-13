import { apiClient } from "@/api/client";
export async function getPayments(){return (await apiClient.get("/payments")).data;}
