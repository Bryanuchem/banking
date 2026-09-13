import { apiClient } from "@/api/client";
export async function getTransactions(){return (await apiClient.get("/transactions")).data;}
