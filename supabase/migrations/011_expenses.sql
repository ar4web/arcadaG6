-- 011 — Expense claims and approvals

create table if not exists public.expense_claims (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  employee_id   uuid not null references public.employees (id) on delete cascade,
  reference     text not null,
  category      expense_category not null default 'other',
  amount        numeric(12, 2) not null check (amount > 0),
  currency      char(3) not null default 'SAR',
  vat_amount    numeric(12, 2) not null default 0,
  incurred_on   date not null,
  description   text not null,
  status        expense_status not null default 'draft',
  project_code  text,
  receipt_url   text,
  approver_id   uuid references public.employees (id) on delete set null,
  decided_at    timestamptz,
  decision_note text,
  reimbursed_at date,
  created_at    timestamptz not null default timezone('utc', now()),
  updated_at    timestamptz not null default timezone('utc', now()),
  created_by    uuid references auth.users (id) on delete set null
);

create index if not exists expense_claims_employee_idx on public.expense_claims (employee_id, incurred_on desc);
create index if not exists expense_claims_status_idx on public.expense_claims (org_id, status);
create index if not exists expense_claims_period_idx on public.expense_claims (org_id, incurred_on desc);

create trigger expense_claims_touch before update on public.expense_claims
  for each row execute function public.tg_touch_updated_at();

create trigger expense_claims_audit after insert or update or delete on public.expense_claims
  for each row execute function public.tg_audit_row();

create table if not exists public.expense_policies (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  category      expense_category not null,
  monthly_cap   numeric(12, 2),
  per_claim_cap numeric(12, 2),
  requires_receipt_above numeric(12, 2) not null default 0,
  notes         text,
  unique (org_id, category)
);
