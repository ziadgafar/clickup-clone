-- Run after schema.sql. Personal access tokens for the Claude MCP endpoint (/api/mcp).

create table api_tokens (
  user_id uuid primary key references profiles on delete cascade,
  token_hash text unique not null,
  created_at timestamptz default now()
);

-- RLS on, no policies: only the server (service role) reads this table.
alter table api_tokens enable row level security;

-- Issues a new token for the caller (replacing any old one) and returns it once.
create function create_api_token() returns text
language plpgsql security definer set search_path = public as $$
declare tok text := 'psd_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  insert into api_tokens (user_id, token_hash)
  values (auth.uid(), encode(sha256(convert_to(tok, 'UTF8')), 'hex'))
  on conflict (user_id) do update set token_hash = excluded.token_hash, created_at = now();
  return tok;
end $$;

create function revoke_api_token() returns void
language sql security definer set search_path = public as $$
  delete from api_tokens where user_id = auth.uid();
$$;

revoke execute on function create_api_token() from public, anon;
revoke execute on function revoke_api_token() from public, anon;

-- Guard values that now also arrive from Claude, not just the UI dropdowns.
alter table tasks add constraint tasks_status_check
  check (status in ('todo', 'in_progress', 'blocked', 'review', 'done'));
alter table tasks add constraint tasks_priority_check
  check (priority in ('low', 'medium', 'high'));
