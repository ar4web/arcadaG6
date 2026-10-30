-- 018 — Row level security: people, leave, attendance, documents
-- Pattern: everything is scoped to the caller's organization; row visibility
-- narrows further for self-service and manager views.

alter table public.organizations        enable row level security;
alter table public.workspace_settings   enable row level security;
alter table public.departments          enable row level security;
alter table public.locations            enable row level security;
alter table public.employees            enable row level security;
alter table public.profiles             enable row level security;
alter table public.user_roles           enable row level security;
alter table public.leave_types          enable row level security;
alter table public.leave_balances       enable row level security;
alter table public.leave_requests       enable row level security;
alter table public.attendance_records   enable row level security;
alter table public.shifts               enable row level security;
alter table public.timesheets           enable row level security;
alter table public.documents            enable row level security;
alter table public.compliance_items     enable row level security;
alter table public.goals                enable row level security;
alter table public.reviews              enable row level security;
alter table public.review_cycles        enable row level security;
alter table public.feedback_notes       enable row level security;
alter table public.notifications        enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.audit_events         enable row level security;

-- ---------------------------------------------------------------- organizations
drop policy if exists org_read on public.organizations;
create policy org_read on public.organizations
  for select using (id = public.current_org_id());

drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations
  for update using (id = public.current_org_id() and public.has_role('admin'))
  with check (id = public.current_org_id());

-- ------------------------------------------------------------ workspace_settings
drop policy if exists settings_read on public.workspace_settings;
create policy settings_read on public.workspace_settings
  for select using (org_id = public.current_org_id());

drop policy if exists settings_write on public.workspace_settings;
create policy settings_write on public.workspace_settings
  for all using (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager'))
  with check (org_id = public.current_org_id());

-- -------------------------------------------------------------------- reference
drop policy if exists departments_read on public.departments;
create policy departments_read on public.departments
  for select using (org_id = public.current_org_id());

drop policy if exists departments_write on public.departments;
create policy departments_write on public.departments
  for all using (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager'))
  with check (org_id = public.current_org_id());

drop policy if exists locations_read on public.locations;
create policy locations_read on public.locations
  for select using (org_id = public.current_org_id());

drop policy if exists shifts_read on public.shifts;
create policy shifts_read on public.shifts
  for select using (org_id = public.current_org_id());

-- --------------------------------------------------------------------- people
drop policy if exists employees_read on public.employees;
create policy employees_read on public.employees
  for select using (
    org_id = public.current_org_id()
    and (
      public.has_role('admin', 'hr_manager', 'recruiter', 'finance', 'manager')
      or id = public.current_employee_id()
    )
  );

drop policy if exists employees_write on public.employees;
create policy employees_write on public.employees
  for insert with check (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager'))
  ;

drop policy if exists employees_update on public.employees;
create policy employees_update on public.employees
  for update using (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager'))
  with check (org_id = public.current_org_id());

drop policy if exists employees_delete on public.employees;
create policy employees_delete on public.employees
  for delete using (org_id = public.current_org_id() and public.has_role('admin'));

-- Profiles: self read/write; admins and HR can read everyone in the org.
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid() or (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager')));

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists roles_read on public.user_roles;
create policy roles_read on public.user_roles
  for select using (user_id = auth.uid() or public.has_role('admin'));

drop policy if exists roles_admin_write on public.user_roles;
create policy roles_admin_write on public.user_roles
  for all using (public.has_role('admin')) with check (public.has_role('admin'));

-- ----------------------------------------------------------------------- leave
drop policy if exists leave_types_read on public.leave_types;
create policy leave_types_read on public.leave_types
  for select using (org_id = public.current_org_id());

drop policy if exists leave_balances_read on public.leave_balances;
create policy leave_balances_read on public.leave_balances
  for select using (
    org_id = public.current_org_id()
    and (employee_id = public.current_employee_id() or public.has_role('admin', 'hr_manager', 'finance') or public.is_manager_of(employee_id))
  );

drop policy if exists leave_requests_read on public.leave_requests;
create policy leave_requests_read on public.leave_requests
  for select using (
    org_id = public.current_org_id()
    and (
      employee_id = public.current_employee_id()
      or public.has_role('admin', 'hr_manager')
      or public.is_manager_of(employee_id)
      or public.manages_chain_of(employee_id)
    )
  );

drop policy if exists leave_requests_insert on public.leave_requests;
create policy leave_requests_insert on public.leave_requests
  for insert with check (
    org_id = public.current_org_id()
    and (employee_id = public.current_employee_id() or public.has_role('admin', 'hr_manager'))
  );

drop policy if exists leave_requests_update on public.leave_requests;
create policy leave_requests_update on public.leave_requests
  for update using (
    org_id = public.current_org_id()
    and (
      (employee_id = public.current_employee_id() and status in ('draft', 'pending'))
      or public.has_role('admin', 'hr_manager')
      or public.is_manager_of(employee_id)
    )
  )
  with check (org_id = public.current_org_id());

-- ------------------------------------------------------------------ attendance
drop policy if exists attendance_read on public.attendance_records;
create policy attendance_read on public.attendance_records
  for select using (
    org_id = public.current_org_id()
    and (employee_id = public.current_employee_id() or public.has_role('admin', 'hr_manager', 'finance', 'manager'))
  );

drop policy if exists attendance_write on public.attendance_records;
create policy attendance_write on public.attendance_records
  for all using (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager'))
  with check (org_id = public.current_org_id());

drop policy if exists attendance_self_insert on public.attendance_records;
create policy attendance_self_insert on public.attendance_records
  for insert with check (org_id = public.current_org_id() and employee_id = public.current_employee_id());

drop policy if exists timesheets_read on public.timesheets;
create policy timesheets_read on public.timesheets
  for select using (
    org_id = public.current_org_id()
    and (employee_id = public.current_employee_id() or public.has_role('admin', 'hr_manager', 'manager'))
  );

-- ------------------------------------------------------------------- documents
drop policy if exists documents_read on public.documents;
create policy documents_read on public.documents
  for select using (
    org_id = public.current_org_id()
    and (
      employee_id = public.current_employee_id()
      or employee_id is null
      or public.has_role('admin', 'hr_manager', 'recruiter', 'finance')
      or public.is_manager_of(employee_id)
    )
  );

drop policy if exists documents_write on public.documents;
create policy documents_write on public.documents
  for all using (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager', 'recruiter'))
  with check (org_id = public.current_org_id());

drop policy if exists compliance_read on public.compliance_items;
create policy compliance_read on public.compliance_items
  for select using (org_id = public.current_org_id());

-- ------------------------------------------------------ performance and goals
drop policy if exists goals_read on public.goals;
create policy goals_read on public.goals
  for select using (
    org_id = public.current_org_id()
    and (employee_id = public.current_employee_id() or public.has_role('admin', 'hr_manager') or public.manages_chain_of(employee_id))
  );

drop policy if exists goals_write on public.goals;
create policy goals_write on public.goals
  for all using (
    org_id = public.current_org_id()
    and (employee_id = public.current_employee_id() or public.has_role('admin', 'hr_manager') or public.is_manager_of(employee_id))
  )
  with check (org_id = public.current_org_id());

drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews
  for select using (
    org_id = public.current_org_id()
    and (employee_id = public.current_employee_id() or public.has_role('admin', 'hr_manager') or public.manages_chain_of(employee_id))
  );

drop policy if exists review_cycles_read on public.review_cycles;
create policy review_cycles_read on public.review_cycles
  for select using (org_id = public.current_org_id());

drop policy if exists feedback_read on public.feedback_notes;
create policy feedback_read on public.feedback_notes
  for select using (
    org_id = public.current_org_id()
    and (
      visibility = 'public'
      or (visibility in ('manager', 'team') and public.manages_chain_of(employee_id))
      or employee_id = public.current_employee_id()
      or public.has_role('admin', 'hr_manager')
    )
  );

-- --------------------------------------------------------------- notifications
drop policy if exists notifications_self on public.notifications;
create policy notifications_self on public.notifications
  for select using (user_id = auth.uid() or employee_id = public.current_employee_id());

drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notification_prefs_self on public.notification_preferences;
create policy notification_prefs_self on public.notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------------------------- audit
drop policy if exists audit_read on public.audit_events;
create policy audit_read on public.audit_events
  for select using (org_id = public.current_org_id() and public.has_role('admin', 'hr_manager', 'finance'));

drop policy if exists audit_insert on public.audit_events;
create policy audit_insert on public.audit_events
  for insert with check (org_id = public.current_org_id());
