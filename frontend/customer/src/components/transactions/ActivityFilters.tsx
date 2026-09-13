import { Search } from "lucide-react";
import { Input, Select } from "@/components/common";
import type { TransactionFilters } from "@/types/transactions";
export default function ActivityFilters({filters,onChange}:{filters:TransactionFilters;onChange:(next:TransactionFilters)=>void}){return <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_160px_150px_150px]">
 <div className="relative"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{color:"var(--muted)"}}/><Input className="pl-9" placeholder="Search by reference or description…" value={filters.search??""} onChange={e=>onChange({...filters,search:e.target.value})}/></div>
 <Select value={filters.type??""} onChange={e=>onChange({...filters,type:e.target.value})}><option value="">All types</option><option value="transfer">Transfers</option><option value="withdrawal">Withdrawals</option><option value="deposit">Deposits</option><option value="admin_credit">Credits</option><option value="adjustment">Adjustments</option><option value="payment_fee">Payment fees</option></Select>
 <Select value={filters.status??""} onChange={e=>onChange({...filters,status:e.target.value})}><option value="">All status</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="reversed">Reversed</option></Select>
 <Select value={filters.direction??""} onChange={e=>onChange({...filters,direction:e.target.value})}><option value="">All direction</option><option value="credit">Money in</option><option value="debit">Money out</option></Select>
 </div>}
