-- 014 — Goals, review cycles and calibration

create table if not exists public.review_cycles (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  name         text not null,
  period_start date not null,
  period_end   date not null,
  self_review_due date,
  manager_review_due date,
  status       text not null default 'active' check (status in ('planned', 'active', 'calibration', 'closed')),
  created_at   timestamptz not null default timezone('utc', now()),
  constraint review_period_ordered check (period_end >= period_start)
);

create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  employee_id   uuid not null references public.employees (id) on delete cascade,
  cycle_id      uuid references public.review_cycles (id) on delete set null,
  title         text not null,
  description   text,
  category      text not null default 'business' check (category in ('business', 'people', 'craft', 'compliance', 'personal')),
  weight        smallint not null default 20 check (weight between 0 and 100),
  target_value  numeric(10, 2),
  current_value numeric(10, 2) not null default 0,
  unit          text,
  progress      smallint not null default 0 check (progress between 0 and 100),
  status        text not null default 'on_track' check (status in ('on_track', 'at_risk', 'off_track', 'completed', 'cancelled')),
  due_date      date,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now())
);

create index if not exists goals_employee_idx on public.goals (employee_id, due_date);
create index if not exists goals_cycle_idx on public.goals (cycle_id);

create trigger goals_touch before update on public.goals
  for each row execute function public.tg_touch_updated_at();

create table if not exists public.reviews (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  cycle_id       uuid not null references public.review_cycles (id) on delete cascade,
  employee_id    uuid not null references public.employees (id) on delete cascade,
  reviewer_id    uuid references public.employees (id) on delete set null,
  state          review_state not null default 'not_started',
  self_rating    numeric(3, 1) check (self_rating between 1 and 5),
  manager_rating numeric(3, 1) check (manager_rating between 1 and 5),
  final_rating   numeric(3, 1) check (final_rating between 1 and 5),
  potential      text check (potential in ('low', 'medium', 'high')),
  strengths      text,
  improvements   text,
  comments       text,
  submitted_at   timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now()),
  unique (cycle_id, employee_id)
);

create index if not exists reviews_employee_idx on public.reviews (employee_id);
create index if not exists reviews_state_idx on public.reviews (org_id, state);

create trigger reviews_touch before update on public.reviews
  for each row execute function public.tg_touch_updated_at();

create table if not exists public.feedback_notes (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  author_id   uuid references public.employees (id) on delete set null,
  kind        text not null default 'praise' check (kind in ('praise', 'coaching', 'check_in')),
  body        text not null,
  visibility  text not null default 'manager' check (visibility in ('private', 'manager', 'team', 'public')),
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists feedback_employee_idx on public.feedback_notes (employee_id, created_at desc);
