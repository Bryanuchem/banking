import { apiClient } from "@/api/client";
import type { Deposit, DepositCheckout, DepositPaymentStatus, PaymentProviderName } from "@/types/deposits";
export async function createDeposit(amount:string,idempotencyKey:string):Promise<Deposit>{const {data}=await apiClient.post<Deposit>("/deposits",{amount},{headers:{"Idempotency-Key":idempotencyKey}});return data;}
export async function getDeposits(limit=50,offset=0):Promise<Deposit[]>{const {data}=await apiClient.get<Deposit[]>("/deposits",{params:{limit,offset}});return data;}
export async function getDeposit(id:string):Promise<Deposit>{const {data}=await apiClient.get<Deposit>(`/deposits/${id}`);return data;}
export async function getConfiguredProviders():Promise<PaymentProviderName[]>{const {data}=await apiClient.get<PaymentProviderName[]>("/payments/providers");return data;}
export async function initializeDepositPayment(id:string,provider:PaymentProviderName,stepUpAuthorization?:string):Promise<DepositCheckout>{const {data}=await apiClient.post<DepositCheckout>(`/deposits/${id}/payment`,null,{params:{provider},headers:stepUpAuthorization?{"X-Step-Up-Authorization":stepUpAuthorization}:undefined});return data;}
export async function verifyDepositPayment(reference:string):Promise<DepositPaymentStatus>{const {data}=await apiClient.get<DepositPaymentStatus>(`/payments/${encodeURIComponent(reference)}/verify`);return data;}
export async function completeCashAppDepositApproval(paymentId:string,grantId:string):Promise<DepositPaymentStatus>{const {data}=await apiClient.post<DepositPaymentStatus>(`/payments/${paymentId}/client-approval`,{grant_id:grantId});return data;}
export async function authorizeDepositPayment(code:string):Promise<{authorization_token:string;scope:string}>{const {data}=await apiClient.post("/auth/2fa/authorize",{code,scope:"payment:create"});return data;}
