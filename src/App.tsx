import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryProvider } from '@/lib/query';
import { AppShell } from '@/modules/shell/AppShell';
import { useAuthStore } from '@/stores/auth';
import { applyDocumentPreferences, useUIStore } from '@/stores/ui';
import { PageSkeleton } from '@/components/ui/page-skeleton';

const Overview = lazy(() => import('@/modules/hr/pages/Overview'));
const People = lazy(() => import('@/modules/hr/pages/People'));
const PersonProfile = lazy(() => import('@/modules/hr/pages/PersonProfile'));
const OrgChart = lazy(() => import('@/modules/hr/pages/OrgChart'));
const Leave = lazy(() => import('@/modules/hr/pages/Leave'));
const Attendance = lazy(() => import('@/modules/hr/pages/Attendance'));
const Recruitment = lazy(() => import('@/modules/hr/pages/Recruitment'));
const Performance = lazy(() => import('@/modules/hr/pages/Performance'));
const Analytics = lazy(() => import('@/modules/hr/pages/Analytics'));
const Compliance = lazy(() => import('@/modules/hr/pages/Compliance'));
const Documents = lazy(() => import('@/modules/hr/pages/Documents'));
const Settings = lazy(() => import('@/modules/hr/pages/Settings'));
const Audit = lazy(() => import('@/modules/hr/pages/Audit'));

const EssHome = lazy(() => import('@/modules/ess/pages/Home'));
const EssLeave = lazy(() => import('@/modules/ess/pages/Leave'));
const EssPayslips = lazy(() => import('@/modules/ess/pages/Payslips'));
const EssProfile = lazy(() => import('@/modules/ess/pages/Profile'));
const EssGoals = lazy(() => import('@/modules/ess/pages/Goals'));

const FinanceOverview = lazy(() => import('@/modules/finance/pages/Overview'));
const Payroll = lazy(() => import('@/modules/finance/pages/Payroll'));
const FinanceExpenses = lazy(() => import('@/modules/finance/pages/Expenses'));
const Invoices = lazy(() => import('@/modules/finance/pages/Invoices'));
const FinanceCompliance = lazy(() => import('@/modules/finance/pages/Compliance'));
const Reports = lazy(() => import('@/modules/finance/pages/Reports'));

const SignIn = lazy(() => import('@/modules/system/pages/SignIn'));
const Help = lazy(() => import('@/modules/system/pages/Help'));
const NotFound = lazy(() => import('@/modules/system/pages/NotFound'));
const Docs = lazy(() => import('@/modules/system/pages/Docs'));

export default function App() {
  const theme = useUIStore((s) => s.theme);
  const locale = useUIStore((s) => s.locale);
  const density = useUIStore((s) => s.density);
  const hydrate = useAuthStore((s) => s.hydrate);
  const location = useLocation();

  useEffect(() => {
    applyDocumentPreferences(theme, locale, density);
  }, [theme, locale, density]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyDocumentPreferences(theme, locale, density);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme, locale, density]);

  return (
    <QueryProvider>
      <TooltipProvider delayDuration={200}>
        <Toaster />
        <Suspense fallback={<PageSkeleton />} key={location.pathname.split('/')[1]}>
          <Routes>
            <Route path="/" element={<Navigate to="/hr" replace />} />
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
        </Suspense>
      </TooltipProvider>
    </QueryProvider>
  );
}
