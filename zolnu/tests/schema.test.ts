import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseFixture } from './fixture';
test('database migration, ownership RLS, private saves, blocks and cascade deletion', async () => {
 const db = await databaseFixture();
 try {
  const a='10000000-0000-4000-8000-000000000001', b='20000000-0000-4000-8000-000000000002';
  await db.query('insert into auth.users(id) values($1),($2)',[a,b]);
  assert.equal((await db.query<{count:number}>('select count(*)::int as count from public.profiles')).rows[0].count,2);
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${a}';`);
  const pa=(await db.query<{id:string}>('insert into public.posts(user_id,caption,kind) values($1,$2,$3) returning id',[a,'hello','image'])).rows[0].id;
  await assert.rejects(db.query('insert into public.posts(user_id,caption,kind) values($1,$2,$3)',[b,'forged','image']),/row-level security/i);
  await db.query('insert into public.saves(user_id,post_id) values($1,$2)',[a,pa]);
  await db.exec(`set request.jwt.claim.sub = '${b}';`);
  assert.equal((await db.query('select * from public.saves')).rows.length,0);
  assert.equal((await db.query('delete from public.posts where id=$1 returning id',[pa])).rows.length,0);
  assert.equal((await db.query('update public.profiles set name=$1 where id=$2 returning id',['forged',a])).rows.length,0);
  await db.query('insert into public.likes(user_id,post_id) values($1,$2)',[b,pa]);
  await db.query('insert into public.comments(user_id,post_id,body) values($1,$2,$3)',[b,pa,'مرحبا']);
  await db.query('insert into public.blocks(user_id,target_id) values($1,$2)',[b,a]);
  assert.equal((await db.query('select * from public.posts')).rows.length,0);
  await assert.rejects(db.query('insert into public.comments(user_id,post_id,body) values($1,$2,$3)',[b,pa,'hidden']),/row-level security/i);
  await db.exec('reset role'); await db.query('delete from auth.users where id=$1',[a]);
  for(const table of ['posts','comments','likes','saves','blocks']) assert.equal((await db.query(`select * from public.${table}`)).rows.length,0,`${table} should cascade`);
  assert.equal((await db.query('select * from public.profiles')).rows.length,1);
 } finally { await db.close(); }
});
