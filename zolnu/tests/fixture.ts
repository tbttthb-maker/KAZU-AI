import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
export async function databaseFixture() {
 const db=new PGlite();
  await db.exec(`
   create role anon; create role authenticated;
   create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
   create schema storage;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
   alter table storage.objects enable row level security;
   create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
   grant usage on schema storage to authenticated; grant select,insert,delete on storage.objects to authenticated;
  `);
  await db.exec(readFileSync(new URL('../supabase/schema.sql', import.meta.url),'utf8'));
  await db.exec(readFileSync(new URL('../supabase/migrations/002_company_profiles.sql',import.meta.url),'utf8'));
 await db.exec(readFileSync(new URL('../supabase/migrations/003_account_verification.sql',import.meta.url),'utf8'));
 for (const f of readdirSync(new URL('../supabase/migrations',import.meta.url)).filter(f=>f.endsWith('_zolnu_rpc_hardening.sql')||f.endsWith('_zolnu_storage_membership.sql')||f.endsWith('_zolnu_messages_and_notifications.sql'))) await db.exec(readFileSync(new URL('../supabase/migrations/'+f,import.meta.url),'utf8'));
 return db;
}
