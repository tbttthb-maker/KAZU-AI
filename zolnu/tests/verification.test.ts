import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseFixture } from './fixture';
test('blue verification requires independent company review, protects requests and revokes on identity change',async()=>{
 const db=await databaseFixture();const admin='60000000-0000-4000-8000-000000000006',user='70000000-0000-4000-8000-000000000007',other='80000000-0000-4000-8000-000000000008';
 try{
 await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now()),($3,$4,now()),($5,$6,now())',[admin,'tbttthb@gmail.com',user,'review@example.com',other,'other@example.com']);
 await db.exec(`set role authenticated;set request.jwt.claim.sub='${admin}'`);await db.query('select public.claim_company_account()');
 await db.exec(`set request.jwt.claim.sub='${user}'`);
 await assert.rejects(db.query('insert into public.account_verifications(user_id) values($1)',[user]),/permission denied|row-level security/);
 await db.query('select public.request_account_verification($1,$2)',['https://example.com/official','I control this official website and can respond through its published contact.']);
 await assert.rejects(db.query('select public.request_account_verification($1,$2)',['https://example.com','Another request with valid long explanation']),/قيد المراجعة/);
 await assert.rejects(db.query('select public.review_account_verification($1,true,$2)',[user,'Trying to approve my own identity']),/إدارة الشركة/);
 assert.equal((await db.query('select * from public.account_verifications')).rows.length,0);
 await db.exec(`set request.jwt.claim.sub='${other}'`);
 assert.equal((await db.query('select * from public.verification_requests')).rows.length,0);
 await db.exec(`set request.jwt.claim.sub='${admin}'`);
 assert.equal((await db.query('select * from public.verification_requests')).rows.length,1);
 await db.query('select public.review_account_verification($1,true,$2)',[user,'Confirmed ownership via independently published official contact.']);
 assert.equal((await db.query('select * from public.account_verifications where user_id=$1',[user])).rows.length,1);
 await db.exec(`set request.jwt.claim.sub='${user}'`);await db.query('update public.profiles set name=$1 where id=$2',['New identity',user]);
 assert.equal((await db.query('select * from public.account_verifications where user_id=$1',[user])).rows.length,0);
 assert.equal((await db.query<{status:string}>('select status from public.verification_requests where user_id=$1',[user])).rows[0].status,'revoked');
 await db.query('select public.request_account_verification($1,$2)',['https://example.com/renewed','A fresh verification request with ownership evidence.']);
 await db.query('update public.profiles set username=$1 where id=$2',['renamed_owner',user]);
 await db.exec(`set request.jwt.claim.sub='${admin}'`);
 await assert.rejects(db.query('select public.review_account_verification($1,true,$2)',[user,'Cannot approve a changed identity while pending']),/غير متاح/);
 await db.query('select public.request_account_verification($1,$2)',['https://example.com/company','This is the company official public website']);
 await assert.rejects(db.query('select public.review_account_verification($1,true,$2)',[admin,'Trying to self approve my own badge']),/بنفسك/);
 }finally{await db.close();}
});
