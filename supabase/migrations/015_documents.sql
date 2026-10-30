-- 015 — Document metadata (bytes live in Supabase Storage)

create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  employee_id   uuid references public.employees (id) on delete cascade,
  kind          document_kind not null default 'other',
  title         text not null,
  storage_bucket text not null default 'employee-documents',
  storage_path  text not null,
  mime_type     text,
  size_bytes    bigint,
  issued_on     date,
  expires_on    date,
  status        text not null default 'valid' check (status in ('valid', 'expiring', 'expired', 'missing', 'archived')),
  requires_action boolean not null default false,
  uploaded_by   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now())
);

create index if not exists documents_employee_idx on public.documents (employee_id, kind);
create index if not exists documents_expiry_idx on public.documents (org_id, expires_on) where expires_on is not null;
create unique index if not exists documents_path_idx on public.documents (storage_bucket, storage_path);

create trigger documents_touch before update on public.documents
  for each row execute function public.tg_touch_updated_at();

create trigger documents_audit after insert or update or delete on public.documents
  for each row execute function public.tg_audit_row();

-- Compliance milestones the workspace watches (iqama, passport, contract, insurance).
create table if not exists public.compliance_items (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  employee_id   uuid references public.employees (id) on delete cascade,
  kind          document_kind not null,
  reference     text,
  due_on        date not null,
  status        text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue', 'waived')),
  owner_id      uuid references public.employees (id) on delete set null,
  notes         text,
  completed_at  timestamptz,
  created_at    timestamptz not null default timezone('utc', now())
);

create index if not exists compliance_items_due_idx on public.compliance_items (org_id, due_on);
create index if not exists compliance_items_employee_idx on public.compliance_items (employee_id);

create table if not exists public.gosi_periods (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  period        text not null,
  employee_count integer not null default 0,
  employee_share numeric(12, 2) not null default 0,
  employer_share numeric(12, 2) not null default 0,
  hazard_share   numeric(12, 2) not null default 0,
  status         text not null default 'draft' check (status in ('draft', 'filed', 'paid', 'adjusted')),
  filed_at       timestamptz,
  unique (org_id, period)
);
