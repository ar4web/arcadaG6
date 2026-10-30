import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Download, Landmark, ShieldCheck } from 'lucide-react';
import { complianceOverview, gosiPeriods, saudizationByDepartment } from '@/services/compliance';
import { db, displayName, getEmployee } from '@/lib/mock/db';
import { useUIStore } from '@/stores/ui';
import { cn, daysFromToday, formatDate, formatNumber, formatSAR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Badge, EmptyState, Progress } from '@/components/ui/misc';
import { ChartCard, HorizontalBars } from '@/components/charts/primitives';
import { useChartPalette } from '@/components/charts/theme';
import { complianceCopy, methodology } from '@/lib/copy';
import { MethodologyNote, PageFooter, PageHeader } from '@/modules/shell/PageHeader';

export default function Compliance() {
  const locale = useUIStore((s) => s.locale);
  const palette = useChartPalette();
  const { data: overview } = useQuery({ queryKey: ['compliance'], queryFn: complianceOverview });
  const { data: gosi } = useQuery({ queryKey: ['gosi'], queryFn: gosiPeriods });
  const { data: saudization } = useQuery({ queryKey: ['saudization'], queryFn: saudizationByDepartment });

  const expiring = db.documents
    .filter((document) => (document.status === 'expiring' || document.status === 'expired') && document.expiresAt)
    .sort((a, b) => (a.expiresAt ?? '').localeCompare(b.expiresAt ?? ''))
    .slice(0, 10);

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance"
        description="Nitaqat position, GOSI filings, WPS readiness and document expiry — the four things an inspection asks for first."
        actions={
          <Button variant="secondary" size="sm">
            <Download className="size-3.5" /> Compliance pack
          </Button>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Card className="p-3.5">
          <div className="flex items-start justify-between">
            <p className="text-[10.5px] text-ink-3">Nitaqat band</p>
            <ShieldCheck className="size-3.5 text-accent" />
          </div>
          <p className="mt-1 text-[19px] font-semibold leading-none text-accent-ink">{overview?.nitaqatBand ?? '—'}</p>
          <p className="mt-1 text-[9.5px] text-ink-4">indicative, activity-dependent</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10.5px] text-ink-3">Saudization</p>
          <p className="num mt-1 text-[19px] font-semibold leading-none text-ink">{overview?.saudization ?? 0}%</p>
          <Progress value={overview?.saudization ?? 0} tone="accent" className="mt-1.5" height="h-1" />
        </Card>
        <Card className="p-3.5">
          <p className="text-[10.5px] text-ink-3">Iqamas expiring</p>
          <p className="num mt-1 text-[19px] font-semibold leading-none text-warning">{overview?.iqamaExpiring ?? 0}</p>
          <p className="mt-1 text-[9.5px] text-ink-4">within 45 days</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10.5px] text-ink-3">WPS status</p>
          <p className="mt-1 text-[13px] font-semibold capitalize leading-none text-warning">{overview?.wpsStatus ?? '—'}</p>
          <p className="mt-1 text-[9.5px] text-ink-4">October run</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartCard title="Saudization by department" description="Target is 40% company-wide." className="lg:col-span-2" bodyClassName="px-3 pt-2">
          <HorizontalBars
            data={(saudization ?? []).map((row, index) => ({
              label: row.department,
              value: row.rate,
              suffix: '%',
              color: row.rate >= 40 ? palette.series[2] : palette.warning ?? palette.series[index % palette.series.length],
            }))}
            max={100}
            formatter={(value) => `${value}%`}
          />
        </ChartCard>

        <Card>
          <CardHeading title="Employment split" description="Saudi nationals versus expatriates." />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="num text-[22px] font-semibold leading-none text-ink">{formatNumber(overview?.saudis ?? 0)}</p>
                <p className="mt-1 text-[9.5px] text-ink-4">Saudi nationals</p>
              </div>
              <div className="text-end">
                <p className="num text-[22px] font-semibold leading-none text-ink-3">{formatNumber(overview?.expats ?? 0)}</p>
                <p className="mt-1 text-[9.5px] text-ink-4">Expatriates</p>
              </div>
            </div>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full">
              <span className="h-full bg-accent" style={{ width: `${overview?.saudization ?? 0}%` }} />
              <span className="h-full bg-chart-4" style={{ width: `${100 - (overview?.saudization ?? 0)}%` }} />
            </div>
            <p className="mt-2 text-[9.5px] leading-relaxed text-ink-4">
              GOSI applies to Saudi nationals from the first day of employment; expatriates contribute to occupational hazard only.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card flush>
          <CardHeading title="GOSI filings" description="Monthly contribution schedule." action={<Badge tone="success" dot>Up to date</Badge>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead>
                <tr className="border-y border-line bg-surface-2">
                  {['Period', 'Employees', 'Employee share', 'Employer share', 'Due', 'Status'].map((heading) => (
                    <th key={heading} className="px-3 py-1.5 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {gosi?.map((record) => (
                  <tr key={record.period} className="hover:bg-surface-2">
                    <td className="num px-3 py-1.5 text-[11px] text-ink-2">{record.period}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-ink-3">{record.employees}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-ink-2">{formatSAR(record.employeeShare, locale, { compact: true })}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-ink-2">{formatSAR(record.employerShare, locale, { compact: true })}</td>
                    <td className="num px-3 py-1.5 text-[10.5px] text-ink-4">{formatDate(record.dueDate, 'd MMM', locale)}</td>
                    <td className="px-3 py-1.5">
                      <Badge tone={record.status === 'filed' ? 'success' : record.status === 'pending' ? 'warning' : 'danger'}>{record.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card flush>
          <CardHeading
            title="Document expiry"
            description="Iqama, contract and insurance renewals."
            action={
              <Badge tone="warning" dot>
                {expiring.length} need action
              </Badge>
            }
          />
          <div className="max-h-[19rem] overflow-y-auto">
            {expiring.length ? (
              expiring.map((document) => {
                const employee = getEmployee(document.employeeId);
                const days = daysFromToday(document.expiresAt) ?? 0;
                return (
                  <div key={document.id} className="flex items-center gap-2.5 border-b border-line px-4 py-2 last:border-0">
                    <span className={cn('grid size-6 shrink-0 place-items-center rounded', days < 0 ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning')}>
                      {days < 0 ? <AlertTriangle className="size-3" /> : <Landmark className="size-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-ink">{displayName(employee!)}</p>
                      <p className="truncate text-[9.5px] capitalize text-ink-4">
                        {document.type.replace('_', ' ')} · {formatDate(document.expiresAt, 'd MMM yyyy', locale)}
                      </p>
                    </div>
                    <Badge tone={days < 0 ? 'danger' : days < 21 ? 'danger' : 'warning'}>{days < 0 ? `${Math.abs(days)}d over` : `${days}d`}</Badge>
                  </div>
                );
              })
            ) : (
              <EmptyState title="Everything is valid" description="No documents expire in the next 45 days." icon={<CheckCircle2 className="size-5" />} />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Wage Protection System', body: complianceCopy.wps, status: 'Action needed' },
          { title: 'GOSI contributions', body: complianceCopy.gosi, status: 'On schedule' },
          { title: 'Iqama renewals', body: complianceCopy.iqama, status: '7 in window' },
        ].map((note) => (
          <Card key={note.title} className="p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-semibold text-ink">{note.title}</p>
              <Badge tone={note.status === 'Action needed' ? 'warning' : note.status === '7 in window' ? 'danger' : 'success'}>{note.status}</Badge>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-ink-3">{note.body}</p>
          </Card>
        ))}
      </div>

      <MethodologyNote>{methodology.saudization}</MethodologyNote>
      <PageFooter note="Statutory deadlines follow the Hijri calendar for GOSI." right="Preview workspace — not a filing system" />
    </>
  );
}
