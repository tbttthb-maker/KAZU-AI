-- Revoked/deleted accounts must not upload with a still-unexpired access JWT.
alter policy media_insert on storage.objects with check (bucket_id='media' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.profiles where id=(select auth.uid())));
alter policy media_select on storage.objects using (bucket_id='media' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.profiles where id=(select auth.uid())));
alter policy media_delete on storage.objects using (bucket_id='media' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.profiles where id=(select auth.uid())));
