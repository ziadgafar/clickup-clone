-- Run after 003. New sign-ups wait for an admin to approve them before they can see or change anything.

alter table profiles add column approved boolean not null default false;
update profiles set approved = true;  -- everyone who already signed up stays in

create function is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and approved);
$$;

-- Only admins may approve, change roles, or change emails directly.
create or replace function guard_profile_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and not is_admin()
     and (new.role <> old.role or new.email <> old.email or new.approved <> old.approved) then
    raise exception 'Only admins can change role, email, or approval';
  end if;
  return new;
end $$;

-- Profiles: pending users can only see themselves (so the app can show "waiting for approval").
drop policy "read profiles" on profiles;
create policy "read profiles" on profiles for select to authenticated
  using (id = auth.uid() or is_approved());

-- Work tables: approved users only.
do $$
declare t text;
begin
  foreach t in array array['clients','projects','project_members','tasks','tags','task_tags','attachments'] loop
    execute format('drop policy "team access" on %I', t);
    execute format('create policy "team access" on %I for all to authenticated using (is_approved()) with check (is_approved())', t);
  end loop;
end $$;

drop policy "read comments" on comments;
drop policy "add comments" on comments;
create policy "read comments" on comments for select to authenticated using (is_approved());
create policy "add comments" on comments for insert to authenticated with check (is_approved() and user_id = auth.uid());

-- Claude tokens: approved users only.
create or replace function create_api_token() returns text
language plpgsql security definer set search_path = public as $$
declare tok text := 'psd_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  if not is_approved() then raise exception 'Your account is waiting for admin approval'; end if;
  insert into api_tokens (user_id, token_hash)
  values (auth.uid(), encode(sha256(convert_to(tok, 'UTF8')), 'hex'))
  on conflict (user_id) do update set token_hash = excluded.token_hash, created_at = now();
  return tok;
end $$;
