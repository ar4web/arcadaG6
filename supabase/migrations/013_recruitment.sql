-- 013 — Recruitment pipeline

create table if not exists public.job_openings (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  reference      text not null,
  title          text not null,
  title_ar       text,
  department_id  uuid references public.departments (id) on delete set null,
  location_id    uuid references public.locations (id) on delete set null,
  hiring_manager uuid references public.employees (id) on delete set null,
  employment_type employment_type not null default 'full_time',
  seniority      text,
  salary_min     numeric(12, 2),
  salary_max     numeric(12, 2),
  openings       smallint not null default 1,
  status         text not null default 'open' check (status in ('draft', 'open', 'on_hold', 'filled', 'closed')),
  posted_at      date,
  closes_on      date,
  description    text,
  requirements   text[],
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now()),
  unique (org_id, reference)
);

create index if not exists job_openings_status_idx on public.job_openings (org_id, status, posted_at desc);

create trigger job_openings_touch before update on public.job_openings
  for each row execute function public.tg_touch_updated_at();

create table if not exists public.candidates (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  opening_id     uuid references public.job_openings (id) on delete set null,
  first_name     text not null,
  last_name      text not null,
  email          citext not null,
  phone          text,
  nationality    text,
  years_experience smallint,
  current_company text,
  current_title  text,
  expected_salary numeric(12, 2),
  notice_period_days smallint,
  stage          candidate_stage not null default 'applied',
  score          smallint check (score between 0 and 100),
  source         text default 'linkedin',
  cv_url         text,
  notes          text,
  owner_id       uuid references public.profiles (id) on delete set null,
  applied_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now())
);

create index if not exists candidates_opening_idx on public.candidates (opening_id, stage);
create index if not exists candidates_stage_idx on public.candidates (org_id, stage);
create index if not exists candidates_email_idx on public.candidates (email);

create trigger candidates_touch before update on public.candidates
  for each row execute function public.tg_touch_updated_at();

create table if not exists public.interviews (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  candidate_id  uuid not null references public.candidates (id) on delete cascade,
  kind          text not null default 'video' check (kind in ('phone', 'video', 'onsite', 'technical', 'panel')),
  scheduled_at  timestamptz not null,
  duration_minutes smallint not null default 45,
  interviewer_id uuid references public.employees (id) on delete set null,
  location      text,
  meeting_url   text,
  outcome       text check (outcome in ('pending', 'passed', 'failed', 'no_show')),
  feedback      text,
  created_at    timestamptz not null default timezone('utc', now())
);

create index if not exists interviews_candidate_idx on public.interviews (candidate_id, scheduled_at desc);
create index if not exists interviews_schedule_idx on public.interviews (org_id, scheduled_at);

create table if not exists public.offers (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  candidate_id  uuid not null references public.candidates (id) on delete cascade,
  position_title text not null,
  base_salary   numeric(12, 2) not null,
  housing_allowance numeric(12, 2) not null default 0,
  start_date    date,
  status        text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),
  sent_at       timestamptz,
  responded_at  timestamptz,
  document_url  text,
  created_at    timestamptz not null default timezone('utc', now())
);
