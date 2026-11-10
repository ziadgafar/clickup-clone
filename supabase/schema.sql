-- Run once in Supabase SQL editor (or `psql $DATABASE_URL -f supabase/schema.sql`).
-- Small trusted team: any signed-in user can read/write work data; profile edits and user deletion are guarded.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'manager', 'member')),
  profile_picture text,
  created_at timestamptz default now()
);

create table clients (
  id serial primary key,
  name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  industry text not null,
  logo text,
  created_at timestamptz default now()
);

create table projects (
  id serial primary key,
  client_id int references clients on delete set null,
  owner_id uuid not null references profiles,
  name text not null,
  description text,
  start_date date not null,
  end_date date,
  status text not null,
  priority text not null,
  type text not null,
  created_at timestamptz default now()
);

create table project_members (
  project_id int not null references projects on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role text not null,
  joined_at timestamptz default now(),
  primary key (project_id, user_id)
);

create table tasks (
  id serial primary key,
  project_id int not null references projects on delete cascade,
  title text not null,
  description text,
  due_date date,
  status text not null,
  priority text not null,
  assigned_to uuid references profiles on delete set null,
  created_by uuid references profiles on delete set null,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table tags (
  id serial primary key,
  name text unique not null
);

create table task_tags (
  task_id int not null references tasks on delete cascade,
  tag_id int not null references tags on delete cascade,
  primary key (task_id, tag_id)
);

create table comments (
  id serial primary key,
  task_id int not null references tasks on delete cascade,
  user_id uuid references profiles on delete set null default auth.uid(),
  content text not null,
  created_at timestamptz default now()
);

create table attachments (
  id serial primary key,
  file_name text not null,
  file_path text not null,
  task_id int not null references tasks on delete cascade,
  uploaded_by uuid references profiles on delete set null,
  created_at timestamptz default now()
);

-- Profile auto-created on signup. Role from signup form, but never 'admin' (promote via SQL).
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    case when new.raw_user_meta_data->>'role' = 'manager' then 'manager' else 'member' end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create function sync_user_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function sync_user_email();

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Only admins may change roles or emails directly (own email syncs from auth via trigger above).
create function guard_profile_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and not is_admin()
     and (new.role <> old.role or new.email <> old.email) then
    raise exception 'Only admins can change role or email';
  end if;
  return new;
end $$;

create trigger guard_profile_update before update on profiles
  for each row execute function guard_profile_update();

-- Admin-only: delete a user entirely (auth row cascades to profile).
create function delete_user(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only admins can delete users'; end if;
  delete from auth.users where id = uid;
end $$;

revoke execute on function delete_user(uuid) from public, anon;

-- RLS
alter table profiles enable row level security;
create policy "read profiles" on profiles for select to authenticated using (true);
create policy "update own profile or admin" on profiles for update to authenticated
  using (id = auth.uid() or is_admin());

do $$
declare t text;
begin
  foreach t in array array['clients','projects','project_members','tasks','tags','task_tags','comments','attachments'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "team access" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Comments: only author or admin may delete/edit.
drop policy "team access" on comments;
create policy "read comments" on comments for select to authenticated using (true);
create policy "add comments" on comments for insert to authenticated with check (user_id = auth.uid());
create policy "edit own comments" on comments for update to authenticated using (user_id = auth.uid() or is_admin());
create policy "delete own comments" on comments for delete to authenticated using (user_id = auth.uid() or is_admin());

insert into tags (name) values ('bug'), ('feature'), ('urgent'), ('backend'), ('frontend');
