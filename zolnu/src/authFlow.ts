import type { SupabaseClient } from '@supabase/supabase-js';
export const PENDING_CONFIRMATION_KEY='zolnu-pending-confirmation-email';
export type AuthFailure={status:'error';code:string;message:string};
export type EmailAuthOutcome={status:'signed_in'}|{status:'confirmation_required';email:string}|AuthFailure;
export const AUTH_MESSAGES:Record<string,string>={
 invalid_credentials:'البريد أو كلمة المرور غير صحيحة.',email_not_confirmed:'حسابك موجود، لكنه يحتاج تأكيد البريد قبل الدخول.',
 over_email_send_rate_limit:'خدمة البريد وصلت للحد المؤقت. إنشاء حسابات إضافية أو تكرار الإرسال لن يحل المشكلة. انتظر أو جهّز خدمة SMTP للإرسال العام.',
 over_request_rate_limit:'طلبات كثيرة خلال وقت قصير. انتظر قبل المحاولة مجددًا.',
 email_address_not_authorized:'خدمة البريد الحالية لا ترسل لهذا العنوان. يلزم إعداد SMTP على السيرفر حتى يعمل التسجيل للجميع.',
 email_provider_disabled:'التسجيل بالبريد غير مفعّل على السيرفر.',signup_disabled:'إنشاء الحسابات متوقف على السيرفر.',
 otp_expired:'رابط أو رمز التأكيد منتهي أو استُخدم من قبل. اطلب رسالة جديدة عندما يصبح الإرسال متاحًا.',
 validation_failed:'تحقق من البريد والبيانات المدخلة.',weak_password:'اختار كلمة مرور أقوى من ٨ أحرف على الأقل.',
 network_error:'تعذّر الاتصال بخدمة الحسابات. تحقق من الإنترنت وأعد المحاولة.',
};
export function authFailure(error:unknown):AuthFailure{const e=error as {code?:string;message?:string};const code=e?.code||(/network|fetch|timeout/i.test(e?.message||'')?'network_error':'unknown');return {status:'error',code,message:AUTH_MESSAGES[code]||e?.message||'تعذّر إكمال تسجيل الدخول.'};}
export async function emailAuthenticate(client:Pick<SupabaseClient,'auth'>,email:string,password:string,signup:boolean,redirectTo:string):Promise<EmailAuthOutcome>{
 email=email.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {status:'error',code:'invalid_email',message:'اكتب عنوان بريد إلكتروني صحيح.'};
 if(!password||(signup&&password.length<8))return {status:'error',code:'weak_password',message:signup?'اختار كلمة مرور من ٨ أحرف على الأقل.':'اكتب كلمة المرور.'};
 try{const r=signup?await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}}):await client.auth.signInWithPassword({email,password});
 if(r.error){if(r.error.code==='email_not_confirmed')return {status:'confirmation_required',email};return authFailure(r.error);}
 if(r.data.session)return {status:'signed_in'};
 if(signup)return {status:'confirmation_required',email};
 return {status:'error',code:'missing_session',message:'لم تكتمل جلسة الدخول. أعد المحاولة.'};
 }catch(e){return authFailure(e);}
}
export type ConfirmationPayload={token:string;type:'signup';email:string}|{token_hash:string;type:'signup'|'email'}|{code:string};
export function confirmationPayload(input:string,email:string,serviceUrl:string):ConfirmationPayload{
 input=input.trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));
 if(/^\d{6,10}$/.test(input))return {email:email.trim(),token:input,type:'signup'};
 let url:URL;try{url=new URL(input);}catch{throw new Error('الصق رابط التأكيد الكامل من رسالة البريد أو أدخل رمزها الرقمي.');}
 const service=new URL(serviceUrl);const isService=url.protocol==='https:'&&url.host===service.host&&url.pathname==='/auth/v1/verify';const isApp=url.protocol==='zolnu:'&&url.host==='auth'&&['/callback','/confirm'].includes(url.pathname);
 if(!isService&&!isApp)throw new Error('هذا الرابط لا يخص تأكيد حساب ZOLNU.');
 const params=url.searchParams;const code=params.get('code');if(isApp&&code)return {code};
 const type=params.get('type');const token=params.get('token_hash')||params.get('token');if(token&&(type==='signup'||type==='email'))return {token_hash:token,type};
 throw new Error('رابط التأكيد ناقص أو غير مدعوم.');
}
