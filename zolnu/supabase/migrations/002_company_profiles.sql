-- Run AFTER schema.sql on an existing v0.1 database. New projects run both files.
begin;
alter table public.profiles add column avatar_path text;
alter table public.profiles add column banner_path text;
alter table public.profiles add column frame text not null default 'none' check (frame in ('none','aurora','solar','neon','founder'));
alter table public.profiles add constraint own_avatar_path check (avatar_path is null or avatar_path like id::text || '/%');
alter table public.profiles add constraint own_banner_path check (banner_path is null or banner_path like id::text || '/%');

create table public.company_accounts (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 claimed_at timestamptz not null default now()
);
create table public.verification_campaigns (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null unique references public.posts(id) on delete cascade,
 starts_at timestamptz not null default now(), ends_at timestamptz not null,
 active boolean not null default true, check (ends_at > starts_at)
);
create table public.verification_grants (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 campaign_id uuid references public.verification_campaigns(id) on delete set null,
 awarded_at timestamptz not null default now()
 -- No expiry: deleting a like or ending/removing a campaign never removes this grant.
);
alter table public.company_accounts enable row level security;
alter table public.verification_campaigns enable row level security;
alter table public.verification_grants enable row level security;
create policy company_read on public.company_accounts for select to authenticated using (true);
create policy campaigns_read on public.verification_campaigns for select to authenticated using (true);
create policy grants_read on public.verification_grants for select to authenticated using (true);
revoke all on public.company_accounts,public.verification_campaigns,public.verification_grants from anon,authenticated;
grant select on public.company_accounts,public.verification_campaigns,public.verification_grants to authenticated;

create function public.claim_company_account() returns boolean
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid();
begin
 if caller is null or not exists(select 1 from auth.users u where u.id = caller and lower(u.email) = 'tbttthb@gmail.com' and u.email_confirmed_at is not null) then return false; end if;
 -- The email is evaluated on the authenticated server record, never user_metadata.
 insert into public.company_accounts(user_id) values(caller) on conflict do nothing;
 update public.profiles set username = 'zolnu', name = 'ZOLNU', bio = 'حساب الشركة الرسمي · كل لحظة، إلها مكان.' where id = caller and username <> 'zolnu';
 return true;
end; $$;
revoke all on function public.claim_company_account() from public,anon;
grant execute on function public.claim_company_account() to authenticated;

create function public.guard_profile_rewards() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if new.username = 'zolnu' and not exists(select 1 from public.company_accounts c where c.user_id = new.id) then raise exception 'اسم الشركة محجوز'; end if;
 if new.frame = 'founder' and not exists(select 1 from public.verification_grants g where g.user_id = new.id) and not exists(select 1 from public.company_accounts c where c.user_id = new.id) then raise exception 'إطار المؤسس يحتاج شارة المؤسس'; end if;
 return new;
end; $$;
revoke all on function public.guard_profile_rewards() from public,anon,authenticated;
create trigger guard_profile_rewards before insert or update on public.profiles for each row execute function public.guard_profile_rewards();

create function public.start_verification_campaign(p_post_id uuid,p_hours integer default 48) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
 if not exists(select 1 from public.company_accounts c where c.user_id = auth.uid()) then raise exception 'لوحة الشركة فقط'; end if;
 if not exists(select 1 from public.posts p where p.id = p_post_id and p.user_id = auth.uid()) then raise exception 'اختار منشورًا من حساب الشركة'; end if;
 if p_hours is null or p_hours < 1 or p_hours > 720 then raise exception 'المدة من ساعة إلى ٧٢٠ ساعة'; end if;
 insert into public.verification_campaigns(post_id,starts_at,ends_at,active) values(p_post_id,clock_timestamp(),clock_timestamp()+make_interval(hours=>p_hours),true)
 on conflict(post_id) do update set starts_at = excluded.starts_at, ends_at = excluded.ends_at, active = true returning id into result;
 return result;
end; $$;
create function public.stop_verification_campaign(p_campaign_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not exists(select 1 from public.company_accounts c where c.user_id = auth.uid()) then raise exception 'لوحة الشركة فقط'; end if;
 update public.verification_campaigns c set active = false where c.id = p_campaign_id and exists(select 1 from public.posts p where p.id = c.post_id and p.user_id = auth.uid());
end; $$;
revoke all on function public.start_verification_campaign(uuid,integer),public.stop_verification_campaign(uuid) from public,anon;
grant execute on function public.start_verification_campaign(uuid,integer),public.stop_verification_campaign(uuid) to authenticated;

create function public.award_founder_on_like() returns trigger
language plpgsql security definer set search_path = '' as $$
declare source_id uuid;
begin
 select c.id into source_id from public.verification_campaigns c join public.posts p on p.id = c.post_id join public.company_accounts a on a.user_id = p.user_id
 where c.post_id = new.post_id and c.active and c.starts_at <= clock_timestamp() and c.ends_at > clock_timestamp()
 for share of c;
 if source_id is not null then insert into public.verification_grants(user_id,campaign_id) values(new.user_id,source_id) on conflict(user_id) do nothing; end if;
 return new;
end; $$;
revoke all on function public.award_founder_on_like() from public,anon,authenticated;
create trigger award_founder_on_like after insert on public.likes for each row execute function public.award_founder_on_like();
commit;
