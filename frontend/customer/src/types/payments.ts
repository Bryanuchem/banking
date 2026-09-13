import type { PaymentProviderName } from "@/types/deposits";
export type PaymentPurpose = "deposit" | "withdrawal_fee" | "payment";
export type PaymentHistoryItem = { id:string; reference:string; amount:string; currency:string; status:string; provider:PaymentProviderName; channel?:string|null; provider_channel?:string|null; purpose:PaymentPurpose; deposit_id?:string|null; withdrawal_id?:string|null; paid_at?:string|null; created_at:string };
export type PaymentFilters = { purpose?: ""|"deposit"|"withdrawal_fee"; provider?: ""|PaymentProviderName; status?:string };
