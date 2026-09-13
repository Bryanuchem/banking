import { useQuery } from "@tanstack/react-query";
import { getPayment, getPayments } from "@/api/payments";
import type { PaymentFilters } from "@/types/payments";
export function usePayments(filters:PaymentFilters={}){return useQuery({queryKey:["payments",filters],queryFn:()=>getPayments(filters),staleTime:10000});}
export function usePaymentDetail(id:string|null){return useQuery({queryKey:["payments","detail",id??""],queryFn:()=>getPayment(id!),enabled:Boolean(id),retry:false});}
