import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, CopyButton } from "@/components/common";
import { ROUTES } from "@/routes/paths";
import type { TransferResponse } from "@/types/transfers";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDateTime";

export default function TransferReceipt({ transfer, onDone }:{transfer:TransferResponse;onDone:()=>void}) {
 return <div className="mx-auto max-w-md text-center">
  <div className="mx-auto grid size-14 place-items-center rounded-full" style={{color:"var(--success)",background:"color-mix(in srgb, var(--success) 12%, var(--surface))"}}><CheckCircle2 size={28}/></div>
  <h1 className="mt-4 text-2xl font-semibold" style={{color:"var(--text)"}}>Transfer complete</h1>
  <p className="mt-4 text-3xl font-semibold" style={{color:"var(--text)"}}>{formatCurrency(transfer.amount,transfer.currency)}</p>
  <p className="mt-1 text-sm" style={{color:"var(--muted)"}}>sent to {transfer.recipient_name}</p>
  <div className="mt-6 rounded-[var(--radius-card)] border p-4 text-left" style={{background:"var(--surface)",borderColor:"var(--border)"}}>
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs" style={{color:"var(--muted)"}}>Reference</p><p className="mt-1 break-all text-sm font-medium" style={{color:"var(--text)"}}>{transfer.reference}</p></div><CopyButton value={transfer.reference} successMessage="Transfer reference copied."/></div>
    <div className="mt-4 border-t pt-4" style={{borderColor:"var(--border)"}}><p className="text-xs" style={{color:"var(--muted)"}}>Date</p><p className="mt-1 text-sm" style={{color:"var(--text)"}}>{formatDateTime(transfer.created_at)}</p></div>
  </div>
  <div className="mt-6 grid gap-2"><Button className="w-full" onClick={onDone}>Done</Button><Link to={`${ROUTES.activity}?transaction=${transfer.id}`} className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border px-4 text-sm font-medium" style={{color:"var(--text)",background:"var(--surface)",borderColor:"var(--border)"}}>View transaction</Link></div>
 </div>;
}
