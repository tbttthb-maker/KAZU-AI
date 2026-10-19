-- Authentic account review is independent from promotional founder rewards.
begin;
create table public.verification_requests (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 evidence_url text not null check (evidence_url ~ '^https://[^[:space:]]+$' and length(evidence_url) <= 1000),
 explanation text not null check (length(explanation) between 20 and 2000),
 status text not null default 'pending' check (status in ('pending','approved','rejected','revoked')),
 requested_at timestamptz not null default now(),
 reviewed_at timestamptz, reviewer_id uuid references public.profiles(id) on delete set null,
 review_note text not null default ''
);
create table public.account_verifications (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 reviewer_id uuid references public.profiles(id) on delete set null,
 verified_at timestamptz not null default now(),
 active boolean not null default true
);
alter table public.verification_requests enable row level security;
alter table public.account_verifications enable row level security;
revoke all on public.verification_requests,public.account_verifications from anon,authenticated;
grant select on public.verification_requests,public.account_verifications to authenticated;
create policy own_or_reviewer on public.verification_requests for select to authenticated using (user_id=auth.uid() or exists(select 1 from public.company_accounts c where c.user_id=auth.uid()));
create policy public_badge on public.account_verifications for select to authenticated using (active);
create function public.request_account_verification(p_url text,p_explanation text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'أكد بريدك الإلكتروني أولًا'; end if;
 if exists(select 1 from public.account_verifications where user_id=auth.uid() and active) then raise exception 'حسابك موثّق بالفعل'; end if;
 if exists(select 1 from public.verification_requests where user_id=auth.uid() and status='pending') then raise exception 'طلبك قيد المراجعة'; end if;
 insert into public.verification_requests(user_id,evidence_url,explanation) values(auth.uid(),trim(p_url),trim(p_explanation))
 on conflict(user_id) do update set evidence_url=excluded.evidence_url,explanation=excluded.explanation,status='pending',requested_at=clock_timestamp(),reviewed_at=null,reviewer_id=null,review_note='';
end; $$;
create function public.review_account_verification(p_user_id uuid,p_approve boolean,p_note text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.company_accounts where user_id=auth.uid()) then raise exception 'مراجعة الطلبات لإدارة الشركة فقط'; end if;
 if p_user_id=auth.uid() then raise exception 'لا يمكن اعتماد توثيق حسابك بنفسك'; end if;
 if p_note is null or length(trim(p_note)) < 10 then raise exception 'اكتب نتيجة التحقق وأسباب القرار'; end if;
 perform 1 from public.verification_requests where user_id=p_user_id and status='pending' for update;
 if not found then raise exception 'الطلب غير متاح للمراجعة'; end if;
 update public.verification_requests set status=case when p_approve then 'approved' else 'rejected' end,reviewer_id=auth.uid(),reviewed_at=clock_timestamp(),review_note=trim(p_note) where user_id=p_user_id;
 if p_approve then insert into public.account_verifications(user_id,reviewer_id) values(p_user_id,auth.uid()) on conflict(user_id) do update set active=true,reviewer_id=auth.uid(),verified_at=clock_timestamp();
 else update public.account_verifications set active=false where user_id=p_user_id; end if;
end; $$;
create function public.revoke_verification_on_identity_change() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.username is distinct from old.username or new.name is distinct from old.name or new.avatar_path is distinct from old.avatar_path then
 update public.account_verifications set active=false where user_id=new.id;
 update public.verification_requests set status='revoked',review_note='تغيّرت بيانات تعريف الحساب؛ يلزم طلب مراجعة جديد' where user_id=new.id and status='approved';
 end if;
 return new;
end; $$;
create trigger revoke_identity_badge before update on public.profiles for each row execute function public.revoke_verification_on_identity_change();
revoke all on function public.request_account_verification(text,text),public.review_account_verification(uuid,boolean,text),public.revoke_verification_on_identity_change() from public,anon,authenticated;
grant execute on function public.request_account_verification(text,text),public.review_account_verification(uuid,boolean,text) to authenticated;
commit;
