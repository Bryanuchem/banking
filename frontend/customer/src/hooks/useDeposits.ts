import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authorizeDepositPayment, completeCashAppDepositApproval, createDeposit, getConfiguredProviders, getDeposit, getDeposits, initializeDepositPayment, verifyDepositPayment } from "@/api/deposits";
import { dashboardQueryKeys } from "@/hooks/useDashboard";
import type { PaymentProviderName } from "@/types/deposits";
export const depositQueryKeys={all:["deposits"] as const,detail:(id:string)=>["deposits","detail",id] as const,providers:["payment-providers"] as const};
export function useDeposits(){return useQuery({queryKey:depositQueryKeys.all,queryFn:()=>getDeposits(),staleTime:10000});}
export function useDeposit(id:string|null){return useQuery({queryKey:depositQueryKeys.detail(id??""),queryFn:()=>getDeposit(id!),enabled:Boolean(id),retry:false});}
export function useConfiguredProviders(){return useQuery({queryKey:depositQueryKeys.providers,queryFn:getConfiguredProviders,staleTime:60000,retry:false});}
export function useCreateDeposit(){const c=useQueryClient();return useMutation({mutationFn:({amount,idempotencyKey}:{amount:string;idempotencyKey:string})=>createDeposit(amount,idempotencyKey),onSuccess:()=>c.invalidateQueries({queryKey:depositQueryKeys.all})});}
export function useInitializeDepositPayment(){return useMutation({mutationFn:({depositId,provider,stepUpAuthorization}:{depositId:string;provider:PaymentProviderName;stepUpAuthorization?:string})=>initializeDepositPayment(depositId,provider,stepUpAuthorization)});}
export function useAuthorizeDepositPayment(){return useMutation({mutationFn:authorizeDepositPayment});}
export function useVerifyDepositPayment(){const c=useQueryClient();return useMutation({mutationFn:verifyDepositPayment,onSuccess:async()=>{await Promise.all([c.invalidateQueries({queryKey:depositQueryKeys.all}),c.invalidateQueries({queryKey:dashboardQueryKeys.account}),c.invalidateQueries({queryKey:dashboardQueryKeys.recentActivity}),c.invalidateQueries({queryKey:["payments"]}),c.invalidateQueries({queryKey:["transactions"]})]);}});}
export function useCompleteCashAppDepositApproval(){const c=useQueryClient();return useMutation({mutationFn:({paymentId,grantId}:{paymentId:string;grantId:string})=>completeCashAppDepositApproval(paymentId,grantId),onSuccess:async()=>{await Promise.all([c.invalidateQueries({queryKey:depositQueryKeys.all}),c.invalidateQueries({queryKey:dashboardQueryKeys.account}),c.invalidateQueries({queryKey:["payments"]}),c.invalidateQueries({queryKey:["transactions"]})]);}});}
