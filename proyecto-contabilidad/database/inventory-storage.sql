-- Create the Storage bucket for inventory images and set policies
-- Run this in Supabase SQL editor

-- 1) Create bucket (public read)
-- Idempotent: will do nothing if the bucket already exists
insert into storage.buckets (id, name, public)
values ('inventory-files', 'inventory-files', true)
on conflict (id) do nothing;

-- 2) Policies for the bucket
-- Allow public read (so thumbnails can be displayed without signed URLs)
drop policy if exists "Public read for inventory-files" on storage.objects;
create policy "Public read for inventory-files"
  on storage.objects for select
  using (bucket_id = 'inventory-files');

-- Allow authenticated users to upload (insert)
drop policy if exists "Authenticated upload to inventory-files" on storage.objects;
create policy "Authenticated upload to inventory-files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'inventory-files');

-- Allow owners to update their own files in this bucket
drop policy if exists "Owner update inventory-files" on storage.objects;
create policy "Owner update inventory-files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'inventory-files' and auth.uid() = owner)
  with check (bucket_id = 'inventory-files' and auth.uid() = owner);

-- Allow owners to delete their own files in this bucket
drop policy if exists "Owner delete inventory-files" on storage.objects;
create policy "Owner delete inventory-files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'inventory-files' and auth.uid() = owner);
