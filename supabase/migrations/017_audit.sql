-- 017 — Audit trail

create table if not exists public.audit_events (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organizations (id) on delete cascade,
  actor_id    uuid references auth.users (id) on delete set null,
  actor_email citext,
  action      text not null,
  entity      text not null,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists audit_events_org_created_idx on public.audit_events (org_id, created_at desc);
create index if not exists audit_events_entity_idx on public.audit_events (entity, entity_id);
create index if not exists audit_events_actor_idx on public.audit_events (actor_id, created_at desc);

-- Audit rows are append-only: block updates and deletes for everyone.
create or replace function public.tg_audit_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events is append-only';
end;
$$;

create trigger audit_events_immutable before update or delete on public.audit_events
  for each row execute function public.tg_audit_immutable();

create table if not exists public.sessions_log (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organizations (id) on delete cascade,
  user_id     uuid references public.profiles (id) on delete set null,
  event       text not null check (event in ('sign_in', 'sign_out', 'mfa_challenge', 'failed_attempt', 'password_reset')),
  provider    text,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists sessions_log_user_idx on public.sessions_log (user_id, created_at desc);
