-- 012 — Invoices and ZATCA / Fatoora e-invoicing

create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  name          text not null,
  name_ar       text,
  vat_number    text,
  cr_number     text,
  email         citext,
  phone         text,
  address       text,
  city          text,
  country       char(2) not null default 'SA',
  payment_terms smallint not null default 30,
  created_at    timestamptz not null default timezone('utc', now())
);

create index if not exists customers_org_idx on public.customers (org_id, name);

create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations (id) on delete cascade,
  customer_id     uuid not null references public.customers (id) on delete restrict,
  number          text not null,
  uuid_zatca      uuid not null default gen_random_uuid(),
  status          invoice_status not null default 'draft',
  issue_date      date not null,
  due_date        date not null,
  currency        char(3) not null default 'SAR',
  subtotal        numeric(14, 2) not null default 0,
  vat_rate        numeric(4, 2) not null default 15,
  vat_amount      numeric(14, 2) not null default 0,
  total           numeric(14, 2) not null default 0,
  paid_amount     numeric(14, 2) not null default 0,
  notes           text,
  qr_payload      text,
  zatca_status    text default 'pending' check (zatca_status in ('pending', 'reported', 'cleared', 'failed')),
  cleared_at      timestamptz,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now()),
  unique (org_id, number),
  constraint invoice_due_after_issue check (due_date >= issue_date)
);

create index if not exists invoices_org_status_idx on public.invoices (org_id, status, issue_date desc);
create index if not exists invoices_customer_idx on public.invoices (customer_id);

create trigger invoices_touch before update on public.invoices
  for each row execute function public.tg_touch_updated_at();

create trigger invoices_audit after insert or update or delete on public.invoices
  for each row execute function public.tg_audit_row();

create table if not exists public.invoice_lines (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity    numeric(10, 2) not null default 1,
  unit_price  numeric(12, 2) not null default 0,
  vat_rate    numeric(4, 2) not null default 15,
  line_total  numeric(14, 2) not null default 0,
  sort_order  smallint not null default 0
);

create index if not exists invoice_lines_invoice_idx on public.invoice_lines (invoice_id);

create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  invoice_id  uuid references public.invoices (id) on delete cascade,
  claim_id    uuid references public.expense_claims (id) on delete set null,
  amount      numeric(14, 2) not null,
  currency    char(3) not null default 'SAR',
  method      text not null default 'bank_transfer' check (method in ('bank_transfer', 'card', 'cash', 'cheque', 'sadad')),
  received_on date not null,
  reference   text,
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists payments_invoice_idx on public.payments (invoice_id);
