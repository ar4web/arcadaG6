-- 008 — Leave types, balances and requests

create table if not exists public.leave_types (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations (id) on delete cascade,
  code              text not null,
  name              text not null,
  name_ar           text,
  paid              boolean not null default true,
  accrues           boolean not null default true,
  default_days      smallint not null default 0,
  max_carry_over    smallint not null default 0,
  requires_document boolean not null default false,
  color             text not null default '#5f7d52',
  sort_order        smallint not null default 0,
  unique (org_id, code)
);

create table if not exists public.leave_balances (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  employee_id    uuid not null references public.employees (id) on delete cascade,
  leave_type_id  uuid not null references public.leave_types (id) on delete cascade,
  year           smallint not null,
  entitlement    numeric(5, 1) not null default 0,
  carried_over   numeric(5, 1) not null default 0,
  taken          numeric(5, 1) not null default 0,
  pending        numeric(5, 1) not null default 0,
  updated_at     timestamptz not null default timezone('utc', now()),
  unique (employee_id, leave_type_id, year),
  constraint leave_balance_non_negative check (entitlement >= 0 and carried_over >= 0 and taken >= 0)
);

create index if not exists leave_balances_employee_idx on public.leave_balances (employee_id, year);

create trigger leave_balances_touch before update on public.leave_balances
  for each row execute function public.tg_touch_updated_at();

create table if not exists public.leave_requests (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  employee_id    uuid not null references public.employees (id) on delete cascade,
  leave_type_id  uuid not null references public.leave_types (id) on delete restrict,
  start_date     date not null,
  end_date       date not null,
  working_days   numeric(4, 1) not null,
  half_day       boolean not null default false,
  reason         text,
  status         leave_request_status not null default 'pending',
  approver_id    uuid references public.employees (id) on delete set null,
  decided_at     timestamptz,
  decision_note  text,
  attachment_url text,
  submitted_at   timestamptz not null default timezone('utc', now()),
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now()),
  created_by     uuid references auth.users (id) on delete set null,
  constraint leave_dates_ordered check (end_date >= start_date),
  constraint leave_days_positive check (working_days > 0)
);

create index if not exists leave_requests_employee_idx on public.leave_requests (employee_id, start_date desc);
create index if not exists leave_requests_status_idx on public.leave_requests (org_id, status, start_date);
create index if not exists leave_requests_approver_idx on public.leave_requests (approver_id, status);

create trigger leave_requests_touch before update on public.leave_requests
  for each row execute function public.tg_touch_updated_at();

create trigger leave_requests_audit after insert or update or delete on public.leave_requests
  for each row execute function public.tg_audit_row();

-- Keep balances in step with request transitions.
create or replace function public.tg_leave_request_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year smallint := extract(year from new.start_date)::smallint;
  v_balance uuid;
begin
  select id into v_balance from public.leave_balances
   where employee_id = new.employee_id and leave_type_id = new.leave_type_id and year = v_year;

  if v_balance is null then
    insert into public.leave_balances (org_id, employee_id, leave_type_id, year, entitlement)
    values (new.org_id, new.employee_id, new.leave_type_id, v_year, 0)
    returning id into v_balance;
  end if;

  if tg_op = 'UPDATE' and old.status = 'pending' then
    update public.leave_balances set pending = greatest(0, pending - old.working_days) where id = v_balance;
  end if;

  if new.status = 'pending' then
    update public.leave_balances set pending = pending + new.working_days where id = v_balance;
  elsif new.status = 'approved' then
    update public.leave_balances set taken = taken + new.working_days where id = v_balance;
  end if;

  return new;
end;
$$;

create trigger leave_requests_balance after insert or update of status on public.leave_requests
  for each row execute function public.tg_leave_request_balance();
