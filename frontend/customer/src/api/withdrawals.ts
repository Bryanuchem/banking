import { apiClient } from "@/api/client";
export async function getWithdrawals(){return (await apiClient.get("/withdrawals")).data;}
