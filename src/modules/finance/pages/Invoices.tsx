import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, FileSpreadsheet, Plus, Search, Send, ShieldCheck } from 'lucide-react';
import type { InvoiceStatus } from '@/types';
import { invoiceSummary, listInvoices, markPaid, reportToZatca } from '@/services/invoices';
import { useUIStore } from '@/stores/ui';
import { formatDate, formatSAR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, EmptyState, Skeleton } from '@/components/ui/misc';
import { Input, NativeSelect } from '@/components/ui/input';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';
import { toast } from 'sonner';

const STATUS_TONE: Record<InvoiceStatus, 'neutral' | 'info' | 'success' | 'danger' | 'warning'> = {
  draft: 'neutral',
  sent: 'info',
  paid: 'success',
  overdue: 'danger',
  void: 'neutral',
};

export default function Invoices() {
  const locale = useUIStore((s) => s.locale);
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<InvoiceStatus | 'all'>('all');
  const [search, setSearch] = React.useState('');

  const { data: invoices, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: () => listInvoices() });
  const { data: summary } = useQuery({ queryKey: ['invoice-summary'], queryFn: invoiceSummary });

  const paid = useMutation({
    mutationFn: markPaid,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['invoice-summary'] });
      toast.success('Invoice marked as paid');
    },
  });

  const zatca = useMutation({
    mutationFn: reportToZatca,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice reported to ZATCA');
    },
  });

  const rows = (invoices ?? []).filter((invoice) => {
    if (status !== 'all' && invoice.status !== status) return false;
    if (!search) return true;
    return `${invoice.number} ${invoice.clientName}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      <PageHeader
        eyebrow="Money · Receivables"
        title="Invoices"
        description="ZATCA Phase 2 compliant e-invoices with UBL 2.1 XML and a QR code on every document."
        actions={
          <>
            <Button variant="secondary" size="sm">
              <FileSpreadsheet className="size-3.5" /> Export
            </Button>
            <Button variant="primary" size="sm">
              <Plus className="size-3.5" /> New invoice
            </Button>
          </>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: 'Invoices issued', value: summary?.issued ?? 0 },
          { label: 'Outstanding', value: formatSAR(summary?.outstandingValue ?? 0, locale, { compact: true }) },
          { label: 'Overdue', value: formatSAR(summary?.overdueValue ?? 0, locale, { compact: true }), tone: 'text-danger' },
          { label: 'Awaiting ZATCA', value: summary?.pendingZatca ?? 0, tone: 'text-warning' },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5">
            <p className="text-[10.5px] text-ink-3">{stat.label}</p>
            <p className={`num mt-1 text-[19px] font-semibold leading-none ${stat.tone ?? 'text-ink'}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice or client…" icon={<Search />} className="h-8 max-w-xs text-[11.5px]" />
        <NativeSelect value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-8 w-auto text-[11.5px]">
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="sent">Sent</option>
          <option value="overdue">Overdue</option>
          <option value="draft">Draft</option>
        </NativeSelect>
        <span className="ms-auto inline-flex items-center gap-1 text-[10px] text-ink-4">
          <ShieldCheck className="size-3" /> ZATCA Phase 2
        </span>
      </div>

      <Card flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                {['Invoice', 'Client', 'Issued', 'Due', 'Total', 'ZATCA', 'Status', ''].map((heading) => (
                  <th key={heading} className="px-3 py-2 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={8} className="p-1.5">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                : rows.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-surface-2">
                      <td className="num px-3 py-2 text-[11px] font-medium text-ink">{invoice.number}</td>
                      <td className="px-3 py-2">
                        <p className="truncate text-[11.5px] text-ink-2">{invoice.clientName}</p>
                        <p className="num truncate text-[9px] text-ink-4">VAT {invoice.clientVat}</p>
                      </td>
                      <td className="num px-3 py-2 text-[10.5px] text-ink-4">{formatDate(invoice.issueDate, 'd MMM', locale)}</td>
                      <td className="num px-3 py-2 text-[10.5px] text-ink-4">{formatDate(invoice.dueDate, 'd MMM', locale)}</td>
                      <td className="num px-3 py-2 text-[11.5px] font-medium text-ink">{formatSAR(invoice.total, locale)}</td>
                      <td className="px-3 py-2">
                        <Badge tone={invoice.zatcaStatus === 'reported' ? 'success' : invoice.zatcaStatus === 'pending' ? 'warning' : 'neutral'}>
                          {invoice.zatcaStatus}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={STATUS_TONE[invoice.status]} dot>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-end">
                        <span className="inline-flex gap-1">
                          {invoice.zatcaStatus === 'pending' ? (
                            <Button size="icon-sm" variant="ghost" aria-label="Report to ZATCA" onClick={() => zatca.mutate(invoice.id)}>
                              <Send className="size-3.5 text-primary" />
                            </Button>
                          ) : null}
                          {invoice.status === 'sent' || invoice.status === 'overdue' ? (
                            <Button size="icon-sm" variant="ghost" aria-label="Mark paid" onClick={() => paid.mutate(invoice.id)}>
                              <Check className="size-3.5 text-success" />
                            </Button>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!isLoading && rows.length === 0 ? <EmptyState title="No invoices" description="Nothing matches those filters." /> : null}
        <div className="border-t border-line bg-surface-2 px-3 py-2 text-[10.5px] text-ink-4">
          {rows.length} invoices · VAT 15% · payment terms 30 days
        </div>
      </Card>

      <PageFooter note="Invoices are generated as UBL 2.1 and cleared through Fatoora." right="Sandbox — no real clearance request is sent" />
    </>
  );
}
