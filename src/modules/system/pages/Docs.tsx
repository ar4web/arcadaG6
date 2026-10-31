import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeading } from '@/components/ui/card';
import { Badge } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    title: 'Three apps, one workspace',
    body: 'HR Console for the people team, My Workspace for every employee, Finance for payroll and receivables. The sidebar app switcher moves between them without losing session or filters.',
  },
  {
    title: 'Services layer',
    body: 'Seventeen service modules expose async functions with the exact signatures the Supabase implementation will keep. Screens never import the mock store directly except for read-only reference data.',
  },
  {
    title: 'Design tokens',
    body: 'All colour, radius, shadow and motion values live as CSS custom properties in src/index.css and are bridged into Tailwind with @theme inline. Dark mode and RTL both ride on the same tokens.',
  },
  {
    title: 'Widget registry',
    body: 'Thirty-eight dashboard widgets register a render function against an analytics snapshot. The dashboard composes, reorders and persists them with @dnd-kit and Zustand.',
  },
  {
    title: 'Drag system',
    body: 'Dashboard widgets use a rect grid sortable, sidebar navigation reorders per group, table columns reorder horizontally, and the recruitment kanban moves candidates across stages.',
  },
  {
    title: 'What is mocked',
    body: 'Everything. Data is generated deterministically from a seeded PRNG so screenshots and reviews are stable. Phase 2 swaps the services layer for Supabase without touching a screen.',
  },
];

export default function Docs() {
  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <Link to="/help" className="inline-flex items-center gap-1 text-[11.5px] text-ink-3 hover:text-ink">
          <ArrowLeft className="size-3.5 rtl:rotate-180" /> Help
        </Link>
        <h1 className="mt-3 font-display text-[27px] font-extrabold tracking-[-0.025em] text-ink">Architecture</h1>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-ink-3">
          Phase 1 delivers the full interface on synthetic data. The seams are deliberate: every screen reads through the services layer so the backend can be dropped in behind it.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['React 18', 'TypeScript', 'Vite', 'Tailwind v4', 'Recharts', '@dnd-kit', 'TanStack Query', 'Zustand', 'Supabase-ready'].map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <Card key={section.title} className="p-4">
              <CardHeading title={section.title} />
              <p className="-mt-2 px-5 pb-5 text-[11px] leading-relaxed text-ink-3">{section.body}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-3 p-4">
          <CardHeading title="Token reference" description="Live swatches — these are the utilities every screen is built from." />
          <div className="px-5 pb-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: '--bg', className: 'bg-bg ring-border' },
                { label: '--bg-card', className: 'bg-bg-card ring-border' },
                { label: '--bg-elevated', className: 'bg-bg-elevated ring-border' },
                { label: '--bg-input', className: 'bg-bg-input ring-border-strong' },
                { label: '--accent', className: 'bg-accent' },
                { label: '--accent-strong', className: 'bg-accent-strong' },
                { label: '--accent-dim', className: 'bg-accent-dim' },
                { label: '--accent-2', className: 'bg-accent-2' },
                { label: '--accent-2-dim', className: 'bg-accent-2-dim' },
                { label: '--success', className: 'bg-success' },
                { label: '--warning', className: 'bg-warning' },
                { label: '--danger', className: 'bg-danger' },
              ].map((swatch) => (
                <div key={swatch.label} className="min-w-0">
                  <div className={cn('h-10 rounded-card ring-1', swatch.className)} />
                  <p className="mt-1 truncate text-xs text-text-tertiary">{swatch.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-card border border-border bg-bg-elevated p-md">
                <p className="text-sm font-medium text-text-primary">Aa 14px · Inter</p>
                <p className="text-xs text-text-secondary">Aa 13px · secondary text</p>
                <p className="text-xs text-text-tertiary">Aa 11px · tertiary metadata</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="grid h-11 place-items-center rounded-card border border-border bg-bg-card text-xs text-text-secondary">card</div>
                <div className="grid h-11 place-items-center rounded-input border border-border bg-bg-card text-xs text-text-secondary">input</div>
                <div className="grid h-11 place-items-center rounded-btn bg-accent-2 text-xs font-medium text-accent-2-contrast">btn</div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
              Radii 5px · row height 36px · header 48px · rail 240px / 48px collapsed. High contrast and reduced motion
              are honoured through data-hc and data-reduce-motion on the html element.
            </p>
          </div>
        </Card>

        <Card className="mt-3 p-4">
          <CardHeading title="Folder structure" />
          <pre className="overflow-x-auto px-5 pb-5 text-[10.5px] leading-relaxed text-ink-3">{`src/
├── components/
│   ├── charts/      theme, primitives, KpiCard
│   ├── ui/          shadcn-style primitives on the tokens
│   └── widgets/     widget registry (38 definitions)
├── lib/             utils, i18n, mock store, query client
├── modules/
│   ├── hr/          pages/  directory, leave, talent, analytics…
│   ├── ess/         employee self-service pages
│   ├── finance/     payroll, expenses, invoices, reports
│   ├── shell/       AppShell, Sidebar, Header, palette
│   └── system/      sign-in, help, 404
├── services/        17 API modules (mock transport today)
├── stores/          zustand: ui, auth, layout, columns
└── types/           domain model`}</pre>
        </Card>
      </div>
    </div>
  );
}
