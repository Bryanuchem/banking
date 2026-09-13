export type DepositStatus = "awaiting_payment" | "processing" | "completed" | "failed" | string;
export type Deposit = { id:string; amount:string; currency:string; status:DepositStatus; transaction_id:string|null; completed_at:string|null; created_at:string };
export type PaymentProviderName = "paystack" | "stripe" | "paypal" | "cashapp";
export type DepositCheckout = { id:string; reference:string; amount:string; currency:string; status:string; provider:PaymentProviderName; channel?:string|null; provider_channel?:string|null; authorization_url:string; access_code?:string|null; checkout_data:Record<string,unknown>; created_at:string };
export type DepositPaymentStatus = { id:string; reference:string; amount:string; currency:string; status:string; provider:PaymentProviderName; paid_at?:string|null };
