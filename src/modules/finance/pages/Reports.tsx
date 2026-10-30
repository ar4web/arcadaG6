import * as React from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import {
  employeeRegisterReport,
  exportElementToPdf,
  exportTable,
  leaveRegisterReport,
  monthlyCostReport,
  payrollRegisterReport,
  type ReportFormat,
  type ReportTable,
} from '@/services/reports';
import { useUIStore } from '@/stores/ui';
import { cn, formatSAR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Badge } from '@/components/ui/misc';
import { Checkbox } from '@/components/ui/checkbox';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';
import { toast } from '@/components/ui/toast';

const REPORTS: { id: string; name: string; description: string; build: () => ReportTable }[] = [
  { id: 'employees', name: 'Employee register', description: 'Every active employee with grade, location and gross pay.', build: employeeRegisterReport },
  { id: 'payroll', name: 'Payroll register', description: 'Bank-file ready lines with IBAN, GOSI and net pay.', build: payrollRegisterReport },
  { id: 'leave', name: 'Leave register', description: 'All leave requests with status and duration.', build: leaveRegisterReport },
  { id: 'cost', name: 'Monthly payroll cost', description: 'Thirteen periods of gross and net payroll.', build: monthlyCostReport },
];

export default function Reports() {
  const locale = useUIStore((s) => s.locale);
  const [selected, setSelected] = React.useState<string[]>(['employees']);
  const [generated, setGenerated] = React.useState<ReportTable | null>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function generate() {
    const report = REPORTS.find((item) => item.id === selected[selected.length - 1]);
    if (!report) return;
    setGenerated(report.build());
  }

  async function download(format: ReportFormat) {
    if (!generated) return;
    if (format === 'pdf') {
      if (!printRef.current) return;
      await exportElementToPdf(printRef.current, generated.filename);
      toast.success('PDF downloaded');
      return;
    }
    await exportTable(generated, format);
    toast.success(`${format.toUpperCase()} downloaded`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Money · Reporting"
        title="Report builder"
        description="Pick a dataset, preview it with live numbers, then export to CSV, Excel, Word or PDF."
        actions={
          <Button variant="primary" size="sm" onClick={generate} disabled={!selected.length}>
            Generate report
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeading title="Datasets" description="Select what to include." />
          <div className="flex flex-col gap-1 px-3 pb-4">
            {REPORTS.map((report) => (
              <button
                key={report.id}
                onClick={() => toggle(report.id)}
                className={cn('flex items-start gap-2 rounded-md px-2 py-2 text-start transition-colors hover:bg-surface-2', selected.includes(report.id) && 'bg-primary-soft/60')}
              >
                <Checkbox checked={selected.includes(report.id)} className="mt-0.5 pointer-events-none" />
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-medium text-ink">{report.name}</span>
                  <span className="block text-[9.5px] leading-relaxed text-ink-4">{report.description}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3" flush>
          <CardHeading
            title={generated ? generated.title : 'Preview'}
            description={generated ? `${generated.rows.length} rows · live data` : 'Generate a report to see a live preview.'}
            action={
              generated ? (
                <div className="flex items-center gap-1.5">
                  <Button variant="secondary" size="xs" onClick={() => download('csv')}>
                    <Download className="size-3" /> CSV
                  </Button>
                  <Button variant="secondary" size="xs" onClick={() => download('xlsx')}>
                    <FileSpreadsheet className="size-3" /> Excel
                  </Button>
                  <Button variant="secondary" size="xs" onClick={() => download('docx')}>
                    <FileText className="size-3" /> Word
                  </Button>
                  <Button variant="secondary" size="xs" onClick={() => download('pdf')}>
                    PDF
                  </Button>
                  <Button variant="secondary" size="xs" onClick={() => window.print()}>
                    <Printer className="size-3" /> Print
                  </Button>
                </div>
              ) : null
            }
          />
          <div ref={printRef} className="max-h-[32rem] overflow-auto bg-surface p-3">
            {generated ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line">
                    {generated.columns.map((column) => (
                      <th key={column.key} className="px-2 py-1.5 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {generated.rows.slice(0, 60).map((row, index) => (
                    <tr key={index}>
                      {generated.columns.map((column) => (
                        <td key={column.key} className="px-2 py-1.5 text-[11px] text-ink-2">
                          {typeof row[column.key] === 'number' && column.key.match(/basic|gross|net|gosi/) ? formatSAR(Number(row[column.key]), locale) : String(row[column.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                <span className="grid size-11 place-items-center rounded-full border border-line bg-surface-3 text-ink-4">
                  <FileText className="size-5" />
                </span>
                <p className="text-[12px] font-medium text-ink">No preview yet</p>
                <p className="max-w-xs text-[10.5px] text-ink-4">Choose a dataset and press Generate. Numbers come from the same source as the dashboards.</p>
              </div>
            )}
          </div>
          {generated ? (
            <div className="flex items-center justify-between border-t border-line bg-surface-2 px-3 py-2 text-[10px] text-ink-4">
              <span>
                Showing {Math.min(60, generated.rows.length)} of {generated.rows.length} rows
              </span>
              <Badge tone="success">Live data</Badge>
            </div>
          ) : null}
        </Card>
      </div>

      <PageFooter note="Exports are generated in the browser and never leave the device." right="PDF, DOCX, XLSX and CSV supported" />
    </>
  );
}
