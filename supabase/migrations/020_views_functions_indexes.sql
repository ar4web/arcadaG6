-- 020 — Analytics views, RPCs and supporting indexes

-- --------------------------------------------------------------- dashboard feed
create or replace view public.headcount_snapshot as
select
  e.org_id,
  e.department_id,
  d.name as department_name,
  count(*) filter (where e.status in ('active', 'probation', 'on_leave')) as active_headcount,
  count(*) filter (where e.status = 'probation') as probation_count,
  count(*) filter (where e.nationality = 'Saudi') as saudi_count,
  round(avg(e.engagement_score)::numeric, 2) as avg_engagement,
  sum(e.base_salary + e.housing_allowance + e.transport_allowance + e.other_allowances) as monthly_gross
from public.employees e
left join public.departments d on d.id = e.department_id
group by e.org_id, e.department_id, d.name;

create or replace view public.leave_summary as
select
  lr.org_id,
  date_trunc('month', lr.start_date)::date as month,
  count(*) as requests,
  count(*) filter (where lr.status = 'pending') as pending,
  count(*) filter (where lr.status = 'approved') as approved,
  sum(lr.working_days) filter (where lr.status = 'approved') as approved_days
from public.leave_requests lr
group by lr.org_id, month;

create or replace view public.payroll_summary as
select
  pr.org_id,
  pr.period,
  pr.status,
  pr.headcount,
  pr.gross_total,
  pr.net_total,
  pr.gosi_employer_total + pr.gosi_employee_total as gosi_total,
  ps.department_id,
  sum(ps.gross) as department_gross
from public.payroll_runs pr
left join public.payslips ps on ps.run_id = pr.id
group by pr.org_id, pr.period, pr.status, pr.headcount, pr.gross_total, pr.net_total,
         pr.gosi_employer_total, pr.gosi_employee_total, ps.department_id;

-- ------------------------------------------------------------- compliance feed
create or replace view public.expiring_documents as
select
  d.id,
  d.org_id,
  d.employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  d.kind,
  d.title,
  d.expires_on,
  (d.expires_on - current_date) as days_remaining
from public.documents d
join public.employees e on e.id = d.employee_id
where d.expires_on is not null
  and d.expires_on < current_date + interval '90 days';

-- ------------------------------------------------------------- RPC: my profile
create or replace function public.my_context()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'user_id', auth.uid(),
    'org_id', public.current_org_id(),
    'employee_id', public.current_employee_id(),
    'roles', coalesce((select jsonb_agg(ur.role) from public.user_roles ur where ur.user_id = auth.uid()), '[]'::jsonb),
    'permissions', coalesce((select jsonb_agg(distinct up.permission) from public.user_permissions up where up.user_id = auth.uid()), '[]'::jsonb)
  );
$$;

-- RPC: approve or reject a leave request atomically.
create or replace function public.decide_leave_request(
  p_request_id uuid,
  p_status leave_request_status,
  p_note text default null
)
returns public.leave_requests
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row public.leave_requests;
begin
  if p_status not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected';
  end if;

  update public.leave_requests
     set status = p_status,
         decision_note = p_note,
         decided_at = timezone('utc', now()),
         approver_id = public.current_employee_id()
   where id = p_request_id
     and org_id = public.current_org_id()
     and status = 'pending'
   returning * into v_row;

  if v_row.id is null then
    raise exception 'leave request % not found or already decided', p_request_id;
  end if;

  insert into public.notifications (org_id, employee_id, kind, title, body, href)
  select v_row.org_id, v_row.employee_id,
         case when p_status = 'approved' then 'success' else 'warning' end,
         case when p_status = 'approved' then 'Leave approved' else 'Leave rejected' end,
         coalesce(p_note, 'Your request has been reviewed.'),
         '/me/leave';

  return v_row;
end;
$$;

-- RPC: dashboard snapshot in one round trip.
create or replace function public.dashboard_snapshot(p_org uuid default null)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with org as (select coalesce(p_org, public.current_org_id()) as id)
  select jsonb_build_object(
    'headcount', (select count(*) from public.employees e, org where e.org_id = org.id and e.status in ('active', 'probation', 'on_leave')),
    'pending_leave', (select count(*) from public.leave_requests lr, org where lr.org_id = org.id and lr.status = 'pending'),
    'open_roles', (select count(*) from public.job_openings jo, org where jo.org_id = org.id and jo.status = 'open'),
    'expiring_documents', (select count(*) from public.expiring_documents x, org where x.org_id = org.id),
    'monthly_gross', (select coalesce(sum(e.base_salary + e.housing_allowance + e.transport_allowance + e.other_allowances), 0)
                      from public.employees e, org where e.org_id = org.id and e.status in ('active', 'probation', 'on_leave'))
  );
$$;

-- ------------------------------------------------------------- extra indexes
create index if not exists payslips_org_idx on public.payslips (org_id);
create index if not exists invoices_status_due_idx on public.invoices (org_id, status, due_date);
create index if not exists candidates_applied_idx on public.candidates (org_id, applied_at desc);
create index if not exists goals_status_idx on public.goals (org_id, status, due_date);
create index if not exists documents_kind_idx on public.documents (org_id, kind);
create index if not exists audit_events_created_brin on public.audit_events using brin (created_at);
