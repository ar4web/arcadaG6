import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Download, FileCheck2 } from 'lucide-react';
import { complianceOverview, gosiPeriods } from '@/services/compliance';
import { db } from '@/lib/mock/db';
import { useUIStore } from '@/stores/ui';
import { formatDate, formatSAR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Badge, Progress } from '@/components/ui/misc';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';
import { complianceCopy } from '@/lib/copy';

export default function FinanceCompliance() {
  const locale = useUIStore((s) => s.locale);
  const { data: overview } = useQuery({ queryKey: ['compliance'], queryFn: complianceOverview });
  const { data: gosi } = useQuery({ queryKey: ['gosi'], queryFn: gosiPeriods });
  const run = db.payrollRuns[db.payrollRuns.length - 1]!;

  return (
    <>
      <PageHeader
        eyebrow="Money · Statutory"
        title="GOSI, WPS & VAT"
        description="Contribution schedule, wage protection status and the VAT position for the quarter."
        actions={
          <Button variant="secondary" size="sm">
            <Download className="size-3.5" /> Download SIF
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {[
          { title: 'GOSI', status: overview?.gosiStatus === 'filed' ? 'Filed' : 'Pending', body: complianceCopy.gosi, tone: overview?.gosiStatus === 'filed' ? 'success' : 'warning' },
          { title: 'WPS', status: run.wpsSubmitted ? 'Submitted' : 'Not submitted', body: complianceCopy.wps, tone: run.wpsSubmitted ? 'success' : 'warning' },
          { title: 'ZATCA', status: 'Reported', body: 'E-invoices are cleared through Fatoora within 24 hours of issue.', tone: 'success' },
        ].map((card) => (
          <Card key={card.title} className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-[12px] font-semibold text-ink">{card.title}</p>
              <Badge tone={card.tone as 'success' | 'warning'} dot>
                {card.status}
              </Badge>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-ink-3">{card.body}</p>
            <Progress value={card.tone === 'success' ? 100 : 45} tone={card.tone === 'success' ? 'accent' : 'warning'} className="mt-2.5" height="h-1" />
          </Card>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card flush>
          <CardHeading title="GOSI contribution schedule" description="Employee and employer shares per period." action={<FileCheck2 className="size-4 text-ink-4" />} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px]">
              <thead>
                <tr className="border-y border-line bg-surface-2">
                  {['Period', 'Employees', 'Employee', 'Employer', 'Hazard', 'Status'].map((heading) => (
                    <th key={heading} className="px-3 py-1.5 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {gosi?.map((record) => (
                  <tr key={record.period} className="hover:bg-surface-2">
                    <td className="num px-3 py-2 text-[11px] text-ink-2">{record.period}</td>
                    <td className="num px-3 py-2 text-[10.5px] text-ink-4">{record.employees}</td>
                    <td className="num px-3 py-2 text-[10.5px] text-ink-2">{formatSAR(record.employeeShare, locale, { compact: true })}</td>
                    <td className="num px-3 py-2 text-[10.5px] text-ink-2">{formatSAR(record.employerShare, locale, { compact: true })}</td>
                    <td className="num px-3 py-2 text-[10.5px] text-ink-4">{formatSAR(record.occupationalHazard, locale, { compact: true })}</td>
                    <td className="px-3 py-2">
                      <Badge tone={record.status === 'filed' ? 'success' : 'warning'}>{record.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <CardHeading title="Wage Protection System" description={`Period ${run.period}`} />
            <div className="flex flex-col gap-2 px-5 pb-5 text-[11px]">
              {[
                ['Employees in file', String(run.headcount)],
                ['Total value', formatSAR(run.net, locale)],
                ['Bank', 'Saudi National Bank'],
                ['FILE-SIF version', '3.0 (Mudad)'],
                ['Due', formatDate(run.dueDate, 'd MMM yyyy', locale)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-line pb-1.5 last:border-0">
                  <span className="text-ink-4">{label}</span>
                  <span className="num text-ink-2">{value}</span>
                </div>
              ))}
              <div className={`mt-1 flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[10px] ${run.wpsSubmitted ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
                {run.wpsSubmitted ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                {run.wpsSubmitted ? 'File accepted by the bank' : 'File not yet submitted — 3 days remaining'}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeading title="VAT position" description="Q4 2026 to date." />
            <div className="grid grid-cols-2 gap-2 px-5 pb-5">
              {[
                ['Output VAT', formatSAR(1_842_000, locale, { compact: true })],
                ['Input VAT', formatSAR(964_000, locale, { compact: true })],
                ['Net payable', formatSAR(878_000, locale, { compact: true })],
                ['Due', '30 Nov 2026'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-line p-2.5">
                  <p className="text-[9.5px] text-ink-4">{label}</p>
                  <p className="num mt-0.5 text-[12px] font-medium text-ink">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <PageFooter note="Statutory filings are prepared, never auto-submitted." right="Preview workspace" />
    </>
  );
}
