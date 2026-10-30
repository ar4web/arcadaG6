-- 006 — Auth profiles, roles and permission overrides
-- One profile per auth.users row; role assignment is separate so a user can
-- hold several roles (e.g. hr_manager + recruiter).

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  org_id        uuid not null references public.organizations (id) on delete cascade,
  employee_id   uuid references public.employees (id) on delete set null,
  full_name     text,
  avatar_url    text,
  locale        text not null default 'en' check (locale in ('en', 'ar')),
  theme         text not null default 'system' check (theme in ('light', 'dark', 'system')),
  mfa_enabled   boolean not null default false,
  phone         text,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_org_idx on public.profiles (org_id);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.tg_touch_updated_at();

create table if not exists public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        app_role not null,
  granted_by  uuid references public.profiles (id) on delete set null,
  granted_at  timestamptz not null default timezone('utc', now()),
  unique (user_id, role)
);

create index if not exists user_roles_user_idx on public.user_roles (user_id);
create index if not exists user_roles_role_idx on public.user_roles (role);

-- Fine-grained grants layered on top of the role defaults.
create table if not exists public.permissions (
  key         text primary key,
  description text not null,
  module      text not null
);

create table if not exists public.role_permissions (
  role        app_role not null,
  permission  text not null references public.permissions (key) on delete cascade,
  primary key (role, permission)
);

insert into public.permissions (key, description, module) values
  ('employees.read',      'View employee records',              'people'),
  ('employees.write',     'Create and edit employee records',    'people'),
  ('employees.salary',    'View compensation data',              'people'),
  ('leave.read',          'View leave requests',                 'leave'),
  ('leave.approve',       'Approve or reject leave',             'leave'),
  ('attendance.read',     'View attendance',                     'attendance'),
  ('attendance.manage',   'Correct attendance records',          'attendance'),
  ('payroll.read',        'View payroll runs and payslips',      'payroll'),
  ('payroll.run',         'Create, approve and pay payroll',     'payroll'),
  ('expenses.read',       'View expense claims',                 'expenses'),
  ('expenses.approve',    'Approve expense claims',              'expenses'),
  ('invoices.read',       'View invoices',                       'finance'),
  ('invoices.write',      'Issue and void invoices',             'finance'),
  ('recruitment.read',    'View pipeline',                       'recruitment'),
  ('recruitment.write',   'Move candidates through the pipeline','recruitment'),
  ('performance.read',    'View goals and reviews',              'performance'),
  ('performance.write',   'Write reviews and calibrate',         'performance'),
  ('compliance.read',     'View compliance watchlist',           'compliance'),
  ('documents.read',      'View documents',                      'documents'),
  ('documents.write',     'Upload and archive documents',        'documents'),
  ('settings.write',      'Change workspace settings',           'settings'),
  ('audit.read',          'Read the audit trail',                'audit')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission) values
  ('admin', 'employees.read'), ('admin', 'employees.write'), ('admin', 'employees.salary'),
  ('admin', 'leave.read'), ('admin', 'leave.approve'), ('admin', 'attendance.read'), ('admin', 'attendance.manage'),
  ('admin', 'payroll.read'), ('admin', 'payroll.run'), ('admin', 'expenses.read'), ('admin', 'expenses.approve'),
  ('admin', 'invoices.read'), ('admin', 'invoices.write'), ('admin', 'recruitment.read'), ('admin', 'recruitment.write'),
  ('admin', 'performance.read'), ('admin', 'performance.write'), ('admin', 'compliance.read'),
  ('admin', 'documents.read'), ('admin', 'documents.write'), ('admin', 'settings.write'), ('admin', 'audit.read'),
  ('hr_manager', 'employees.read'), ('hr_manager', 'employees.write'), ('hr_manager', 'employees.salary'),
  ('hr_manager', 'leave.read'), ('hr_manager', 'leave.approve'), ('hr_manager', 'attendance.read'),
  ('hr_manager', 'attendance.manage'), ('hr_manager', 'payroll.read'), ('hr_manager', 'recruitment.read'),
  ('hr_manager', 'recruitment.write'), ('hr_manager', 'performance.read'), ('hr_manager', 'performance.write'),
  ('hr_manager', 'compliance.read'), ('hr_manager', 'documents.read'), ('hr_manager', 'documents.write'),
  ('hr_manager', 'settings.write'), ('hr_manager', 'audit.read'),
  ('recruiter', 'employees.read'), ('recruiter', 'recruitment.read'), ('recruiter', 'recruitment.write'),
  ('recruiter', 'documents.read'),
  ('manager', 'employees.read'), ('manager', 'leave.read'), ('manager', 'leave.approve'),
  ('manager', 'attendance.read'), ('manager', 'performance.read'), ('manager', 'performance.write'),
  ('manager', 'expenses.approve'), ('manager', 'documents.read'),
  ('finance', 'employees.read'), ('finance', 'employees.salary'), ('finance', 'payroll.read'),
  ('finance', 'payroll.run'), ('finance', 'expenses.read'), ('finance', 'expenses.approve'),
  ('finance', 'invoices.read'), ('finance', 'invoices.write'), ('finance', 'compliance.read'),
  ('finance', 'documents.read'), ('finance', 'audit.read'), ('finance', 'attendance.read'),
  ('employee', 'leave.read'), ('employee', 'attendance.read'), ('employee', 'documents.read'),
  ('employee', 'performance.read')
on conflict do nothing;

-- Convenience view: role + permission set per user.
create or replace view public.user_permissions as
select ur.user_id, ur.role, rp.permission
from public.user_roles ur
join public.role_permissions rp on rp.role = ur.role;
