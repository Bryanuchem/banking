import { ArrowUpDown, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getAdminTransaction, getAdminTransactions } from "@/api/admin";
import Drawer from "@/components/common/Drawer";
import Pagination from "@/components/common/Pagination";
import ExportCsvButton from "@/components/common/ExportCsvButton";
import StatusBadge from "@/components/common/StatusBadge";
import FinancialEmptyState from "@/components/financial/FinancialEmptyState";
import { DetailRow, FilterSelect, LedgerTable, RefValue, SearchBox } from "@/components/financial/FinancialTableParts";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatCurrency, formatDateTime } from "@/utils/format";

const LIMIT = 20;

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const q = useDebouncedValue(search.trim(), 350);

  useEffect(() => setOffset(0), [q, status, type]);

  const listQ = useQuery({
    queryKey: ["admin", "transactions", q, status, type, offset],
    queryFn: () => getAdminTransactions({ q: q || undefined, status: status || undefined, tx_type: type || undefined, limit: LIMIT, offset }),
  });
  const detailQ = useQuery({
    queryKey: ["admin", "transaction", selectedId],
    queryFn: () => getAdminTransaction(selectedId!),
    enabled: Boolean(selectedId),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]" style={{ color: "var(--text)" }}>Transactions</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Search and inspect the platform transaction ledger.</p>
        </div>
        <ExportCsvButton resource="transactions" params={{ q: q || undefined, status: status || undefined, tx_type: type || undefined }} />
      </header>

      <section className="overflow-hidden rounded-[var(--radius-card)] border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex flex-col gap-3 p-4 xl:flex-row">
          <SearchBox value={search} onChange={setSearch} placeholder="Search reference, customer, account or description" />
          <FilterSelect value={type} onChange={setType} ariaLabel="Transaction type">
            <option value="">All types</option><option value="transfer">Transfer</option><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option><option value="admin_credit">Admin credit</option><option value="adjustment">Adjustment</option><option value="payment_fee">Payment fee</option>
          </FilterSelect>
          <FilterSelect value={status} onChange={setStatus} ariaLabel="Transaction status">
            <option value="">All statuses</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="reversed">Reversed</option>
          </FilterSelect>
        </div>

        {listQ.isLoading ? <div className="border-t p-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Loading transactions...</div> : listQ.isError ? <div className="border-t p-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--danger)" }}>Transactions could not be loaded.</div> : listQ.data?.items.length ? <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead style={{ background: "var(--surface-alt)" }}><tr>{['Reference','Type','Customer','Account','Amount','Status','Date',''].map((h)=><th key={h} className="border-y px-4 py-3 text-xs font-semibold" style={{ color:"var(--muted)", borderColor:"var(--border)" }}>{h}</th>)}</tr></thead>
              <tbody>{listQ.data.items.map((item)=><tr key={item.id} className="border-b last:border-b-0" style={{ borderColor:"var(--border)" }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color:"var(--text)" }}>{item.reference}</td>
                <td className="px-4 py-3 capitalize" style={{ color:"var(--text)" }}>{item.type.replaceAll('_',' ')}</td>
                <td className="px-4 py-3"><div style={{ color:"var(--text)" }}>{item.customer?.name ?? '—'}</div><div className="text-xs" style={{ color:"var(--muted)" }}>{item.customer?.email ?? ''}</div></td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color:"var(--muted)" }}>{item.account?.account_number ?? '—'}</td>
                <td className="px-4 py-3 font-semibold" style={{ color:item.type === 'deposit' || item.type === 'admin_credit' ? 'var(--success)' : 'var(--text)' }}>{formatCurrency(item.amount,item.currency)}</td>
                <td className="px-4 py-3"><StatusBadge label={item.status} tone={item.status==='completed'?'success':item.status==='failed'?'danger':'warning'} /></td>
                <td className="px-4 py-3 text-xs" style={{ color:"var(--muted)" }}>{formatDateTime(item.created_at)}</td>
                <td className="px-4 py-3 text-right"><button className="rounded-lg border px-3 py-2 text-xs font-semibold" style={{ color:"var(--brand-accent)", borderColor:"var(--border)" }} onClick={()=>setSelectedId(item.id)}>View</button></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="grid gap-3 border-t p-4 lg:hidden" style={{ borderColor:"var(--border)" }}>{listQ.data.items.map((item)=><button key={item.id} type="button" className="rounded-xl border p-4 text-left" style={{ borderColor:"var(--border)" }} onClick={()=>setSelectedId(item.id)}><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs" style={{ color:"var(--muted)" }}>{item.reference}</p><p className="mt-1 font-medium capitalize" style={{ color:"var(--text)" }}>{item.type.replaceAll('_',' ')}</p></div><ArrowUpDown size={18} style={{ color:"var(--muted)" }} /></div><div className="mt-3 flex items-center justify-between"><strong style={{ color:"var(--text)" }}>{formatCurrency(item.amount,item.currency)}</strong><StatusBadge label={item.status} tone={item.status==='completed'?'success':item.status==='failed'?'danger':'warning'} /></div></button>)}</div>
          <Pagination total={listQ.data.page.total} limit={LIMIT} offset={offset} onOffsetChange={setOffset} />
        </> : <FinancialEmptyState title="No transactions found" description="Adjust the search or filters." />}
      </section>

      <Drawer open={Boolean(selectedId)} title="Transaction detail" onClose={()=>setSelectedId(null)}>
        {detailQ.isLoading ? <div className="p-6 text-sm" style={{ color:"var(--muted)" }}>Loading transaction...</div> : detailQ.data ? <div className="space-y-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><RefValue value={detailQ.data.reference} /><StatusBadge label={detailQ.data.status} tone={detailQ.data.status==='completed'?'success':detailQ.data.status==='failed'?'danger':'warning'} /></div><p className="mt-2 text-sm capitalize" style={{ color:"var(--muted)" }}>{detailQ.data.type.replaceAll('_',' ')}</p></div><strong className="text-xl" style={{ color:detailQ.data.type==='deposit'||detailQ.data.type==='admin_credit'?'var(--success)':'var(--text)' }}>{formatCurrency(detailQ.data.amount,detailQ.data.currency)}</strong></div>
          <section className="rounded-xl border p-4" style={{ borderColor:"var(--border)" }}><DetailRow label="Description">{detailQ.data.description || '—'}</DetailRow><DetailRow label="Customer">{detailQ.data.customer?.name || '—'}</DetailRow><DetailRow label="Email">{detailQ.data.customer?.email || '—'}</DetailRow><DetailRow label="Account">{detailQ.data.account?.account_number || '—'}</DetailRow><DetailRow label="Created">{formatDateTime(detailQ.data.created_at)}</DetailRow></section>
          <section><div className="mb-3 flex items-center gap-2"><FileText size={17} style={{ color:"var(--brand-accent)" }}/><h3 className="font-semibold" style={{ color:"var(--text)" }}>Ledger entries</h3></div><LedgerTable entries={detailQ.data.ledger_entries} /></section>
        </div> : selectedId ? <div className="p-6 text-sm" style={{ color:"var(--danger)" }}>Transaction detail could not be loaded.</div> : null}
      </Drawer>
    </div>
  );
}
