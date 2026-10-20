import test from 'node:test';
import assert from 'node:assert/strict';
import {databaseFixture} from './fixture';
test('messages, privacy and notifications enforce ownership and immutable content',async()=>{
 const db=await databaseFixture();const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',c='33333333-3333-4333-8333-333333333333';
 try{
 await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now()),($3,$4,now()),($5,$6,now())',[a,'a@example.invalid',b,'b@example.invalid',c,'c@example.invalid']);
 await db.exec(`set role authenticated;set request.jwt.claim.sub='${a}';`);
 const m=(await db.query<{id:string}>('insert into public.direct_messages(sender_id,recipient_id,body)values($1,$2,$3)returning id',[a,b,'private'])).rows[0].id;
 await assert.rejects(db.query('insert into public.direct_messages(sender_id,recipient_id,body)values($1,$2,$3)',[c,b,'forged']),/row-level security/i);
 await db.exec(`set request.jwt.claim.sub='${c}';`);assert.equal((await db.query('select * from public.direct_messages')).rows.length,0);assert.equal((await db.query('select * from public.notifications')).rows.length,0);
 await assert.rejects(db.query('insert into public.notifications(user_id,actor_id,kind)values($1,$2,$3)',[c,a,'follow']),/permission denied/i);
 await db.exec(`set request.jwt.claim.sub='${b}';`);assert.equal((await db.query('select * from public.notifications')).rows.length,1);
 await assert.rejects(db.query('update public.direct_messages set body=$1 where id=$2',['modified',m]),/permission denied/i);
 await db.query('update public.direct_messages set read_at=now()where id=$1',[m]);
 await db.query('insert into public.account_settings(user_id,dm_policy)values($1,$2)',[b,'nobody']);
 await db.exec(`set request.jwt.claim.sub='${a}';`);await assert.rejects(db.query('insert into public.direct_messages(sender_id,recipient_id,body)values($1,$2,$3)',[a,b,'blocked by privacy']),/row-level security/i);
 await db.exec(`set request.jwt.claim.sub='${b}';`);await db.query('update public.account_settings set dm_policy=$1 where user_id=$2',['followers',b]);
 await db.exec(`set request.jwt.claim.sub='${a}';`);await assert.rejects(db.query('insert into public.direct_messages(sender_id,recipient_id,body)values($1,$2,$3)',[a,b,'not following']),/row-level security/i);
 await db.query('insert into public.follows(user_id,target_id)values($1,$2)',[a,b]);await db.query('insert into public.direct_messages(sender_id,recipient_id,body)values($1,$2,$3)',[a,b,'following']);
 await db.exec(`set request.jwt.claim.sub='${b}';`);await db.query('insert into public.blocks(user_id,target_id)values($1,$2)',[b,a]);
 await db.exec(`set request.jwt.claim.sub='${a}';`);await assert.rejects(db.query('insert into public.direct_messages(sender_id,recipient_id,body)values($1,$2,$3)',[a,b,'blocked by recipient']),/row-level security/i);
 await db.exec('reset role');await db.query('delete from auth.users where id=$1',[a]);assert.equal((await db.query('select * from public.direct_messages')).rows.length,0);
 }finally{await db.close();}
});
