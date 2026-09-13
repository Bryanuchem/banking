import { apiClient } from "@/api/client";
export type LoginPayload={email:string;password:string};
export type LoginResponse={access_token?:string;token_type?:string;requires_two_factor?:boolean;challenge_token?:string};
export async function login(payload:LoginPayload){return (await apiClient.post<LoginResponse>("/auth/login",payload)).data;}
export async function getCurrentUser(){return (await apiClient.get("/auth/me")).data;}
