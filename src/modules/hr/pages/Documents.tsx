import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Search, Upload } from 'lucide-react';
import { listDocuments } from '@/services/documents';
import { displayName, getEmployee } from '@/lib/mock/db';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, Badge, EmptyState, Skeleton } from '@/components/ui/misc';
import { Input, NativeSelect } from '@/components/ui/input';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';

const TYPES = ['all', 'iqama', 'passport', 'contract', 'insurance', 'national_id', 'work_permit', 'certificate'];

export default function Documents({ self = false }: { self?: boolean }) {
  const locale = useUIStore((s) => s.locale);
  const session = useAuthStore((s) => s.session);
  const [type, setType] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const employeeId = self ? session?.employeeId : undefined;
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents-page', employeeId, type],
    queryFn: () => listDocuments({ employeeId, type }),
  });

  const rows = (documents ?? []).filter((document) => {
    if (!search) return true;
    const employee = getEmployee(document.employeeId);
    return `${document.name} ${employee ? displayName(employee) : ''}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      <PageHeader
        eyebrow={self ? 'My workspace' : 'Workforce · Records'}
        title={self ? 'My documents' : 'Documents'}
        description={
          self
            ? 'Your contracts, iqama, insurance card and certificates. Downloads are audit-logged.'
            : 'One place for statutory documents, contracts and certificates. Expiry is tracked automatically.'
        }
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Download className="size-3.5" /> Export list
            </Button>
            <Button variant="primary" size="sm">
              <Upload className="size-3.5" /> Upload
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents…" icon={<Search />} className="h-8 max-w-xs text-[11.5px]" />
        <NativeSelect value={type} onChange={(event) => setType(event.target.value)} className="h-8 w-auto text-[11.5px]">
          {TYPES.map((option) => (
            <option key={option} value={option}>
              {option === 'all' ? 'All types' : option.replace('_', ' ')}
            </option>
          ))}
        </NativeSelect>
        <span className="ms-auto text-[10.5px] text-ink-4">{rows.length} documents</span>
      </div>

      <Card flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                {['Document', self ? 'Type' : 'Employee', 'Issued', 'Expires', 'Size', 'Status'].map((heading) => (
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
                      <td colSpan={6} className="p-2">
                        <Skeleton className="h-7 w-full" />
                      </td>
                    </tr>
                  ))
                : rows.slice(0, 60).map((document) => {
                    const employee = getEmployee(document.employeeId);
                    return (
                      <tr key={document.id} className="transition-colors hover:bg-surface-2">
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2">
                            <span className="grid size-6 shrink-0 place-items-center rounded bg-surface-3 text-ink-4">
                              <FileText className="size-3" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[11.5px] text-ink-2">{document.name}</span>
                              <span className="block truncate text-[9px] text-ink-4">{document.filesBucket}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {self ? (
                            <span className="text-[11px] capitalize text-ink-3">{document.type.replace('_', ' ')}</span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Avatar name={displayName(employee!)} hue={employee?.avatarHue} size="xs" className="size-5 text-[7px]" />
                              <span className="truncate text-[11px] text-ink-3">{displayName(employee!)}</span>
                            </span>
                          )}
                        </td>
                        <td className="num px-3 py-2 text-[10.5px] text-ink-4">{formatDate(document.issuedAt, 'd MMM yyyy', locale)}</td>
                        <td className={cn('num px-3 py-2 text-[10.5px]', document.status === 'expired' ? 'text-danger' : document.status === 'expiring' ? 'text-warning' : 'text-ink-4')}>
                          {document.expiresAt ? formatDate(document.expiresAt, 'd MMM yyyy', locale) : 'No expiry'}
                        </td>
                        <td className="num px-3 py-2 text-[10.5px] text-ink-4">{document.sizeKb > 1024 ? `${(document.sizeKb / 1024).toFixed(1)} MB` : `${document.sizeKb} KB`}</td>
                        <td className="px-3 py-2">
                          <Badge tone={document.status === 'expired' ? 'danger' : document.status === 'expiring' ? 'warning' : 'success'} dot>
                            {document.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        {!isLoading && rows.length === 0 ? <EmptyState title="No documents" description="Upload a file to get started." icon={<FileText className="size-5" />} /> : null}
        <div className="border-t border-line bg-surface-2 px-3 py-2 text-[10.5px] text-ink-4">
          Showing {Math.min(60, rows.length)} of {rows.length} · bucket policies restrict access to the owner and HR admins
        </div>
      </Card>

      <PageFooter note="Documents are stored in Supabase Storage buckets." right="5 buckets: hr-documents, payslips, contracts, avatars, receipts" />
    </>
  );
}
