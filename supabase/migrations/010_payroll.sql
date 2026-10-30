-- 010 — Payroll runs, payslip lines and statutory contributions

create table if not exists public.payroll_runs (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  period         text not null check (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  status         payroll_status not null default 'draft',
  headcount      integer not null default 0,
  gross_total    numeric(14, 2) not null default 0,
  deductions_total numeric(14, 2) not null default 0,
  net_total      numeric(14, 2) not null default 0,
  gosi_employer_total numeric(12, 2) not null default 0,
  gosi_employee_total numeric(12, 2) not null default 0,
  currency       char(3) not null default 'SAR',
  paid_at        timestamptz,
  approved_by    uuid references public.profiles (id) on delete set null,
  approved_at    timestamptz,
  wps_file_url   text,
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now()),
  unique (org_id, period)
);

create index if not exists payroll_runs_org_period_idx on public.payroll_runs (org_id, period desc);

create trigger payroll_runs_touch before update on public.payroll_runs
  for each row execute function public.tg_touch_updated_at();

create trigger payroll_runs_audit after insert or update or delete on public.payroll_runs
  for each row execute function public.tg_audit_row();

create table if not exists public.payslips (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations (id) on delete cascade,
  run_id             uuid not null references public.payroll_runs (id) on delete cascade,
  employee_id        uuid not null references public.employees (id) on delete cascade,
  base_salary        numeric(12, 2) not null default 0,
  housing_allowance  numeric(12, 2) not null default 0,
  transport_allowance numeric(12, 2) not null default 0,
  other_allowances   numeric(12, 2) not null default 0,
  overtime           numeric(10, 2) not null default 0,
  bonuses            numeric(10, 2) not null default 0,
  deductions         numeric(10, 2) not null default 0,
  gosi_employee      numeric(10, 2) not null default 0,
  gosi_employer      numeric(10, 2) not null default 0,
  gross              numeric(12, 2) not null default 0,
  net                numeric(12, 2) not null default 0,
  currency           char(3) not null default 'SAR',
  days_worked        smallint not null default 30,
  pdf_url            text,
  created_at         timestamptz not null default timezone('utc', now()),
  unique (run_id, employee_id)
);

create index if not exists payslips_employee_idx on public.payslips (employee_id, created_at desc);
create index if not exists payslips_run_idx on public.payslips (run_id);

create table if not exists public.payroll_adjustments (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  employee_id  uuid not null references public.employees (id) on delete cascade,
  period       text not null,
  kind         text not null check (kind in ('bonus', 'deduction', 'overtime', 'reimbursement', 'gosi_correction')),
  amount       numeric(12, 2) not null,
  reason       text,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default timezone('utc', now())
);

create index if not exists payroll_adjustments_period_idx on public.payroll_adjustments (org_id, period);

-- Wages Protection System submissions.
create table if not exists public.wps_submissions (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  run_id       uuid not null references public.payroll_runs (id) on delete cascade,
  bank         text not null,
  file_url     text,
  total_amount numeric(14, 2) not null default 0,
  status       text not null default 'generated' check (status in ('generated', 'submitted', 'accepted', 'rejected')),
  submitted_at timestamptz,
  response     jsonb,
  created_at   timestamptz not null default timezone('utc', now())
);
