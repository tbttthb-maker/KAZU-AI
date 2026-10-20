import test from 'node:test';
import assert from 'node:assert/strict';
import {emailAuthenticate,confirmationPayload,authFailure} from '../src/authFlow';
const service='https://testproject.supabase.co';
function client(response:any){const calls:any[]=[];return {calls,auth:{signUp:async(args:any)=>{calls.push(['signup',args]);return response;},signInWithPassword:async(args:any)=>{calls.push(['login',args]);return response;}}}as any;}
test('unconfirmed signups remain in confirmation flow; only a real session signs in',async()=>{
 const db=client({data:{session:null,user:{id:'fixture'}},error:null});assert.deepEqual(await emailAuthenticate(db,' test@example.com ','password123',true,'zolnu://auth/callback'),{status:'confirmation_required',email:'test@example.com'});assert.equal(db.calls[0][1].options.emailRedirectTo,'zolnu://auth/callback');
 const login=client({data:{session:{access_token:'fixture'}},error:null});assert.deepEqual(await emailAuthenticate(login,'test@example.com','short',false,'zolnu://auth/callback'),{status:'signed_in'});assert.equal(login.calls.length,1);
});
test('unconfirmed login returns actionable confirmation state; mail throttling stays an error',async()=>{
 const db=client({data:{session:null},error:{code:'email_not_confirmed'}});assert.equal((await emailAuthenticate(db,'test@example.com','password123',false,'zolnu://auth/callback')).status,'confirmation_required');
 const limited=client({data:{session:null},error:{code:'over_email_send_rate_limit'}});const r=await emailAuthenticate(limited,'test@example.com','password123',true,'zolnu://auth/callback');assert.equal(r.status,'error');assert.equal(r.status==='error'&&r.code,'over_email_send_rate_limit');
});
test('validation rejects invalid email and short signup password without a network call',async()=>{
 const db=client({});assert.equal((await emailAuthenticate(db,'bad email','password123',true,'x')).status,'error');assert.equal((await emailAuthenticate(db,'test@example.com','short',true,'x')).status,'error');assert.equal(db.calls.length,0);
});
test('confirmation accepts Arabic OTP digits and original project links; rejects foreign destinations',()=>{
 assert.deepEqual(confirmationPayload('١٢٣٤٥٦','test@example.com',service),{email:'test@example.com',token:'123456',type:'signup'});
 assert.deepEqual(confirmationPayload(service+'/auth/v1/verify?token=fixture-token&type=signup','test@example.com',service),{token_hash:'fixture-token',type:'signup'});
 assert.deepEqual(confirmationPayload('zolnu://auth/callback?code=fixture-code','test@example.com',service),{code:'fixture-code'});
 assert.throws(()=>confirmationPayload('https://foreign.example/auth/v1/verify?token=fixture&type=signup','x',service));
 assert.throws(()=>confirmationPayload(service+'/auth/v1/verify?token=fixture&type=recovery','x',service));
});
test('expired code errors remain explicit',()=>{assert.equal(authFailure({code:'otp_expired'}).code,'otp_expired');assert.match(authFailure({code:'otp_expired'}).message,/منتهي/);});
