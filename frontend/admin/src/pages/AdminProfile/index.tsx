import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { updateAdminProfile } from "@/api/profile";
import Button from "@/components/common/Button";
import { useAdminAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { ROUTES } from "@/routes/paths";

export default function AdminProfilePage(){
 const {user,refreshUser}=useAdminAuth(); const snackbar=useSnackbar();
 const [first,setFirst]=useState(""); const [last,setLast]=useState(""); const [phone,setPhone]=useState("");
 useEffect(()=>{if(user){setFirst(user.first_name);setLast(user.last_name);setPhone(user.phone??"")}},[user]);
 const save=useMutation({mutationFn:()=>updateAdminProfile({first_name:first.trim(),last_name:last.trim(),phone:phone.trim()||null}),onSuccess:async()=>{await refreshUser();snackbar.showSnackbar("Profile updated.", "success");},onError:()=>snackbar.showSnackbar("Profile could not be updated.", "error")});
 if(!user)return null;
 return <div className="mx-auto max-w-4xl space-y-5">
  <div><h1 className="text-2xl font-semibold" style={{color:"var(--text)"}}>Admin profile</h1><p className="mt-1 text-sm" style={{color:"var(--muted)"}}>Manage your administrator identity and security.</p></div>
  <section className="rounded-2xl border p-5" style={{background:"var(--surface)",borderColor:"var(--border)"}}>
   <div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full" style={{background:"var(--surface-alt)",color:"var(--brand-accent)"}}><UserRound/></span><div><h2 className="font-semibold" style={{color:"var(--text)"}}>{user.first_name} {user.last_name}</h2><p className="text-sm" style={{color:"var(--muted)"}}>{user.email}</p><span className="mt-2 inline-flex rounded-lg px-2 py-1 text-xs font-semibold" style={{background:"var(--surface-alt)",color:"var(--brand-accent)"}}>Administrator</span></div></div>
  </section>
  <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
   <section className="rounded-2xl border p-5" style={{background:"var(--surface)",borderColor:"var(--border)"}}>
    <h2 className="font-semibold" style={{color:"var(--text)"}}>Personal information</h2>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
     <Field label="First name"><input value={first} onChange={e=>setFirst(e.target.value)} /></Field>
     <Field label="Last name"><input value={last} onChange={e=>setLast(e.target.value)} /></Field>
     <div className="sm:col-span-2"><Field label="Phone"><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Optional phone number"/></Field></div>
     <div className="sm:col-span-2"><Field label="Email"><input value={user.email} disabled /></Field><p className="mt-1 text-xs" style={{color:"var(--muted)"}}>Email remains read-only until a verified email-change flow is added.</p></div>
    </div>
    <Button className="mt-5" loading={save.isPending} onClick={()=>save.mutate()}>Save changes</Button>
   </section>
   <section className="rounded-2xl border p-5" style={{background:"var(--surface)",borderColor:"var(--border)"}}>
    <h2 className="font-semibold" style={{color:"var(--text)"}}>Security</h2>
    <div className="mt-4 space-y-2">
      <SecurityLink to={ROUTES.adminTwoFactor} icon={<ShieldCheck size={17}/>} title="Two-factor authentication" text="Set up or manage your own 2FA"/>
      <SecurityLink to={ROUTES.sessions} icon={<KeyRound size={17}/>} title="Sessions" text="Review active sessions"/>
    </div>
   </section>
  </div>
 </div>
}
function Field({label,children}:{label:string;children:React.ReactElement<{className?:string;style?:React.CSSProperties}>}){return <label className="block"><span className="mb-1.5 block text-xs font-medium" style={{color:"var(--muted)"}}>{label}</span>{React.cloneElement(children,{className:"h-11 w-full rounded-xl border bg-transparent px-3 text-sm disabled:opacity-60",style:{borderColor:"var(--border)",color:"var(--text)"}})}</label>}
function SecurityLink({to,icon,title,text}:{to:string;icon:React.ReactNode;title:string;text:string}){return <Link to={to} className="flex items-center gap-3 rounded-xl border p-3" style={{borderColor:"var(--border)",color:"var(--text)"}}><span style={{color:"var(--brand-accent)"}}>{icon}</span><span><b className="text-sm">{title}</b><span className="block text-xs" style={{color:"var(--muted)"}}>{text}</span></span></Link>}
