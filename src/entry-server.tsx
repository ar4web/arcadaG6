/**
 * Server-render entry used only by `scripts/render-check.mjs`.
 * Pages are imported eagerly (the app itself lazy-loads them) so a headless
 * render exercises the real screen code without a browser binary.
 */
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryProvider } from '@/lib/query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/modules/shell/AppShell';

import Overview from '@/modules/hr/pages/Overview';
import People from '@/modules/hr/pages/People';
import PersonProfile from '@/modules/hr/pages/PersonProfile';
import OrgChart from '@/modules/hr/pages/OrgChart';
import Leave from '@/modules/hr/pages/Leave';
import Attendance from '@/modules/hr/pages/Attendance';
import Recruitment from '@/modules/hr/pages/Recruitment';
import Performance from '@/modules/hr/pages/Performance';
import Analytics from '@/modules/hr/pages/Analytics';
import Compliance from '@/modules/hr/pages/Compliance';
import Documents from '@/modules/hr/pages/Documents';
import Settings from '@/modules/hr/pages/Settings';
import Audit from '@/modules/hr/pages/Audit';

import EssHome from '@/modules/ess/pages/Home';
import EssLeave from '@/modules/ess/pages/Leave';
import EssPayslips from '@/modules/ess/pages/Payslips';
import EssProfile from '@/modules/ess/pages/Profile';
import EssGoals from '@/modules/ess/pages/Goals';

import FinanceOverview from '@/modules/finance/pages/Overview';
import Payroll from '@/modules/finance/pages/Payroll';
import FinanceExpenses from '@/modules/finance/pages/Expenses';
import Invoices from '@/modules/finance/pages/Invoices';
import FinanceCompliance from '@/modules/finance/pages/Compliance';
import Reports from '@/modules/finance/pages/Reports';

import SignIn from '@/modules/system/pages/SignIn';
import Help from '@/modules/system/pages/Help';
import Docs from '@/modules/system/pages/Docs';
import NotFound from '@/modules/system/pages/NotFound';
import { WIDGETS } from '@/components/widgets/registry';
import { buildAnalytics } from '@/lib/mock/analytics';
import { chartPalette } from '@/components/charts/theme';
import { Avatar } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { db } from '@/lib/mock/db';

export function renderRoute(path: string) {
  return renderToString(
    <QueryProvider>
      <TooltipProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/hr" element={<AppShell app="hr" />}>
              <Route index element={<Overview />} />
              <Route path="people" element={<People />} />
              <Route path="people/:id" element={<PersonProfile />} />
              <Route path="org" element={<OrgChart />} />
              <Route path="leave" element={<Leave />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="recruitment" element={<Recruitment />} />
              <Route path="performance" element={<Performance />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="compliance" element={<Compliance />} />
              <Route path="documents" element={<Documents />} />
              <Route path="settings" element={<Settings />} />
              <Route path="audit" element={<Audit />} />
            </Route>
            <Route path="/me" element={<AppShell app="ess" />}>
              <Route index element={<EssHome />} />
              <Route path="leave" element={<EssLeave />} />
              <Route path="payslips" element={<EssPayslips />} />
              <Route path="attendance" element={<Attendance self />} />
              <Route path="profile" element={<EssProfile />} />
              <Route path="expenses" element={<FinanceExpenses self />} />
              <Route path="goals" element={<EssGoals />} />
              <Route path="documents" element={<Documents self />} />
            </Route>
            <Route path="/finance" element={<AppShell app="finance" />}>
              <Route index element={<FinanceOverview />} />
              <Route path="payroll" element={<Payroll />} />
              <Route path="expenses" element={<FinanceExpenses />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="compliance" element={<FinanceCompliance />} />
              <Route path="reports" element={<Reports />} />
              <Route path="attendance" element={<Attendance finance />} />
            </Route>
            <Route path="/help" element={<Help />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryProvider>,
  );
}


/** Renders every registered dashboard widget against a populated snapshot. */
export function renderWidgets() {
  const analytics = buildAnalytics(db.employees);
  const ctx = { analytics, palette: chartPalette(), locale: 'en' as const, navigate: () => {}, departmentFilter: 'all' };
  // Each widget is rendered inside its own component so hook-using widgets
  // (chart palette) resolve against a real dispatcher.
  const html = renderToString(
    <TooltipProvider>
      <div>
        {WIDGETS.map((widget) => (
          <WidgetHost key={widget.id} widget={widget} ctx={ctx} />
        ))}
      </div>
    </TooltipProvider>,
  );
  return { html, count: WIDGETS.length };
}

function WidgetHost({ widget, ctx }: { widget: (typeof WIDGETS)[number]; ctx: Parameters<(typeof WIDGETS)[number]['render']>[0] }) {
  return <section data-widget={widget.id}>{widget.render(ctx)}</section>;
}


/** Smoke-renders the shadcn-style kit so a broken primitive fails CI. */
export function renderPrimitives() {
  return renderToString(
    <TooltipProvider>
      <div>
        <Avatar name="Layla Al Harbi" hue={28} size="lg" />
        <Avatar name="Omar Nasser" src="https://example.com/missing.png" />
        <Separator />
        <Slider defaultValue={[40]} max={100} step={5} aria-label="Headcount band" />
        <Slider defaultValue={[20, 70]} max={100} step={5} aria-label="Salary band" />
        <Calendar mode="range" selected={{ from: new Date('2026-11-16'), to: new Date('2026-11-20') }} numberOfMonths={2} />
        <Calendar mode="single" selected={new Date('2026-10-31')} />
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup heading="Pages">
              <CommandItem>Payroll</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </TooltipProvider>,
  );
}
