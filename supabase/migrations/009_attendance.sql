-- 009 — Attendance, shifts and timesheets

create table if not exists public.shifts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null,
  starts_at   time not null default '09:00',
  ends_at     time not null default '18:00',
  grace_minutes smallint not null default 10,
  work_days   smallint[] not null default '{0,1,2,3,4}',
  is_default  boolean not null default false
);

create table if not exists public.attendance_records (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  employee_id    uuid not null references public.employees (id) on delete cascade,
  work_date      date not null,
  check_in       timestamptz,
  check_out      timestamptz,
  status         attendance_status not null default 'present',
  minutes_late   smallint not null default 0,
  hours_worked   numeric(5, 2) not null default 0,
  overtime_hours numeric(4, 2) not null default 0,
  source         text not null default 'web' check (source in ('web', 'mobile', 'biometric', 'import', 'manual')),
  location_id    uuid references public.locations (id) on delete set null,
  note           text,
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now()),
  unique (employee_id, work_date)
);

create index if not exists attendance_org_date_idx on public.attendance_records (org_id, work_date desc);
create index if not exists attendance_employee_idx on public.attendance_records (employee_id, work_date desc);
create index if not exists attendance_status_idx on public.attendance_records (org_id, status, work_date);

create trigger attendance_touch before update on public.attendance_records
  for each row execute function public.tg_touch_updated_at();

create table if not exists public.timesheets (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  employee_id   uuid not null references public.employees (id) on delete cascade,
  week_start    date not null,
  total_hours   numeric(5, 2) not null default 0,
  billable_hours numeric(5, 2) not null default 0,
  status        text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  approved_by   uuid references public.employees (id) on delete set null,
  approved_at   timestamptz,
  created_at    timestamptz not null default timezone('utc', now()),
  unique (employee_id, week_start)
);

create index if not exists timesheets_org_week_idx on public.timesheets (org_id, week_start desc);
