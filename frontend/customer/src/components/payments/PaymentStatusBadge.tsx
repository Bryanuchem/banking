import StatusBadge from "@/components/common/StatusBadge";
import { paymentStatusLabel, paymentTone } from "@/utils/payment";
export default function PaymentStatusBadge({status}:{status:string}){return <StatusBadge tone={paymentTone(status)} className="justify-center text-center">{paymentStatusLabel(status)}</StatusBadge>;}
