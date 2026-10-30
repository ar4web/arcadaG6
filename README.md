# Arcada — Qimma Group People Suite

A bilingual (EN / AR with full RTL) HR workspace for a Saudi company: HR administration,
employee self-service and finance operations in one product.

**Phase 1 is complete** — every screen renders with realistic demo data and the product
looks and behaves like the finished thing. **Phase 2 (backend)** has the database, auth and
infrastructure in place; wiring each screen to Supabase is the remaining work.

```
Employees     ~220 records across 8 departments and 4 locations
Payroll       13 monthly runs, GOSI + WPS modelled on Saudi statutory rates
Compliance    Iqama, passport, contract and insurance expiry tracking
Apps          /hr (admin) · /me (employee self-service) · /finance
```

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173 — mock data, no backend needed
```

The app boots straight into an admin session so the whole workspace is explorable.

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on `0.0.0.0:5173` |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint, zero-error policy |
| `npm run typecheck` | TypeScript project build |
| `npm run test:render` | Headless render check: 31 routes, 39 widgets, UI kit |
| `npm run test:e2e` | Playwright specs (needs `npx playwright install chromium`) |
| `npm run test:all` | typecheck + lint + render check |
| `npm run db:lint` | Parse every migration and the seed with a real Postgres parser |
| `npm run db:up` / `db:down` / `db:reset` | Local Postgres + Studio + Mailpit + MinIO |
| `npm run db:seed` | Load the demo dataset |

Further reading: [ARCHITECTURE.md](ARCHITECTURE.md) · [DEPLOY.md](DEPLOY.md)

## Architecture

```
src/
  modules/            feature slices, each owning its routes and screens
    hr/  ess/  finance/  system/  shell/
  components/         design system (ui/), charts/, widgets/, layout primitives
  services/           17 domain modules — the only place that talks to data
  lib/                utils, i18n, mock store, query client, supabase client
  stores/             zustand: ui, auth, layout, columns
  types/              domain contract + generated-shape database types
supabase/
  migrations/         21 idempotent SQL files: schema, enums, RLS, views, storage
  functions/          edge functions (fatoora, email, whatsapp, pdf, wps, gosi)
scripts/              render check, migration linter, seed generator
```

**Data flow.** Screens never touch a database. They call `src/services/*`, which return the
same shapes whether they are backed by the in-memory mock store (`VITE_DATA_SOURCE=mock`)
or by Supabase (`VITE_DATA_SOURCE=supabase`). React Query owns caching and mutation
invalidation.

**Component kit.** Shadcn-style primitives on Radix: `button`, `input`, `textarea`,
`select`, `native select`, `checkbox`, `switch`, `slider`, `dialog`, `popover`, `tabs`,
`tooltip`, `dropdown-menu`, `table`, `badge`, `avatar` (photo + initials fallback),
`separator`, `command` (cmdk), `calendar` (react-day-picker), `toast` (sonner), cards and
page skeletons. All of them read the shared tokens, so they work in light, dark and RTL
without per-component overrides.

**Design system.** Warm sage/terracotta palette defined as CSS custom properties in
`src/index.css` and bridged into Tailwind v4 with `@theme inline`; light and dark themes,
tabular numerals, RTL-aware logical properties throughout.

## Features

- **Dashboard** — 39 draggable widgets (KPIs, Recharts visualisations, watchlists, tables)
  with per-user layout persistence via `@dnd-kit`.
- **People** — virtualised directory (`@tanstack/react-virtual`), saved column layouts,
  drag-reordered columns, profile pages with org chain, compensation, documents and timeline.
- **Leave & attendance** — request/approve flows, policy copy that quotes Saudi labour law,
  calendar heat maps.
- **Payroll & finance** — runs, payslips, GOSI breakdown, WPS export, ZATCA invoice screens.
- **Recruitment, performance, compliance, documents, org chart, audit log, settings.**
- **Command palette** (`⌘K` / `Ctrl+K`), role switching, light/dark, EN/AR, print styles,
  reduced-motion support.

## Configuration

Copy `.env.example` to `.env`. The only switch that matters for Phase 1 vs Phase 2:

```env
VITE_DATA_SOURCE=mock       # design preview, zero setup
VITE_DATA_SOURCE=supabase   # real database (needs VITE_SUPABASE_URL + anon key)
```

## Testing

There is no browser binary in constrained CI images, so the smoke test renders every route
through an SSR bundle inside `happy-dom`:

```bash
npm run test:render
```

It fails on thrown errors, React warnings, or `undefined` / `NaN` / `[object Object]` leaking
into markup — the class of bug a type-checker cannot see.

Playwright specs live in `tests/` (`playwright.config.ts` starts the dev server, runs
desktop Chrome and a Pixel 7 profile). The first run needs a browser binary:

```bash
npx playwright install chromium
npm run test:e2e
```

## Roadmap

- **Phase 1 — Foundation & visual layer** ✅
- **Phase 2 — Backend, database & wiring** — migrations, RLS, auth, services (in progress)
- **Phase 3 — Polish, performance & delivery** — Playwright, CI, seed, docs
