-- 003 — Organizations (tenants) and workspace settings

create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  name_ar       text,
  slug          citext not null unique,
  legal_name    text,
  vat_number    text check (vat_number is null or vat_number ~ '^3[0-9]{14}$'),
  cr_number     text,
  gosi_number   text,
  currency      char(3) not null default 'SAR',
  timezone      text not null default 'Asia/Riyadh',
  locale        text not null default 'en' check (locale in ('en', 'ar')),
  workweek      text not null default 'sun-thu' check (workweek in ('sun-thu', 'mon-fri')),
  logo_url      text,
  brand_primary text default '#b95f2d',
  modules       jsonb not null default '{"gosi": true, "wps": true, "zatca": true, "pdpl": true}'::jsonb,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now())
);

create trigger organizations_touch before update on public.organizations
  for each row execute function public.tg_touch_updated_at();

-- Leave policy + notification defaults, one row per org.
create table if not exists public.workspace_settings (
  org_id                uuid primary key references public.organizations (id) on delete cascade,
  annual_entitlement    smallint not null default 30 check (annual_entitlement between 0 and 60),
  carry_over_cap        smallint not null default 10 check (carry_over_cap between 0 and 30),
  probation_days        smallint not null default 90 check (probation_days between 0 and 180),
  sick_entitlement      smallint not null default 30,
  gosi_employee_rate    numeric(5, 2) not null default 9.75,
  gosi_employer_rate    numeric(5, 2) not null default 11.75,
  hazard_rate           numeric(5, 2) not null default 2.00,
  email_digest          boolean not null default true,
  whatsapp_notifications boolean not null default false,
  payroll_cutoff_day    smallint not null default 25 check (payroll_cutoff_day between 1 and 28),
  created_at            timestamptz not null default timezone('utc', now()),
  updated_at            timestamptz not null default timezone('utc', now())
);

create trigger workspace_settings_touch before update on public.workspace_settings
  for each row execute function public.tg_touch_updated_at();

-- Public holidays drive working-day maths across leave and payroll.
create table if not exists public.holidays (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  name        text not null,
  name_ar     text,
  starts_on   date not null,
  ends_on     date not null,
  is_paid     boolean not null default true,
  created_at  timestamptz not null default timezone('utc', now()),
  constraint holidays_range check (ends_on >= starts_on)
);

create index if not exists holidays_org_start_idx on public.holidays (org_id, starts_on);
