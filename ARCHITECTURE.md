# Architecture

## Shape of the product

Three apps share one design system and one data contract:

| App | Route root | Audience | Screens |
| --- | --- | --- | --- |
| HR administration | `/hr` | admin, hr_manager, recruiter, manager | 13 |
| Employee self-service | `/me` | everyone | 7 |
| Finance | `/finance` | finance, admin | 6 |
| System | `/signin`, `/help`, `/docs`, `*` | anonymous / any | 4 |

Role switching is a first-class feature: `useAuthStore.switchRole()` swaps the session
identity, and `Header` navigates to the first app the new role may open. Access is derived
from `ROLE_PERMISSIONS`, which mirrors `public.role_permissions` in the database.

## Layers

```
screens  →  services  →  transport  →  supabase | mock
                 ↕
            react-query cache
```

- **Screens** live in `src/modules/<app>/pages`. They compose widgets and read data through
  hooks (`useQuery` with a service function). No screen imports the mock store or the
  Supabase client.
- **Services** (`src/services/*.ts`) expose domain verbs — `listEmployees`, `decideLeave`,
  `runPayroll` — and return domain types from `src/types`.
- **Transport** (`src/services/api.ts`) adds artificial latency and error semantics in mock
  mode, and `ApiError` codes map 1:1 onto Postgres/PostgREST failures.
- **Mock store** (`src/lib/mock/*`) is deterministic: the clock is frozen at
  `TODAY_ISO = 2026-10-31`, IDs are stable, and the dataset is generated once at module load.

## Design tokens

`src/index.css` is the only place colour, type, spacing and geometry are defined.

| Layer | Tokens | Consumed by |
| --- | --- | --- |
| Raw (spec) | `--bg`, `--bg-card`, `--bg-elevated`, `--bg-input`, `--border`, `--text-primary/secondary/tertiary`, `--success/warning/danger/info` (+ `-dim`), `--accent`, `--accent-2`, `--chart-1..8`, `--space-*`, `--radius-*`, `--row-height`, `--header-height`, `--sidebar-*`, `--text-xs..2xl`, `--font-en/ar` | designers, new components |
| Semantic | `--canvas`, `--surface`, `--surface-2/3`, `--ink`, `--ink-2/3/4`, `--line`, `--primary*`, `--accent-*`, `--success-*`… | every screen via Tailwind utilities |
| Accessible | `data-theme`, `data-hc`, `data-reduce-motion`, `dir` on `<html>` | `applyDocumentPreferences()` in `src/stores/ui.ts` |

The bridge also exposes the raw spec names as utilities, so a component can be written
against either vocabulary:

| Utility | Token | Example |
| --- | --- | --- |
| `bg-bg` · `bg-bg-card` · `bg-bg-elevated` · `bg-bg-input` | `--bg*` | page vs card vs input wells |
| `text-text-primary/secondary/tertiary` | `--text-*` | type ramp |
| `border-border` · `border-border-strong` | `--border*` | hairlines |
| `bg-accent` · `bg-accent-strong` · `bg-accent-dim` | `--accent*` | teal brand |
| `bg-accent-2` · `bg-accent-2-dim` | `--accent-2*` | orange secondary CTA |
| `bg-success` · `bg-success-dim` (same for warning/danger/info) | signals | badges |
| `rounded-card` · `rounded-input` · `rounded-btn` | 5px | geometry |
| `p-xs/sm/md/lg/xl` | `--space-*` | spacing |
| `text-xs/sm/base/lg/xl/2xl` | 11/13/14/16/20/24 | type scale |

`npm run check:contrast` resolves the `var()`/`color-mix()` chains and asserts WCAG AA for
body text, muted text, button labels, badges and the active sidebar item across dark, light
and high-contrast — it fails the build script if a token drifts.

## State

| Store | Owns | Persistence |
| --- | --- | --- |
| `useUIStore` | theme, locale, sidebar collapse, command palette | `arcada.ui`, `arcada.locale` |
| `useAuthStore` | session, role, permissions | `arcada.session` |
| `useLayoutStore` | dashboard widget order/visibility/span | `arcada.dashboard-layout` |
| `useColumnStore` | table column order, widths, visibility | `arcada.table-columns` |

Server state never enters these stores — React Query is the cache.

## Database

21 migrations, applied in order, all idempotent:

```
001 extensions + helper functions (tenant, role, chain-of-command)
002 enums                    010 payroll                019 RLS: finance
003 organizations            011 expenses               020 views + RPCs + indexes
004 departments/locations    012 invoices (ZATCA)       021 storage buckets
005 employees                013 recruitment
006 profiles/roles/perms     014 performance
007 auth hooks               015 documents/compliance
008 leave                    016 notifications/chat
009 attendance               017 audit
```

**Tenancy.** Every table carries `org_id`. RLS predicates start from
`public.current_org_id()` (a `SECURITY DEFINER` function reading `profiles`) and narrow by
role or by reporting line (`is_manager_of`, `manages_chain_of` walk up to six levels).

**Writes.** Sensitive tables (`leave_requests`, `payroll_runs`, `invoices`, `expense_claims`,
`documents`) carry an audit trigger writing `audit_events`, which is append-only (an
`UPDATE`/`DELETE` trigger raises).

**Money.** GOSI: employee 9.75%, employer 11.75% on basic + housing for non-Saudis, plus 2%
occupational hazard. WPS exports a fixed-width SIF. ZATCA QR payloads are TLV base64 in
`fatoora-invoice`.

**RPCs.** `my_context()` returns roles + permissions in one call, `dashboard_snapshot()`
returns the homepage counters, `decide_leave_request()` approves/rejects atomically and
notifies the employee.

## Edge functions

| Function | Purpose |
| --- | --- |
| `fatoora-invoice` | ZATCA QR generation and simplified-invoice reporting |
| `send-email` | Resend delivery + in-app notification mirror |
| `send-whatsapp` | WhatsApp Cloud API templates |
| `generate-pdf` | Payslips, salary certificates, experience letters |
| `wps-export` | Wage Protection System SIF file for the bank |
| `gosi-report` | Monthly GOSI contribution report, persisted per period |

All functions verify the caller with `requireUser()` before touching the service-role client.

## Verification

`npm run build` type-checks and bundles. `npm run test:render` renders all 31 routes plus all
39 dashboard widgets through an SSR bundle inside `happy-dom` and fails on React warnings or
leaked `undefined`/`NaN`/`[object Object]`. `npm run db:lint` parses every migration with
libpg_query so SQL syntax errors surface before a container is ever started.
