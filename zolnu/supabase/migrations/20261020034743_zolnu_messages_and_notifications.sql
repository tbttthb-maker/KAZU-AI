begin;
create table public.account_settings (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 dm_policy text not null default 'everyone' check (dm_policy in ('everyone','followers','nobody'))
);
alter table public.account_settings enable row level security;
create policy settings_read on public.account_settings for select to authenticated using(user_id=(select auth.uid()));
create policy settings_insert on public.account_settings for insert to authenticated with check(user_id=(select auth.uid()));
create policy settings_update on public.account_settings for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,insert,update on public.account_settings to authenticated;
revoke all on public.account_settings from anon;
create function zolnu_private.can_message(p_sender uuid,p_recipient uuid) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid())=p_sender and p_sender<>p_recipient
 and exists(select 1 from public.profiles where id=p_sender)
 and exists(select 1 from public.profiles where id=p_recipient)
 and not exists(select 1 from public.blocks where (user_id=p_sender and target_id=p_recipient) or (user_id=p_recipient and target_id=p_sender))
 and (coalesce((select dm_policy from public.account_settings where user_id=p_recipient),'everyone')='everyone'
 or ((select dm_policy from public.account_settings where user_id=p_recipient)='followers' and exists(select 1 from public.follows where user_id=p_sender and target_id=p_recipient)));
$$;
revoke all on function zolnu_private.can_message(uuid,uuid) from public,anon;
grant execute on function zolnu_private.can_message(uuid,uuid) to authenticated;
create table public.direct_messages (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now(), read_at timestamptz,
 check(sender_id<>recipient_id)
);
create index dm_sender_time on public.direct_messages(sender_id,created_at desc);
create index dm_recipient_time on public.direct_messages(recipient_id,created_at desc);
alter table public.direct_messages enable row level security;
create policy messages_read on public.direct_messages for select to authenticated using((select auth.uid()) in(sender_id,recipient_id));
create policy messages_insert on public.direct_messages for insert to authenticated with check(sender_id=(select auth.uid()) and read_at is null and zolnu_private.can_message(sender_id,recipient_id));
create policy messages_read_receipt on public.direct_messages for update to authenticated using(recipient_id=(select auth.uid())) with check(recipient_id=(select auth.uid()));
grant select on public.direct_messages to authenticated;
grant insert(sender_id,recipient_id,body) on public.direct_messages to authenticated;
grant update(read_at) on public.direct_messages to authenticated;
revoke all on public.direct_messages from anon;
create table public.notifications (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 actor_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check(kind in('like','comment','follow','message')),
 post_id uuid references public.posts(id) on delete cascade,
 created_at timestamptz not null default now(),read_at timestamptz
);
create index notifications_user_time on public.notifications(user_id,created_at desc);
create index notifications_actor on public.notifications(actor_id);
create index notifications_post on public.notifications(post_id);
alter table public.notifications enable row level security;
create policy notifications_read on public.notifications for select to authenticated using(user_id=(select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
revoke all on public.notifications from anon;
create function zolnu_private.notify_interaction() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid; actor uuid; event text; post uuid;
begin
 if tg_table_name='direct_messages' then target:=new.recipient_id;actor:=new.sender_id;event:='message';
 elsif tg_table_name='follows' then target:=new.target_id;actor:=new.user_id;event:='follow';
 else select user_id into target from public.posts where id=new.post_id;actor:=new.user_id;post:=new.post_id;event:=case when tg_table_name='likes' then 'like' else 'comment' end;
 end if;
 if target is not null and target<>actor and not exists(select 1 from public.blocks where (user_id=target and target_id=actor)or(user_id=actor and target_id=target)) then
 insert into public.notifications(user_id,actor_id,kind,post_id) values(target,actor,event,post);
 end if;return new;
end;$$;
revoke all on function zolnu_private.notify_interaction() from public,anon,authenticated;
create trigger notify_like after insert on public.likes for each row execute function zolnu_private.notify_interaction();
create trigger notify_comment after insert on public.comments for each row execute function zolnu_private.notify_interaction();
create trigger notify_follow after insert on public.follows for each row execute function zolnu_private.notify_interaction();
create trigger notify_message after insert on public.direct_messages for each row execute function zolnu_private.notify_interaction();
commit;
