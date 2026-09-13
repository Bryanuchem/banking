import axios from "axios";
import type { PaymentProviderName } from "@/types/deposits";
import type { PaymentHistoryItem, PaymentPurpose } from "@/types/payments";
export function providerLabel(p:PaymentProviderName){return p==="paystack"?"Paystack":p==="stripe"?"Stripe":p==="paypal"?"PayPal":"Cash App";}
export function purposeLabel(p:PaymentPurpose){return p==="deposit"?"Account deposit":p==="withdrawal_fee"?"Withdrawal fee":"Payment";}
export function paymentStatusLabel(s:string){return s==="paid"?"Completed":s==="initialized"||s==="pending"?"Pending":s==="failed"?"Failed":s==="refunded"?"Refunded":s.replaceAll("_"," ").replace(/\b\w/g,v=>v.toUpperCase());}
export function paymentTone(s:string):"neutral"|"info"|"success"|"warning"|"danger"{return s==="paid"?"success":s==="failed"?"danger":s==="pending"||s==="initialized"?"warning":"neutral";}
export function paymentError(error:unknown):string{if(axios.isAxiosError(error)){const d=error.response?.data?.detail;if(typeof d==="string"&&d.trim())return d;if(!error.response)return "We couldn't reach the service. Check your connection and try again.";}return "We couldn't complete that request. Please try again.";}
export function stepUpRequired(error:unknown):boolean{if(!axios.isAxiosError(error)||error.response?.status!==401)return false;const d=error.response?.data?.detail;if(typeof d==="string")return d.toLowerCase().includes("two-factor");if(d&&typeof d==="object"&&"code" in d)return String((d as {code?:unknown}).code).toLowerCase()==="step_up_required";return false;}
export function relatedRoute(p:PaymentHistoryItem):string|null{return p.purpose==="withdrawal_fee"&&p.withdrawal_id?"/withdraw":p.purpose==="deposit"&&p.deposit_id?"/deposit":null;}
