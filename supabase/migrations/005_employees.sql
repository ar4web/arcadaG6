-- 005 — Employee master record

create table if not exists public.employees (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations (id) on delete cascade,
  employee_no        text not null,
  first_name         text not null,
  last_name          text not null,
  name_ar            text,
  preferred_name     text,
  email              citext not null,
  personal_email     citext,
  phone              text,
  avatar_url         text,
  gender             text check (gender in ('male', 'female')),
  birth_date         date,
  nationality        text,
  national_id        text,
  iqama_no           text,
  gosi_no            text,
  job_title          text not null,
  job_title_ar       text,
  job_grade          text,
  department_id      uuid references public.departments (id) on delete set null,
  manager_id         uuid references public.employees (id) on delete set null,
  location_id        uuid references public.locations (id) on delete set null,
  employment_type    employment_type not null default 'full_time',
  work_mode          work_mode not null default 'onsite',
  status             employee_status not null default 'active',
  hire_date          date not null,
  probation_end_date date,
  contract_end_date  date,
  termination_date   date,
  termination_reason text,
  annual_leave_days  smallint not null default 30,
  base_salary        numeric(12, 2) not null default 0 check (base_salary >= 0),
  housing_allowance  numeric(12, 2) not null default 0 check (housing_allowance >= 0),
  transport_allowance numeric(12, 2) not null default 0 check (transport_allowance >= 0),
  other_allowances   numeric(12, 2) not null default 0 check (other_allowances >= 0),
  currency           char(3) not null default 'SAR',
  iban               text check (iban is null or iban ~ '^SA[0-9]{22}$'),
  bank_name          text,
  engagement_score   numeric(3, 1) check (engagement_score between 0 and 10),
  flight_risk        text check (flight_risk in ('low', 'medium', 'high')),
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default timezone('utc', now()),
  updated_at         timestamptz not null default timezone('utc', now()),
  created_by         uuid references auth.users (id) on delete set null,
  unique (org_id, employee_no),
  unique (org_id, email),
  constraint employees_manager_not_self check (manager_id is null or manager_id <> id)
);

create index if not exists employees_org_status_idx on public.employees (org_id, status);
create index if not exists employees_department_idx on public.employees (org_id, department_id);
create index if not exists employees_manager_idx on public.employees (manager_id);
create index if not exists employees_hire_idx on public.employees (org_id, hire_date desc);
-- Trigram search powers the ⌘K palette and the people table.
create index if not exists employees_search_idx on public.employees using gin (
  (first_name || ' ' || last_name || ' ' || coalesce(name_ar, '') || ' ' || job_title) gin_trgm_ops
);

create trigger employees_touch before update on public.employees
  for each row execute function public.tg_touch_updated_at();

-- Department heads are employees; wire the FK now that employees exist.
alter table public.departments
  drop constraint if exists departments_head_fk;
alter table public.departments
  add constraint departments_head_fk foreign key (head_id) references public.employees (id) on delete set null;

-- Full-text/derived view used by the people directory.
create or replace view public.employee_directory as
select
  e.id,
  e.org_id,
  e.employee_no,
  e.first_name || ' ' || e.last_name as full_name,
  coalesce(e.name_ar, e.first_name || ' ' || e.last_name) as full_name_ar,
  e.email,
  e.job_title,
  e.status,
  e.hire_date,
  e.department_id,
  d.name as department_name,
  e.manager_id,
  m.first_name || ' ' || m.last_name as manager_name,
  e.location_id,
  l.name as location_name,
  e.base_salary + e.housing_allowance + e.transport_allowance + e.other_allowances as gross_salary
from public.employees e
left join public.departments d on d.id = e.department_id
left join public.employees m on m.id = e.manager_id
left join public.locations l on l.id = e.location_id;
