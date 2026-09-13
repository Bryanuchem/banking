import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/common";
import RecipientCard from "@/components/transfers/RecipientCard";
import type { AccountLookup, TransferDraft } from "@/types/transfers";
import { formatCurrency } from "@/utils/formatCurrency";

export default function TransferReview({ draft, recipient, currency, submitting, onBack, onConfirm }:{
  draft: TransferDraft; recipient: AccountLookup; currency:string; submitting:boolean; onBack:()=>void; onConfirm:()=>void;
}) {
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium" style={{color:"var(--muted)"}}>
        <ArrowLeft size={17}/> Back
      </button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{color:"var(--text)"}}>Review transfer</h1>
        <p className="mt-1 text-sm" style={{color:"var(--muted)"}}>Confirm the details before money moves.</p>
      </div>
      <div className="rounded-[var(--radius-card)] border p-5 sm:p-6" style={{background:"var(--surface)",borderColor:"var(--border)",boxShadow:"var(--shadow-card)"}}>
        <p className="text-xs" style={{color:"var(--muted)"}}>You send</p>
        <p className="mt-1 text-3xl font-semibold" style={{color:"var(--text)"}}>{formatCurrency(draft.amount,currency)}</p>
        <div className="mt-5"><p className="mb-2 text-xs" style={{color:"var(--muted)"}}>To</p><RecipientCard recipient={recipient}/></div>
        {draft.narration ? <div className="mt-5"><p className="text-xs" style={{color:"var(--muted)"}}>Note</p><p className="mt-1 text-sm" style={{color:"var(--text)"}}>{draft.narration}</p></div>:null}
        <dl className="mt-6 space-y-3 border-t pt-5" style={{borderColor:"var(--border)"}}>
          <div className="flex justify-between text-sm"><dt style={{color:"var(--muted)"}}>Amount</dt><dd style={{color:"var(--text)"}}>{formatCurrency(draft.amount,currency)}</dd></div>
          <div className="flex justify-between text-sm font-semibold"><dt style={{color:"var(--text)"}}>Total</dt><dd style={{color:"var(--text)"}}>{formatCurrency(draft.amount,currency)}</dd></div>
        </dl>
        <div className="mt-6 grid gap-2"><Button className="w-full" loading={submitting} loadingText="Sending…" onClick={onConfirm}>Confirm transfer</Button><Button className="w-full" variant="ghost" disabled={submitting} onClick={onBack}>Cancel</Button></div>
      </div>
    </div>
  );
}
