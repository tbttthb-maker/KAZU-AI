import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseFixture } from './fixture';
test('company ownership uses confirmed server email; campaign grant is permanent and cannot be forged', async () => {
 const db=await databaseFixture(); const owner='30000000-0000-4000-8000-000000000003',fan='40000000-0000-4000-8000-000000000004',late='50000000-0000-4000-8000-000000000005';
 try {
  await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,null),($3,$4,now()),($5,$6,now())',[owner,'tbttthb@gmail.com',fan,'fan@example.com',late,'late@example.com']);
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${owner}';`);
  assert.equal((await db.query<{claim_company_account:boolean}>('select public.claim_company_account()')).rows[0].claim_company_account,false);
  await db.exec('reset role'); await db.query('update auth.users set email_confirmed_at=now() where id=$1',[owner]);
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${owner}';`);
  assert.equal((await db.query<{claim_company_account:boolean}>('select public.claim_company_account()')).rows[0].claim_company_account,true);
  const post=(await db.query<{id:string}>('insert into public.posts(user_id,caption,kind) values($1,$2,$3) returning id',[owner,'launch','image'])).rows[0].id;
  const campaign=(await db.query<{id:string}>('select public.start_verification_campaign($1,48) as id',[post])).rows[0].id;
  await db.exec(`set request.jwt.claim.sub='${fan}';`);
  assert.equal((await db.query<{claim_company_account:boolean}>('select public.claim_company_account()')).rows[0].claim_company_account,false);
  await assert.rejects(db.query('insert into public.company_accounts(user_id) values($1)',[fan]),/permission denied|row-level security/i);
  await assert.rejects(db.query('insert into public.verification_grants(user_id) values($1)',[fan]),/permission denied|row-level security/i);
  await assert.rejects(db.query('select public.start_verification_campaign($1,48)',[post]),/لوحة الشركة/);
  await assert.rejects(db.query('update public.profiles set frame=$1 where id=$2',['founder',fan]),/إطار المؤسس/);
  await assert.rejects(db.query('update public.profiles set username=$1 where id=$2',['zolnu',fan]),/محجوز/);
  await db.query('insert into public.likes(user_id,post_id) values($1,$2)',[fan,post]);
  assert.equal((await db.query('select * from public.verification_grants where user_id=$1',[fan])).rows.length,1);
  await db.query('update public.profiles set frame=$1 where id=$2',['founder',fan]);
  await db.query('delete from public.likes where user_id=$1 and post_id=$2',[fan,post]);
  assert.equal((await db.query('select * from public.verification_grants where user_id=$1',[fan])).rows.length,1);
  await db.exec(`set request.jwt.claim.sub='${owner}';`);await db.query('select public.stop_verification_campaign($1)',[campaign]);
  await db.exec(`set request.jwt.claim.sub='${late}';`);await db.query('insert into public.likes(user_id,post_id) values($1,$2)',[late,post]);
  assert.equal((await db.query('select * from public.verification_grants where user_id=$1',[late])).rows.length,0);
  await db.exec('reset role');await db.query('update public.verification_campaigns set active=true,starts_at=now()-interval \'2 hours\',ends_at=now()-interval \'1 hour\' where id=$1',[campaign]);
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${late}';`);await db.query('delete from public.likes where user_id=$1 and post_id=$2',[late,post]);await db.query('insert into public.likes(user_id,post_id) values($1,$2)',[late,post]);
  assert.equal((await db.query('select * from public.verification_grants where user_id=$1',[late])).rows.length,0);
  await db.exec(`set request.jwt.claim.sub='${owner}';`);await db.query('delete from public.posts where id=$1',[post]);
  assert.equal((await db.query('select * from public.verification_grants where user_id=$1',[fan])).rows.length,1);
 } finally {await db.close();}
});
