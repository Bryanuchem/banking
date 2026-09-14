import { Bell, CheckCheck, Megaphone, Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getAdminInboxNotifications, getAdminSentNotifications, getAdminUsers, markAllAdminNotificationsRead, markAdminNotificationRead, sendAdminNotification } from "@/api/admin";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import SecurityHeader from "@/components/security/SecurityHeader";
import { useSnackbar } from "@/context/SnackbarContext";
import type { AdminNotificationSendPayload } from "@/types/admin";

export default function AdminNotificationsPage(){
  const [tab,setTab]=useState<"inbox"|"sent">("inbox");
  const [compose,setCompose]=useState(false);
  const qc=useQueryClient(); const snackbar=useSnackbar();
  const inbox=useQuery({queryKey:["admin","notifications","inbox"],queryFn:()=>getAdminInboxNotifications()});
  const sent=useQuery({queryKey:["admin","notifications","sent"],queryFn:getAdminSentNotifications});
  const refresh=()=>{void qc.invalidateQueries({queryKey:["admin","notifications"]});};
  const allM=useMutation({mutationFn:markAllAdminNotificationsRead,onSuccess:refresh});
  const readM=useMutation({mutationFn:markAdminNotificationRead,onSuccess:refresh});
  return <div className="space-y-5">
    <SecurityHeader title="Notifications" description="Operational alerts and customer announcements." action={<Button onClick={()=>setCompose(true)}><span className="inline-flex items-center gap-2"><Send size={15}/>Send notification</span></Button>}/>
    <div className="flex items-center justify-between gap-3">
      <div className="inline-flex rounded-xl border p-1" style={{borderColor:"var(--border)",background:"var(--surface)"}}>
        {(["inbox","sent"] as const).map(v=><button key={v} onClick={()=>setTab(v)} className="rounded-lg px-4 py-2 text-sm font-semibold capitalize" style={{background:tab===v?"var(--surface-alt)":"transparent",color:tab===v?"var(--text)":"var(--muted)"}}>{v}</button>)}
      </div>
      {tab==="inbox"?<Button variant="secondary" disabled={!inbox.data?.unread} onClick={()=>allM.mutate()}><span className="inline-flex items-center gap-2"><CheckCheck size={15}/>Mark all read</span></Button>:null}
    </div>
    <section className="overflow-hidden rounded-2xl border" style={{background:"var(--surface)",borderColor:"var(--border)"}}>
      {tab==="inbox" ? (!inbox.data?.items.length?<Empty/>:inbox.data.items.map(item=><button key={item.id} className="block w-full border-b p-4 text-left last:border-0" style={{borderColor:"var(--border)",background:item.read_at?"var(--surface)":"color-mix(in srgb, var(--brand-primary) 5%, var(--surface))"}} onClick={()=>!item.read_at&&readM.mutate(item.id)}>
        <div className="flex items-start gap-3"><span className="mt-2 size-2 rounded-full" style={{background:item.read_at?"var(--border)":"var(--brand-accent)"}}/><div><p className="font-semibold" style={{color:"var(--text)"}}>{item.title}</p><p className="mt-1 text-sm" style={{color:"var(--muted)"}}>{item.message}</p><p className="mt-2 text-xs" style={{color:"var(--muted)"}}>{new Date(item.created_at).toLocaleString()}</p></div></div>
      </button>)) : (!sent.data?.items.length?<Empty/>:sent.data.items.map(item=><div key={item.id} className="border-b p-4 last:border-0" style={{borderColor:"var(--border)"}}>
        <div className="flex items-start justify-between gap-4"><div><p className="font-semibold" style={{color:"var(--text)"}}>{item.title}</p><p className="mt-1 text-sm" style={{color:"var(--muted)"}}>{item.message}</p></div><span className="whitespace-nowrap rounded-lg px-2 py-1 text-xs" style={{background:"var(--surface-alt)",color:"var(--muted)"}}>{item.recipient_count} recipients</span></div>
      </div>))}
    </section>
    <Compose open={compose} onClose={()=>setCompose(false)} onSent={()=>{setCompose(false);refresh();snackbar.showSnackbar("Notification sent.", "success");}}/>
  </div>
}
function Empty(){return <div className="p-12 text-center"><Bell className="mx-auto mb-3" style={{color:"var(--muted)"}}/><p className="font-semibold" style={{color:"var(--text)"}}>Nothing here yet</p></div>}

function Compose({open,onClose,onSent}:{open:boolean;onClose:()=>void;onSent:()=>void}){
 const [audience,setAudience]=useState<"selected"|"all_active_customers">("selected");
 const [confirmAll,setConfirmAll]=useState(false);
 const [q,setQ]=useState(""); const [selected,setSelected]=useState<string[]>([]);
 const [title,setTitle]=useState(""); const [message,setMessage]=useState(""); const [severity,setSeverity]=useState<AdminNotificationSendPayload["severity"]>("info");
 const users=useQuery({queryKey:["admin","notify-customers",q],queryFn:()=>getAdminUsers({q:q||undefined,limit:20,offset:0}),enabled:open&&audience==="selected"});
 const sendM=useMutation({mutationFn:sendAdminNotification,onSuccess:onSent});
 const canSend=title.trim()&&message.trim()&&(audience==="all_active_customers"||selected.length>0);
 function submit(){
   if(!canSend)return;
   if(audience==="all_active_customers"&&!confirmAll){ setConfirmAll(true); return; }
   sendM.mutate({title:title.trim(),message:message.trim(),severity,category:"announcement",audience,user_ids:audience==="selected"?selected:[]});
 }
 return <Modal open={open} title="Send customer notification" onClose={onClose} maxWidth="max-w-2xl"><div className="space-y-4 p-5">
   <div className="grid gap-2 sm:grid-cols-2">{(["selected","all_active_customers"] as const).map(v=><button type="button" key={v} onClick={()=>{setAudience(v);setConfirmAll(false)}} className="rounded-xl border p-3 text-left text-sm font-semibold" style={{borderColor:audience===v?"var(--brand-primary)":"var(--border)",background:audience===v?"var(--surface-alt)":"var(--surface)",color:"var(--text)"}}>{v==="selected"?"Selected customers":"All active customers"}</button>)}</div>
   {audience==="selected"?<div><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search customers..." className="h-11 w-full rounded-xl border bg-transparent px-3 text-sm" style={{borderColor:"var(--border)",color:"var(--text)"}}/><div className="mt-2 max-h-44 overflow-auto rounded-xl border" style={{borderColor:"var(--border)"}}>{users.data?.items.filter(u=>!u.is_admin).map(u=><label key={u.id} className="flex items-center gap-3 border-b p-3 last:border-0" style={{borderColor:"var(--border)",color:"var(--text)"}}><input type="checkbox" checked={selected.includes(u.id)} onChange={()=>setSelected(s=>s.includes(u.id)?s.filter(x=>x!==u.id):[...s,u.id])}/><span><b>{u.first_name} {u.last_name}</b><span className="block text-xs" style={{color:"var(--muted)"}}>{u.email}</span></span></label>)}</div></div>:<div className="rounded-xl border p-3 text-sm" style={{borderColor:"var(--warning)",color:"var(--muted)"}}>{confirmAll?<><b style={{color:"var(--warning)"}}>Confirm broadcast:</b> click Send again to notify every active customer.</>:<>This will notify every active customer. You will confirm once more before sending.</>}</div>}
   <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Notification title" className="h-11 w-full rounded-xl border bg-transparent px-3 text-sm" style={{borderColor:"var(--border)",color:"var(--text)"}}/>
   <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write the message..." rows={5} className="w-full rounded-xl border bg-transparent p-3 text-sm" style={{borderColor:"var(--border)",color:"var(--text)"}}/>
   <div>
     <p className="mb-2 text-xs font-medium" style={{color:"var(--muted)"}}>Severity</p>
     <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
       {([
         ["info","Information"],
         ["success","Success"],
         ["warning","Warning"],
         ["danger","Urgent"],
       ] as const).map(([value,label])=>(
         <button
           key={value}
           type="button"
           onClick={()=>setSeverity(value)}
           className="rounded-xl border px-3 py-2.5 text-sm font-semibold transition"
           style={{
             borderColor: severity===value ? "var(--brand-primary)" : "var(--border)",
             background: severity===value ? "color-mix(in srgb, var(--brand-primary) 12%, var(--surface))" : "var(--surface)",
             color: severity===value ? "var(--text)" : "var(--muted)",
           }}
         >
           {label}
         </button>
       ))}
     </div>
   </div>
   <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={sendM.isPending} disabled={!canSend} onClick={submit}><span className="inline-flex items-center gap-2"><Megaphone size={15}/>Send</span></Button></div>
 </div></Modal>
}
