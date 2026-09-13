import { apiClient } from "@/api/client";
import type { PaymentFilters, PaymentHistoryItem } from "@/types/payments";
export async function getPayments(filters:PaymentFilters={},limit=50,offset=0):Promise<PaymentHistoryItem[]>{const params={limit,offset,...(filters.purpose?{purpose:filters.purpose}:{}),...(filters.provider?{provider:filters.provider}:{}),...(filters.status?{status:filters.status}:{})};const {data}=await apiClient.get<PaymentHistoryItem[]>("/payments",{params});return data;}
export async function getPayment(id:string):Promise<PaymentHistoryItem>{const {data}=await apiClient.get<PaymentHistoryItem>(`/payments/${id}`);return data;}
