import {createContext,useContext,useMemo,useState,type PropsWithChildren} from "react";
import {clearAccessToken,getAccessToken,setAccessToken} from "@/utils/storage";
type Value={accessToken:string|null;isAuthenticated:boolean;signIn:(t:string)=>void;signOut:()=>void};
const C=createContext<Value|null>(null);
export function AuthProvider({children}:PropsWithChildren){
 const [accessToken,setToken]=useState<string|null>(()=>getAccessToken());
 const value=useMemo(()=>({accessToken,isAuthenticated:Boolean(accessToken),signIn:(t:string)=>{setAccessToken(t);setToken(t)},signOut:()=>{clearAccessToken();setToken(null)}}),[accessToken]);
 return <C.Provider value={value}>{children}</C.Provider>;
}
export function useAuthContext(){const v=useContext(C);if(!v)throw new Error("useAuthContext must be used inside AuthProvider");return v;}
