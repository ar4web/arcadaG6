-- 004 — Departments and office locations

create table if not exists public.departments (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  parent_id     uuid references public.departments (id) on delete set null,
  code          text not null,
  name          text not null,
  name_ar       text,
  head_id       uuid,
  color         text not null default '#5f7d52',
  cost_centre   text,
  monthly_budget numeric(14, 2),
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now()),
  unique (org_id, code)
);

create index if not exists departments_org_idx on public.departments (org_id, sort_order);
create index if not exists departments_parent_idx on public.departments (parent_id);

create trigger departments_touch before update on public.departments
  for each row execute function public.tg_touch_updated_at();

create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  code        text not null,
  name        text not null,
  name_ar     text,
  city        text not null,
  country     char(2) not null default 'SA',
  timezone    text not null default 'Asia/Riyadh',
  address     text,
  latitude    numeric(9, 6),
  longitude   numeric(9, 6),
  is_hq       boolean not null default false,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now()),
  unique (org_id, code)
);

create index if not exists locations_org_idx on public.locations (org_id);

create trigger locations_touch before update on public.locations
  for each row execute function public.tg_touch_updated_at();
