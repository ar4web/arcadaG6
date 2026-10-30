-- 019 — Row level security: payroll, expenses, invoices, recruitment

alter table public.payroll_runs        enable row level security;
alter table public.payslips            enable row level security;
alter table public.payroll_adjustments enable row level security;
alter table public.wps_submissions     enable row level security;
alter table public.gosi_periods        enable row level security;
alter table public.expense_claims      enable row level security;
alter table public.expense_policies    enable row level security;
alter table public.customers           enable row level security;
alter table public.invoices            enable row level security;
alter table public.invoice_lines       enable row level security;
alter table public.payments            enable row level security;
alter table public.job_openings        enable row level security;
alter table public.candidates          enable row level security;
alter table public.interviews          enable row level security;
alter table public.offers              enable row level security;
alter table public.chat_threads        enable row level security;
alter table public.chat_participants   enable row level security;
alter table public.chat_messages       enable row level security;
alter table public.holidays            enable row level security;
alter table public.sessions_log        enable row level security;

-- --------------------------------------------------------------------- payroll
drop policy if exists payroll_runs_read on public.payroll_runs;
create policy payroll_runs_read on public.payroll_runs
  for select using (org_id = public.current_org_id() and public.has_role('admin', 'finance', 'hr_manager'));

drop policy if exists payroll_runs_write on public.payroll_runs;
create policy payroll_runs_write on public.payroll_runs
  for all using (org_id = public.current_org_id() and public.has_role('admin', 'finance', 'hr_manager'))
  with check (org_id = public.current_org_id());

-- Employees always see their own payslip; finance sees the run.
drop policy if exists payslips_read on public.payslips;
create policy payslips_read on public.payslips
  for select using (
    org_id = public.current_org_id()
    and (employee_id = public.current_employee_id() or public.has_role('admin', 'finance', 'hr_manager'))
  );

drop policy if exists payslips_write on public.payslips;
create policy payslips_write on public.payslips
  for all using (org_id = public.current_org_id() and public.has_role('admin', 'finance'))
  with check (org_id = public.current_org_id());

drop policy if exists adjustments_read on public.payroll_adjustments;
create policy adjustments_read on public.payroll_adjustments
  for select using (
    org_id = public.current_org_id()
    and (employee_id = public.current_employee_id() or public.has_role('admin', 'finance', 'hr_manager'))
  );

drop policy if exists wps_finance on public.wps_submissions;
create policy wps_finance on public.wps_submissions
  for all using (org_id = public.current_org_id() and public.has_role('admin', 'finance'))
  with check (org_id = public.current_org_id());

drop policy if exists gosi_read on public.gosi_periods;
create policy gosi_read on public.gosi_periods
  for select using (org_id = public.current_org_id() and public.has_role('admin', 'finance', 'hr_manager'));

-- -------------------------------------------------------------------- expenses
drop policy if exists expenses_read on public.expense_claims;
create policy expenses_read on public.expense_claims
  for select using (
    org_id = public.current_org_id()
    and (
      employee_id = public.current_employee_id()
      or public.has_role('admin', 'finance', 'hr_manager')
      or public.is_manager_of(employee_id)
    )
  );

drop policy if exists expenses_insert on public.expense_claims;
create policy expenses_insert on public.expense_claims
  for insert with check (org_id = public.current_org_id() and employee_id = public.current_employee_id());

drop policy if exists expenses_update on public.expense_claims;
create policy expenses_update on public.expense_claims
  for update using (
    org_id = public.current_org_id()
    and (
      (employee_id = public.current_employee_id() and status in ('draft', 'submitted'))
      or public.has_role('admin', 'finance')
      or public.is_manager_of(employee_id)
    )
  )
  with check (org_id = public.current_org_id());

drop policy if exists expense_policies_read on public.expense_policies;
create policy expense_policies_read on public.expense_policies
  for select using (org_id = public.current_org_id());

-- -------------------------------------------------------------------- invoices
drop policy if exists customers_read on public.customers;
create policy customers_read on public.customers
  for select using (org_id = public.current_org_id() and public.has_role('admin', 'finance'));

drop policy if exists invoices_read on public.invoices;
create policy invoices_read on public.invoices
  for select using (org_id = public.current_org_id() and public.has_role('admin', 'finance'));

drop policy if exists invoices_write on public.invoices;
create policy invoices_write on public.invoices
  for all using (org_id = public.current_org_id() and public.has_role('admin', 'finance'))
  with check (org_id = public.current_org_id());

drop policy if exists invoice_lines_read on public.invoice_lines;
create policy invoice_lines_read on public.invoice_lines
  for select using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.org_id = public.current_org_id() and public.has_role('admin', 'finance')
    )
  );

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments
  for select using (org_id = public.current_org_id() and public.has_role('admin', 'finance'));

-- ---------------------------------------------------------------- recruitment
drop policy if exists openings_read on public.job_openings;
create policy openings_read on public.job_openings
  for select using (org_id = public.current_org_id());

drop policy if exists openings_write on public.job_openings;
create policy openings_write on public.job_openings
  for all using (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager', 'recruiter'))
  with check (org_id = public.current_org_id());

drop policy if exists candidates_read on public.candidates;
create policy candidates_read on public.candidates
  for select using (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager', 'recruiter'));

drop policy if exists candidates_write on public.candidates;
create policy candidates_write on public.candidates
  for all using (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager', 'recruiter'))
  with check (org_id = public.current_org_id());

drop policy if exists interviews_read on public.interviews;
create policy interviews_read on public.interviews
  for select using (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager', 'recruiter', 'manager'));

drop policy if exists offers_read on public.offers;
create policy offers_read on public.offers
  for select using (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager', 'recruiter'));

-- ----------------------------------------------------------------------- chat
drop policy if exists chat_threads_participant on public.chat_threads;
create policy chat_threads_participant on public.chat_threads
  for select using (
    org_id = public.current_org_id()
    and exists (select 1 from public.chat_participants p where p.thread_id = id and p.user_id = auth.uid())
  );

drop policy if exists chat_participants_self on public.chat_participants;
create policy chat_participants_self on public.chat_participants
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.chat_participants p where p.thread_id = thread_id and p.user_id = auth.uid())
  );

drop policy if exists chat_messages_participant on public.chat_messages;
create policy chat_messages_participant on public.chat_messages
  for select using (
    exists (select 1 from public.chat_participants p where p.thread_id = thread_id and p.user_id = auth.uid())
  );

drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert on public.chat_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from public.chat_participants p where p.thread_id = thread_id and p.user_id = auth.uid())
  );

-- ------------------------------------------------------------------ reference
drop policy if exists holidays_read on public.holidays;
create policy holidays_read on public.holidays
  for select using (org_id = public.current_org_id());

drop policy if exists sessions_admin_read on public.sessions_log;
create policy sessions_admin_read on public.sessions_log
  for select using (org_id = public.current_org_id() and (user_id = auth.uid() or public.has_role('admin')));
