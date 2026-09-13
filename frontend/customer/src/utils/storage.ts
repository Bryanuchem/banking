const KEY="banking_access_token";
export const getAccessToken=()=>localStorage.getItem(KEY);
export const setAccessToken=(token:string)=>localStorage.setItem(KEY,token);
export const clearAccessToken=()=>localStorage.removeItem(KEY);
