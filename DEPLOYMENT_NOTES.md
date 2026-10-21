# Arcada People Workspace

Built from the two supplied reference files, downloaded under `inputs/`. The source HTML uses generated data and a browser-local REST simulator; this version keeps a clearly labeled browser-local demo and does not imply a live backend.

## Included
- People-only dashboard with department and period filters, workforce trends, hiring and departure movements, turnover reasons, team health, and leave snapshots.
- Employee directory, create/edit/departure flows, annual leave requests and approvals, balance tracking, October vacation calendar, candidate pipeline, performance summaries.
- Deeper analytics: cohort retention with small-group suppression, hiring-stage conversion, interactive workforce scenarios, and CSV reports.
- Separate lazy-loaded Payroll, Expenses, and Invoicing workflows.
- Permission-aware navigation, guarded hash routes, and guarded people mutation handlers for Admin, Manager, Viewer, and Finance demo roles.
- Settings: workspace preferences, integration plans, administrator permission matrix and local audit history, local user directory, privacy preferences, component naming reference.

## Verification
- `npm run build`
- `npm run lint`
- `node scripts/smoke.mjs` — browser workflow checks, using a temporary HTTP server that is shut down after testing.
- `node scripts/risks.mjs` — additional validation, permissions, analytics, and malformed-data tests.
- Desktop and mobile screenshots are saved under `artifacts/`.

## Production boundaries
This deployable frontend is a demonstration, not an authenticated HR backend. Do not enter real sensitive employee information. Data persists only in this browser and is not shared across devices. The role selector is explicitly a permission preview. UI permissions are not a security boundary.

Before operational use, integrate a trusted authentication provider, server-side authorization for every record and mutation, encrypted persistent storage, tenant isolation, immutable server audit logs, data-retention jobs, approval concurrency controls, and organization-specific leave policies. Connect integrations using server-side OAuth and secret storage. Finance actions update demo statuses only; they do not process payments, submit payroll, send invoices, or dispatch invitations. Privacy settings are saved preferences, not certification or active server policies.

Analytics use the sample dataset. Headcount trends derive from start and departure dates; turnover uses the mean of opening and closing period headcount. Current workforce and on-leave KPIs remain current snapshots. Hiring-stage conversion uses a current pipeline snapshot, not historical transitions. Workforce planning is an explicit what-if calculation, not a prediction. The seven-day leave visualization and decorative KPI sparklines are illustrative. All employment decisions require human review and context.
