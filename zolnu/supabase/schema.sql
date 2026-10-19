-- Run ONCE in a new Supabase project's SQL Editor. No service-role key belongs in the app.
begin;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 username text unique not null check (username ~ '^[a-z0-9_][a-z0-9_.]{2,23}$'),
 name text not null check (char_length(name) between 1 and 40),
 bio text not null default '' check (char_length(bio) <= 160),
 color text not null default '#b9a0ff' check (color ~ '^#[0-9a-fA-F]{6}$')
);
create table public.posts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade,
 caption text not null default '' check (char_length(caption) <= 2200),
 media_url text, storage_path text, kind text not null check (kind in ('image','video')),
 created_at timestamptz not null default now(),
 check (length(trim(caption)) > 0 or media_url is not null),
 check ((media_url is null and storage_path is null and kind = 'image') or (media_url is not null and storage_path is not null))
);
create table public.likes (user_id uuid references public.profiles on delete cascade, post_id uuid references public.posts on delete cascade, primary key(user_id, post_id));
create table public.saves (user_id uuid references public.profiles on delete cascade, post_id uuid references public.posts on delete cascade, primary key(user_id, post_id));
create table public.follows (user_id uuid references public.profiles on delete cascade, target_id uuid references public.profiles on delete cascade, primary key(user_id, target_id), check (user_id <> target_id));
create table public.comments (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade, post_id uuid not null references public.posts on delete cascade, body text not null check (char_length(trim(body)) between 1 and 500), created_at timestamptz not null default now());
create table public.blocks (user_id uuid references public.profiles on delete cascade, target_id uuid references public.profiles on delete cascade, primary key(user_id, target_id), check (user_id <> target_id));
create table public.reports (user_id uuid references public.profiles on delete cascade, post_id uuid references public.posts on delete cascade, reason text not null check (char_length(reason) between 1 and 500), created_at timestamptz not null default now(), primary key(user_id,post_id));
create index posts_feed_idx on public.posts(created_at desc);
create index posts_user_idx on public.posts(user_id);
create index comments_post_idx on public.comments(post_id,created_at);
create index follows_target_idx on public.follows(target_id);
create index blocks_target_idx on public.blocks(target_id);
create index likes_post_idx on public.likes(post_id);
create index saves_post_idx on public.saves(post_id);

-- Keep the generated username within the 24-character constraint.
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id, username, name) values(new.id, 'u_' || substring(replace(new.id::text, '-', '') from 1 for 22), 'مستخدم جديد');
 return new;
end; $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.follows enable row level security;
alter table public.comments enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy blocks_read on public.blocks for select to authenticated using (user_id = (select auth.uid()));
create policy blocks_insert on public.blocks for insert to authenticated with check (user_id = (select auth.uid()));
create policy blocks_update on public.blocks for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy blocks_delete on public.blocks for delete to authenticated using (user_id = (select auth.uid()));
create policy posts_read on public.posts for select to authenticated using (not exists(select 1 from public.blocks b where b.user_id = (select auth.uid()) and b.target_id = posts.user_id));
create policy posts_insert on public.posts for insert to authenticated with check (user_id = (select auth.uid()) and (storage_path is null or (storage_path like (select auth.uid())::text || '/%' and exists(select 1 from storage.objects o where o.bucket_id = 'media' and o.name = storage_path))));
create policy posts_delete on public.posts for delete to authenticated using (user_id = (select auth.uid()));
create policy likes_read on public.likes for select to authenticated using (exists(select 1 from public.posts p where p.id = post_id));
create policy likes_insert on public.likes for insert to authenticated with check (user_id = (select auth.uid()) and exists(select 1 from public.posts p where p.id = post_id));
create policy likes_delete on public.likes for delete to authenticated using (user_id = (select auth.uid()));
create policy saves_read on public.saves for select to authenticated using (user_id = (select auth.uid()));
create policy saves_insert on public.saves for insert to authenticated with check (user_id = (select auth.uid()) and exists(select 1 from public.posts p where p.id = post_id));
create policy saves_delete on public.saves for delete to authenticated using (user_id = (select auth.uid()));
create policy follows_read on public.follows for select to authenticated using (true);
create policy follows_insert on public.follows for insert to authenticated with check (user_id = (select auth.uid()));
create policy follows_delete on public.follows for delete to authenticated using (user_id = (select auth.uid()));
create policy comments_read on public.comments for select to authenticated using (exists(select 1 from public.posts p where p.id = post_id) and not exists(select 1 from public.blocks b where b.user_id = (select auth.uid()) and b.target_id = comments.user_id));
create policy comments_insert on public.comments for insert to authenticated with check (user_id = (select auth.uid()) and exists(select 1 from public.posts p where p.id = post_id));
create policy comments_delete on public.comments for delete to authenticated using (user_id = (select auth.uid()));
create policy reports_read on public.reports for select to authenticated using (user_id = (select auth.uid()));
create policy reports_insert on public.reports for insert to authenticated with check (user_id = (select auth.uid()) and exists(select 1 from public.posts p where p.id = post_id));
create policy reports_update on public.reports for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant usage on schema public to authenticated;
grant select,update on public.profiles to authenticated;
grant select,insert,delete on public.posts,public.likes,public.saves,public.follows,public.comments to authenticated;
grant select,insert,update,delete on public.blocks to authenticated;
grant select,insert,update on public.reports to authenticated;
revoke all on public.profiles,public.posts,public.likes,public.saves,public.follows,public.comments,public.blocks,public.reports from anon;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('media','media',true,26214400,array['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime']);
create policy media_insert on storage.objects for insert to authenticated with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy media_select on storage.objects for select to authenticated using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy media_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
