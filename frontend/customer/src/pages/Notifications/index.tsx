import { Bell, CheckCheck, ChevronRight, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import Button from "@/components/common/Button";
import PageHeader from "@/components/common/PageHeader";
import { dismissNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from "@/api/notifications";
import type { NotificationItem } from "@/types/notifications";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery({ queryKey:["notifications"], queryFn:()=>getNotifications() });
  const refresh=()=>qc.invalidateQueries({queryKey:["notifications"]});
  const readM=useMutation({mutationFn:markNotificationRead,onSuccess:refresh});
  const allM=useMutation({mutationFn:markAllNotificationsRead,onSuccess:refresh});
  const dismissM=useMutation({mutationFn:dismissNotification,onSuccess:refresh});

  async function open(item: NotificationItem) {
    if (!item.read_at) await readM.mutateAsync(item.id);
    if (item.action_url) navigate(item.action_url);
  }

  return <div className="space-y-6">
    <PageHeader title="Notifications" description="Account, financial and security updates in one place." />
    <div className="flex justify-end">
      <Button variant="secondary" icon={<CheckCheck size={16}/>} disabled={!query.data?.unread} onClick={()=>allM.mutate()}>
        Mark all read
      </Button>
    </div>
    <section className="overflow-hidden rounded-[var(--radius-card)] border" style={{background:"var(--surface)",borderColor:"var(--border)"}}>
      {!query.data?.items.length ? <div className="p-10 text-center">
        <Bell className="mx-auto mb-3" style={{color:"var(--muted)"}}/>
        <p className="font-semibold" style={{color:"var(--text)"}}>You're all caught up</p>
        <p className="mt-1 text-sm" style={{color:"var(--muted)"}}>Important account updates will appear here.</p>
      </div> : query.data.items.map(item=><article key={item.id} className="flex gap-3 border-b p-4 last:border-b-0" style={{borderColor:"var(--border)",background:item.read_at?"var(--surface)":"color-mix(in srgb, var(--brand-accent) 5%, var(--surface))"}}>
        <span className="mt-1 size-2 shrink-0 rounded-full" style={{background:item.read_at?"var(--border)":severityColor(item.severity)}}/>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={()=>void open(item)}>
          <div className="flex items-start justify-between gap-3">
            <div><p className="font-semibold" style={{color:"var(--text)"}}>{item.title}</p>
            <p className="mt-1 text-sm leading-6" style={{color:"var(--muted)"}}>{item.message}</p>
            <p className="mt-2 text-xs" style={{color:"var(--muted)"}}>{new Date(item.created_at).toLocaleString()}</p></div>
            {item.action_url?<ChevronRight size={16} style={{color:"var(--muted)"}}/>:null}
          </div>
        </button>
        <button aria-label="Dismiss notification" className="grid size-9 shrink-0 place-items-center rounded-lg" style={{color:"var(--muted)"}} onClick={()=>dismissM.mutate(item.id)}><Trash2 size={15}/></button>
      </article>)}
    </section>
  </div>;
}
function severityColor(value:string){return value==="danger"?"var(--danger)":value==="warning"?"var(--warning)":value==="success"?"var(--success)":"var(--brand-accent)"}
