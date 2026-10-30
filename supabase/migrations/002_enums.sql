-- 002 — Domain enums
-- Kept in one place so the TypeScript contract (src/types) has an exact mirror.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('admin', 'hr_manager', 'recruiter', 'manager', 'finance', 'employee');
  end if;
  if not exists (select 1 from pg_type where typname = 'employment_type') then
    create type employment_type as enum ('full_time', 'part_time', 'contract', 'intern', 'temporary');
  end if;
  if not exists (select 1 from pg_type where typname = 'employee_status') then
    create type employee_status as enum ('active', 'probation', 'on_leave', 'notice', 'terminated', 'alumni');
  end if;
  if not exists (select 1 from pg_type where typname = 'work_mode') then
    create type work_mode as enum ('onsite', 'hybrid', 'remote');
  end if;
  if not exists (select 1 from pg_type where typname = 'leave_request_status') then
    create type leave_request_status as enum ('draft', 'pending', 'approved', 'rejected', 'cancelled', 'withdrawn');
  end if;
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum ('present', 'remote', 'late', 'absent', 'leave', 'holiday', 'business_trip');
  end if;
  if not exists (select 1 from pg_type where typname = 'payroll_status') then
    create type payroll_status as enum ('draft', 'review', 'approved', 'paid', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'expense_status') then
    create type expense_status as enum ('draft', 'submitted', 'approved', 'rejected', 'reimbursed');
  end if;
  if not exists (select 1 from pg_type where typname = 'expense_category') then
    create type expense_category as enum ('travel', 'meals', 'lodging', 'transport', 'equipment', 'training', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type invoice_status as enum ('draft', 'issued', 'paid', 'overdue', 'void', 'credit_note');
  end if;
  if not exists (select 1 from pg_type where typname = 'candidate_stage') then
    create type candidate_stage as enum ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn');
  end if;
  if not exists (select 1 from pg_type where typname = 'review_state') then
    create type review_state as enum ('not_started', 'self_review', 'manager_review', 'calibration', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'document_kind') then
    create type document_kind as enum ('iqama', 'passport', 'contract', 'offer_letter', 'medical_insurance', 'certificate', 'policy', 'payslip', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_channel') then
    create type notification_channel as enum ('in_app', 'email', 'whatsapp', 'push');
  end if;
end
$$;
