-- Reference seed — deterministic IDs so re-seeding is idempotent.
-- Employees, leave requests and payroll come from `npm run db:seed`
-- (scripts/generate-seed.mjs), which renders the same dataset the mock store
-- uses so the design preview and the database never drift.

insert into public.organizations (id, name, name_ar, slug, legal_name, vat_number, cr_number, gosi_number, currency, timezone, locale, workweek)
values (
  '11111111-1111-4111-8111-111111111111',
  'Qimma Group', 'مجموعة قِمّة', 'qimma',
  'Qimma Group for Technology and Consulting LLC',
  '310123456700003', '1010456789', 'GOSI-1010456789', 'SAR', 'Asia/Riyadh', 'en', 'sun-thu'
)
on conflict (id) do nothing;

insert into public.workspace_settings (org_id, annual_entitlement, carry_over_cap, probation_days, gosi_employee_rate, gosi_employer_rate, hazard_rate)
values ('11111111-1111-4111-8111-111111111111', 30, 10, 90, 9.75, 11.75, 2.00)
on conflict (org_id) do nothing;

insert into public.locations (id, org_id, code, name, name_ar, city, country, timezone, address, is_hq)
values
  ('22222222-2222-4222-8222-222222220001', '11111111-1111-4111-8111-111111111111', 'RUH', 'Riyadh HQ', 'المقر الرئيسي — الرياض', 'Riyadh', 'SA', 'Asia/Riyadh', 'King Fahd Road, Al Olaya', true),
  ('22222222-2222-4222-8222-222222220002', '11111111-1111-4111-8111-111111111111', 'JED', 'Jeddah', 'جدة', 'Jeddah', 'SA', 'Asia/Riyadh', 'Corniche Road, Al Shati', false),
  ('22222222-2222-4222-8222-222222220003', '11111111-1111-4111-8111-111111111111', 'DMM', 'Dammam', 'الدمام', 'Dammam', 'SA', 'Asia/Riyadh', 'King Saud Road, Al Faisaliyah', false),
  ('22222222-2222-4222-8222-222222220004', '11111111-1111-4111-8111-111111111111', 'REM', 'Remote — KSA', 'عن بُعد', 'Riyadh', 'SA', 'Asia/Riyadh', null, false)
on conflict (id) do nothing;

insert into public.departments (id, org_id, code, name, name_ar, color, cost_centre, monthly_budget, sort_order)
values
  ('33333333-3333-4333-8333-333333330001', '11111111-1111-4111-8111-111111111111', 'TECH', 'Technology', 'التقنية', '#5f7d52', 'CC-100', 1180000, 1),
  ('33333333-3333-4333-8333-333333330002', '11111111-1111-4111-8111-111111111111', 'PROD', 'Product', 'المنتج', '#b95f2d', 'CC-110', 640000, 2),
  ('33333333-3333-4333-8333-333333330003', '11111111-1111-4111-8111-111111111111', 'SALES', 'Sales', 'المبيعات', '#c9a227', 'CC-200', 890000, 3),
  ('33333333-3333-4333-8333-333333330004', '11111111-1111-4111-8111-111111111111', 'MKT', 'Marketing', 'التسويق', '#8a7a9e', 'CC-210', 380000, 4),
  ('33333333-3333-4333-8333-333333330005', '11111111-1111-4111-8111-111111111111', 'OPS', 'Operations', 'العمليات', '#4a7189', 'CC-300', 420000, 5),
  ('33333333-3333-4333-8333-333333330006', '11111111-1111-4111-8111-111111111111', 'FIN', 'Finance', 'المالية', '#7d9aa8', 'CC-400', 310000, 6),
  ('33333333-3333-4333-8333-333333330007', '11111111-1111-4111-8111-111111111111', 'HR', 'People & Culture', 'الموارد البشرية', '#a8bc96', 'CC-500', 240000, 7),
  ('33333333-3333-4333-8333-333333330008', '11111111-1111-4111-8111-111111111111', 'LEGAL', 'Legal & Compliance', 'الشؤون القانونية', '#c3bda8', 'CC-600', 180000, 8)
on conflict (id) do nothing;

insert into public.leave_types (id, org_id, code, name, name_ar, paid, accrues, default_days, max_carry_over, requires_document, color, sort_order)
values
  ('44444444-4444-4444-8444-444444440001', '11111111-1111-4111-8111-111111111111', 'ANNUAL', 'Annual leave', 'إجازة سنوية', true, true, 30, 10, false, '#5f7d52', 1),
  ('44444444-4444-4444-8444-444444440002', '11111111-1111-4111-8111-111111111111', 'SICK', 'Sick leave', 'إجازة مرضية', true, false, 30, 0, true, '#b95f2d', 2),
  ('44444444-4444-4444-8444-444444440003', '11111111-1111-4111-8111-111111111111', 'UNPAID', 'Unpaid leave', 'إجازة بدون راتب', false, false, 0, 0, false, '#8a7a9e', 3),
  ('44444444-4444-4444-8444-444444440004', '11111111-1111-4111-8111-111111111111', 'MATERNITY', 'Maternity leave', 'إجازة وضع', true, false, 70, 0, true, '#c9a227', 4),
  ('44444444-4444-4444-8444-444444440005', '11111111-1111-4111-8111-111111111111', 'PATERNITY', 'Paternity leave', 'إجازة مولود', true, false, 3, 0, true, '#4a7189', 5),
  ('44444444-4444-4444-8444-444444440006', '11111111-1111-4111-8111-111111111111', 'MARRIAGE', 'Marriage leave', 'إجازة زواج', true, false, 5, 0, true, '#7d9aa8', 6),
  ('44444444-4444-4444-8444-444444440007', '11111111-1111-4111-8111-111111111111', 'BEREAVEMENT', 'Bereavement leave', 'إجازة وفاة', true, false, 5, 0, true, '#6f7a66', 7),
  ('44444444-4444-4444-8444-444444440008', '11111111-1111-4111-8111-111111111111', 'HAJJ', 'Hajj leave', 'إجازة الحج', true, false, 10, 0, true, '#a8bc96', 8)
on conflict (id) do nothing;

insert into public.holidays (org_id, name, name_ar, starts_on, ends_on, is_paid)
values
  ('11111111-1111-4111-8111-111111111111', 'Founding Day', 'يوم التأسيس', '2026-02-22', '2026-02-23', true),
  ('11111111-1111-4111-8111-111111111111', 'Eid al-Fitr', 'عيد الفطر', '2026-03-19', '2026-03-25', true),
  ('11111111-1111-4111-8111-111111111111', 'Eid al-Adha', 'عيد الأضحى', '2026-05-26', '2026-05-31', true),
  ('11111111-1111-4111-8111-111111111111', 'National Day', 'اليوم الوطني', '2026-09-23', '2026-09-24', true)
on conflict do nothing;
