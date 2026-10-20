import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { requireBackend } from './backend';
import { SERVICE_URL, SERVICE_PUBLISHABLE_KEY } from './service-config';
WebBrowser.maybeCompleteAuthSession();
const completions=new Map<string,Promise<void>>();
export function completeOAuth(code:string){
 if(!completions.has(code)){const promise=(async()=>{const r=await requireBackend().auth.exchangeCodeForSession(code);if(r.error)throw r.error;})();completions.set(code,promise);void promise.catch(()=>completions.delete(code));setTimeout(()=>completions.delete(code),60000);}
 return completions.get(code)!;
}
export type ProviderSettings={external?:{google?:boolean;apple?:boolean;phone?:boolean;email?:boolean};disable_signup?:boolean;mailer_autoconfirm?:boolean};
export async function providerSettings():Promise<ProviderSettings>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 try{const res=await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL||SERVICE_URL}/auth/v1/settings`,{headers:{apikey:process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY||SERVICE_PUBLISHABLE_KEY},signal:controller.signal});
 if(!res.ok)throw new Error('تعذّر التحقق من طرق الدخول.');const settings=await res.json();if(!settings.external)throw new Error('تعذّر التحقق من طرق الدخول.');return settings;
 }finally{clearTimeout(timer);}
}
export function authRedirect(){return Platform.OS==='web'?`${window.location.origin}/auth/callback`:'zolnu://auth/callback';}
export async function oauth(provider:'google'|'apple'){
 const settings=await providerSettings();
 if(!settings.external?.[provider])throw new Error(provider==='apple'?'دخول Apple ينتظر إعداد حساب Apple Developer.':'دخول Google ينتظر إعداد Google OAuth.');
 const db=requireBackend(); const redirectTo=authRedirect();
 const {data,error}=await db.auth.signInWithOAuth({provider,options:{redirectTo,skipBrowserRedirect:true}});if(error)throw error;if(!data.url)throw new Error('تعذّر بدء تسجيل الدخول.');
 const result=await WebBrowser.openAuthSessionAsync(data.url,redirectTo);
 if(result.type==='success'){const url=new URL(result.url);const fragment=new URLSearchParams(url.hash.slice(1));const err=url.searchParams.get('error_description')||fragment.get('error_description');if(err)throw new Error(err);const code=url.searchParams.get('code');if(!code)throw new Error('تعذّر تأكيد جلسة الدخول.');await completeOAuth(code);}
}
