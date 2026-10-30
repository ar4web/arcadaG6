-- 021 — Storage buckets and policies
-- Five buckets: employee documents, avatars, receipts, contracts, exports.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('employee-documents', 'employee-documents', false, 26214400, array['application/pdf','image/png','image/jpeg','image/webp']),
  ('avatars',            'avatars',            true,  5242880,   array['image/png','image/jpeg','image/webp']),
  ('receipts',           'receipts',           false, 10485760,  array['application/pdf','image/png','image/jpeg']),
  ('contracts',          'contracts',          false, 52428800,  array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('exports',            'exports',            false, 104857600, null)
on conflict (id) do nothing;

-- Path convention: <org_id>/<employee_id>/<filename>
create or replace function public.storage_org_id(object_name text)
returns uuid
language plpgsql
immutable
as $$
begin
  return nullif(split_part(object_name, '/', 1), '')::uuid;
exception when others then
  return null;
end;
$$;

drop policy if exists storage_read_own_bucket on storage.objects;
create policy storage_read_own_bucket on storage.objects
  for select using (
    bucket_id in ('employee-documents', 'receipts', 'contracts', 'exports', 'avatars')
    and (
      bucket_id = 'avatars'
      or public.storage_org_id(name) = public.current_org_id()
    )
  );

drop policy if exists storage_write_org on storage.objects;
create policy storage_write_org on storage.objects
  for insert with check (
    bucket_id in ('employee-documents', 'receipts', 'contracts', 'exports', 'avatars')
    and (
      bucket_id = 'avatars'
      or public.storage_org_id(name) = public.current_org_id()
    )
  );

drop policy if exists storage_update_org on storage.objects;
create policy storage_update_org on storage.objects
  for update using (
    bucket_id in ('employee-documents', 'receipts', 'contracts', 'exports', 'avatars')
    and (bucket_id = 'avatars' or public.storage_org_id(name) = public.current_org_id())
  );

drop policy if exists storage_delete_admin on storage.objects;
create policy storage_delete_admin on storage.objects
  for delete using (
    bucket_id in ('employee-documents', 'receipts', 'contracts', 'exports', 'avatars')
    and (bucket_id = 'avatars' or public.storage_org_id(name) = public.current_org_id())
    and public.has_role('admin', 'hr_manager')
  );
