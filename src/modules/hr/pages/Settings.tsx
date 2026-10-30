import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, KeyRound, Plug, Save, ShieldCheck } from 'lucide-react';
import { getSettings, updateSettings, type WorkspaceSettings } from '@/services/settings';
import { ROLES } from '@/lib/mock/master';
import { useUIStore } from '@/stores/ui';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Badge, Skeleton } from '@/components/ui/misc';
import { Field, Input, NativeSelect } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';
import { toast } from 'sonner';

const PERMISSION_LABELS: Record<string, string> = {
  'employees.read': 'View employees',
  'employees.write': 'Edit employees',
  'employees.delete': 'Delete employees',
  'leave.approve': 'Approve leave',
  'payroll.read': 'View payroll',
  'payroll.write': 'Prepare payroll',
  'payroll.approve': 'Approve payroll',
  'finance.read': 'View finance',
  'finance.write': 'Post finance entries',
  'recruitment.write': 'Manage recruitment',
  'performance.write': 'Manage reviews',
  'compliance.read': 'View compliance',
  'settings.write': 'Change settings',
  'audit.read': 'Read audit log',
};

const INTEGRATIONS = [
  { name: 'Google Workspace', description: 'SSO and directory sync', status: 'connected' },
  { name: 'GOSI portal', description: 'Contribution filing', status: 'connected' },
  { name: 'ZATCA Fatoora', description: 'E-invoicing clearance', status: 'connected' },
  { name: 'Mudad / WPS', description: 'Wage protection uploads', status: 'connected' },
  { name: 'Qiwa', description: 'Contract authentication', status: 'pending' },
  { name: 'Slack', description: 'Notifications and approvals', status: 'disconnected' },
];

export default function Settings() {
  const locale = useUIStore((s) => s.locale);
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  // Edits are a patch on top of the fetched record, so a refetch never
  // clobbers what the user is typing.
  const [edits, setEdits] = React.useState<Partial<WorkspaceSettings>>({});
  const draft = React.useMemo<WorkspaceSettings | null>(
    () => (settings ? { ...settings, ...edits } : null),
    [settings, edits],
  );

  const save = useMutation({
    mutationFn: (patch: WorkspaceSettings) => updateSettings(patch),
    onSuccess: (_data, saved) => {
      setEdits({});
      queryClient.setQueryData(['settings'], saved);
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Workspace settings saved');
    },
  });

  if (isLoading || !draft) return <Skeleton className="h-96 w-full rounded-lg" />;

  const update = (patch: Partial<WorkspaceSettings>) => setEdits((prev) => ({ ...prev, ...patch }));

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="Workspace identity, statutory policy and the permission matrix. Changes are audit-logged."
        actions={
          <Button variant="primary" size="sm" loading={save.isPending} onClick={() => save.mutate(draft)}>
            <Save className="size-3.5" /> Save changes
          </Button>
        }
      />

      <Tabs defaultValue="workspace">
        <TabsList className="mb-3">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="policy">Leave policy</TabsTrigger>
          <TabsTrigger value="roles">Roles & permissions</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeading title="Legal entity" description="Used on payslips, contracts and ZATCA invoices." action={<Building2 className="size-4 text-ink-4" />} />
              <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2">
                <Field label="Legal name">
                  <Input value={draft.name} onChange={(event) => update({ name: event.target.value })} />
                </Field>
                <Field label="الاسم التجاري">
                  <Input value={draft.nameAr} onChange={(event) => update({ nameAr: event.target.value })} dir="rtl" />
                </Field>
                <Field label="VAT number" hint="15 digits, starts with 3">
                  <Input value={draft.vatNumber} onChange={(event) => update({ vatNumber: event.target.value })} />
                </Field>
                <Field label="Commercial registration">
                  <Input value={draft.crNumber} onChange={(event) => update({ crNumber: event.target.value })} />
                </Field>
                <Field label="GOSI establishment number">
                  <Input value={draft.gosiNumber} onChange={(event) => update({ gosiNumber: event.target.value })} />
                </Field>
                <Field label="Default timezone">
                  <NativeSelect value={draft.timezone} onChange={(event) => update({ timezone: event.target.value })}>
                    <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  </NativeSelect>
                </Field>
                <Field label="Workweek" className="sm:col-span-2">
                  <NativeSelect value={draft.workweek} onChange={(event) => update({ workweek: event.target.value })}>
                    <option value="sunday–thursday">Sunday – Thursday</option>
                    <option value="monday–friday">Monday – Friday</option>
                  </NativeSelect>
                </Field>
              </div>
            </Card>

            <Card>
              <CardHeading title="Statutory modules" description="Enable what this workspace files." />
              <div className="flex flex-col gap-3 px-5 pb-5">
                {[
                  { key: 'gosiEnabled' as const, label: 'GOSI contributions', description: 'Compute employee and employer shares each run.' },
                  { key: 'wpsEnabled' as const, label: 'Wage Protection System', description: 'Generate the SIF file for the bank.' },
                  { key: 'zatcaEnabled' as const, label: 'ZATCA e-invoicing', description: 'Report invoices to Fatoora in real time.' },
                  { key: 'pdplConsent' as const, label: 'PDPL consent tracking', description: 'Record lawful basis for employee data.' },
                ].map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-medium text-ink">{item.label}</p>
                      <p className="text-[10px] leading-relaxed text-ink-4">{item.description}</p>
                    </div>
                    <Switch checked={draft[item.key]} onCheckedChange={(checked) => update({ [item.key]: checked })} aria-label={item.label} />
                  </div>
                ))}
                <div className="mt-1 flex items-center gap-1.5 rounded-md bg-success-soft px-2.5 py-1.5 text-[10px] text-success">
                  <ShieldCheck className="size-3" /> Data residency: Saudi Arabia (Riyadh region)
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="policy">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeading title="Annual leave" description="Applies to new contracts; existing balances are preserved." />
              <div className="grid grid-cols-2 gap-3 px-5 pb-5">
                <Field label="Entitlement (days)">
                  <Input type="number" value={draft.annualEntitlement} onChange={(event) => update({ annualEntitlement: Number(event.target.value) })} />
                </Field>
                <Field label="Carry-over cap (days)">
                  <Input type="number" value={draft.carryOverCap} onChange={(event) => update({ carryOverCap: Number(event.target.value) })} />
                </Field>
                <Field label="Probation period (days)" className="col-span-2" hint="Article 53 caps probation at 90 days, extendable once by written agreement.">
                  <Input type="number" value={draft.probationDays} onChange={(event) => update({ probationDays: Number(event.target.value) })} />
                </Field>
              </div>
            </Card>
            <Card>
              <CardHeading title="Notifications" description="How the workspace nudges approvers." />
              <div className="flex flex-col gap-3 px-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11.5px] font-medium text-ink">Daily email digest</p>
                    <p className="text-[10px] text-ink-4">Pending approvals at 08:00 Riyadh time.</p>
                  </div>
                  <Switch checked={draft.emailDigest} onCheckedChange={(checked) => update({ emailDigest: checked })} />
                </div>
                <div className="rounded-md border border-line bg-surface-2 p-2.5 text-[10px] leading-relaxed text-ink-3">
                  Escalation: requests untouched for 48 hours are escalated to the department head, then to the CPO at 96 hours.
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <Card flush>
            <CardHeading title="Permission matrix" description="UI permissions are a preview only — enforcement lives server-side." action={<Badge tone="warning">Preview</Badge>} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-y border-line bg-surface-2">
                    <th className="px-3 py-2 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">Permission</th>
                    {ROLES.map((role) => (
                      <th key={role.id} className="px-2 py-2 text-center text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {Object.entries(PERMISSION_LABELS).map(([permission, label]) => (
                    <tr key={permission} className="hover:bg-surface-2">
                      <td className="px-3 py-1.5 text-[11.5px] text-ink-2">{label}</td>
                      {ROLES.map((role) => {
                        const granted = role.id === 'admin' || role.permissions.includes(permission as never);
                        return (
                          <td key={role.id} className="px-2 py-1.5 text-center">
                            {granted ? (
                              <span className="mx-auto grid size-4 place-items-center rounded-full bg-accent-soft text-accent">
                                <Check className="size-2.5" />
                              </span>
                            ) : (
                              <span className="mx-auto block size-1 rounded-full bg-line-strong" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 border-t border-line bg-surface-2 px-3 py-2 text-[10px] text-ink-4">
              <KeyRound className="size-3" /> Row-level security enforces workspace isolation; the matrix above is descriptive.
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((integration) => (
              <Card key={integration.name} className="p-3.5">
                <div className="flex items-start justify-between">
                  <span className="grid size-7 place-items-center rounded-md bg-surface-3 text-ink-3">
                    <Plug className="size-3.5" />
                  </span>
                  <Badge tone={integration.status === 'connected' ? 'success' : integration.status === 'pending' ? 'warning' : 'neutral'} dot>
                    {integration.status}
                  </Badge>
                </div>
                <p className="mt-2 text-[12px] font-semibold text-ink">{integration.name}</p>
                <p className="mt-0.5 text-[10.5px] text-ink-4">{integration.description}</p>
                <Button variant="secondary" size="xs" className="mt-2.5 w-full">
                  {integration.status === 'connected' ? 'Manage connection' : 'Connect'}
                </Button>
              </Card>
            ))}
          </div>
          <p className={cn('mt-3 text-[10px] text-ink-4')}>Secrets are stored server-side; the browser never sees a provider key.</p>
        </TabsContent>
      </Tabs>

      <PageFooter note={`Region ${locale === 'ar' ? 'السعودية' : 'Saudi Arabia'} · ${draft.timezone}`} right="Last saved just now" />
    </>
  );
}
