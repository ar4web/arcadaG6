-- 016 — Notifications, preferences and in-app chat

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  user_id     uuid references public.profiles (id) on delete cascade,
  employee_id uuid references public.employees (id) on delete cascade,
  kind        text not null default 'info' check (kind in ('info', 'success', 'warning', 'danger', 'approval', 'mention', 'system')),
  title       text not null,
  body        text,
  href        text,
  channel     notification_channel not null default 'in_app',
  read_at     timestamptz,
  acted_at    timestamptz,
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;

create table if not exists public.notification_preferences (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade unique,
  email_digest boolean not null default true,
  leave_updates boolean not null default true,
  payroll_ready boolean not null default true,
  compliance_alerts boolean not null default true,
  whatsapp    boolean not null default false
);

create table if not exists public.chat_threads (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  kind        text not null default 'direct' check (kind in ('direct', 'group', 'announcement')),
  title       text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz
);

create table if not exists public.chat_participants (
  thread_id   uuid not null references public.chat_threads (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  joined_at   timestamptz not null default timezone('utc', now()),
  last_read_at timestamptz,
  primary key (thread_id, user_id)
);

create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.chat_threads (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  attachment_url text,
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists chat_messages_thread_idx on public.chat_messages (thread_id, created_at desc);

create or replace function public.tg_chat_touch_thread()
returns trigger
language plpgsql
as $$
begin
  update public.chat_threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end;
$$;

create trigger chat_messages_touch_thread after insert on public.chat_messages
  for each row execute function public.tg_chat_touch_thread();
