import { apiClient } from "@/api/client";
export async function lookupAccount(accountNumber:string){return (await apiClient.get(`/accounts/lookup/${accountNumber}`)).data;}
export async function createTransfer(payload:Record<string,unknown>,idempotencyKey:string){
  return (await apiClient.post("/transfers",payload,{headers:{"Idempotency-Key":idempotencyKey}})).data;
}
