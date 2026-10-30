import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Briefcase,
  CalendarDays,
  Download,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getEmployee as fetchEmployee } from '@/services/employees';
import { leaveBalances, listLeaveRequests } from '@/services/leave';
import { goalsFor } from '@/services/performance';
import { payslipsFor } from '@/services/payroll';
import { listDocuments } from '@/services/documents';
import { chainOfCommand, departmentMap, directReports, displayName, getEmployee, locationMap } from '@/lib/mock/db';
import { useUIStore } from '@/stores/ui';
import { cn, daysFromToday, formatDate, formatSAR, maskIban, relativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Avatar, Badge, EmptyState, InfoTip, Progress, Skeleton } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress as Meter } from '@/components/ui/misc';
import { PageFooter } from '@/modules/shell/PageHeader';
import { STATUS_TONE } from './People';

/** Completed years of service, measured against the workspace clock. */
function tenureYears(hireDate: string) {
  return daysFromToday(hireDate) !== undefined ? Math.abs(daysFromToday(hireDate)!) / 365.25 : 0;
}

export default function PersonProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const locale = useUIStore((s) => s.locale);

  const { data: employee, isLoading } = useQuery({ queryKey: ['employee', id], queryFn: () => fetchEmployee(id!), enabled: Boolean(id) });
  const { data: balances } = useQuery({ queryKey: ['balances', id], queryFn: () => leaveBalances(id!), enabled: Boolean(id) });
  const { data: leave } = useQuery({ queryKey: ['leave', id], queryFn: () => listLeaveRequests({ employeeId: id }), enabled: Boolean(id) });
  const { data: goals } = useQuery({ queryKey: ['goals', id], queryFn: () => goalsFor(id!), enabled: Boolean(id) });
  const { data: payslips } = useQuery({ queryKey: ['payslips', id], queryFn: () => payslipsFor(id!), enabled: Boolean(id) });
  const { data: documents } = useQuery({ queryKey: ['documents', id], queryFn: () => listDocuments({ employeeId: id }), enabled: Boolean(id) });

  if (isLoading || !employee) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-36 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const department = departmentMap.get(employee.departmentId);
  const location = locationMap.get(employee.locationId);
  const manager = getEmployee(employee.managerId);
  const reports = directReports(employee.id);
  const chain = chainOfCommand(employee);
  const gross = employee.salary.basic + employee.salary.housing + employee.salary.transport + employee.salary.allowances;
  const annual = balances?.find((balance) => balance.type === 'annual');

  return (
    <>
      <button className="mb-3 inline-flex items-center gap-1 text-[11.5px] text-ink-3 hover:text-ink" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-3.5 rtl:rotate-180" /> Back to directory
      </button>

      <Card className="mb-3 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-accent-soft via-canvas-raised to-primary-soft" />
        <div className="flex flex-col gap-4 px-5 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Avatar name={displayName(employee)} hue={employee.avatarHue} size="xl" ring className="-mt-8 ring-4" />
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[21px] font-extrabold tracking-[-0.02em] text-ink">{displayName(employee)}</h1>
                <Badge tone={STATUS_TONE[employee.status].tone} dot>
                  {STATUS_TONE[employee.status].label}
                </Badge>
                {employee.flightRisk === 'high' ? <Badge tone="danger">Flight risk</Badge> : null}
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-2">
                {employee.jobTitle} · {department?.name}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-4" dir="rtl">
                {employee.nameAr}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-ink-4">
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3" /> {employee.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3" /> {employee.phone}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {location?.name}
                </span>
                <span className="inline-flex items-center gap-1">
                  <BadgeCheck className="size-3" /> {employee.employeeNo}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm">
              <MessageSquare className="size-3.5" /> Message
            </Button>
            <Button variant="primary" size="sm">
              <Pencil className="size-3.5" /> Edit profile
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: 'Tenure', value: `${tenureYears(employee.hireDate).toFixed(1)} yrs`, hint: `Joined ${formatDate(employee.hireDate, 'd MMM yyyy', locale)}`, icon: Briefcase },
          { label: 'Gross monthly', value: formatSAR(gross, locale, { compact: true }), hint: 'Excludes GOSI employer share', icon: Banknote },
          { label: 'Annual leave left', value: `${annual?.remaining ?? 0} days`, hint: `${annual?.taken ?? 0} of ${annual?.entitlement ?? 0} taken`, icon: CalendarDays },
          { label: 'Direct reports', value: String(reports.length), hint: manager ? `Reports to ${displayName(manager)}` : 'No manager assigned', icon: Users },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5">
            <div className="flex items-start justify-between">
              <p className="text-[10.5px] text-ink-3">{stat.label}</p>
              <stat.icon className="size-3.5 text-ink-4" />
            </div>
            <p className="num mt-1.5 text-[17px] font-semibold tracking-[-0.02em] text-ink">{stat.value}</p>
            <p className="mt-0.5 truncate text-[9.5px] text-ink-4">{stat.hint}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeading title="Reporting line" description="Who this person works with." />
              <div className="space-y-0 px-5 pb-5">
                {[...chain].reverse().map((person, index) => (
                  <div key={person.id} className="relative flex items-center gap-2.5 border-s border-line pb-3 ps-4">
                    <span className="absolute -start-1 top-2 size-2 rounded-full bg-line-strong" style={{ background: index === 0 ? 'var(--ink-3)' : undefined }} />
                    <Avatar name={displayName(person)} hue={person.avatarHue} size="xs" />
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-medium text-ink">{displayName(person)}</p>
                      <p className="truncate text-[10px] text-ink-4">{person.jobTitle}</p>
                    </div>
                  </div>
                ))}
                <div className="relative flex items-center gap-2.5 ps-4">
                  <span className="absolute -start-1 top-2 size-2 rounded-full bg-primary" />
                  <Avatar name={displayName(employee)} hue={employee.avatarHue} size="xs" />
                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] font-semibold text-ink">{displayName(employee)}</p>
                    <p className="truncate text-[10px] text-ink-4">{employee.jobTitle}</p>
                  </div>
                </div>
                {reports.length ? (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-4">Direct reports</p>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {reports.map((report) => (
                        <Link
                          key={report.id}
                          to={`/hr/people/${report.id}`}
                          className="flex items-center gap-2 rounded-md border border-line px-2 py-1.5 transition-colors hover:border-line-2 hover:bg-surface-2"
                        >
                          <Avatar name={displayName(report)} hue={report.avatarHue} size="xs" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-medium text-ink">{displayName(report)}</span>
                            <span className="block truncate text-[9.5px] text-ink-4">{report.jobTitle}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              <Card>
                <CardHeading title="Engagement & growth" description="Latest pulse and review." />
                <div className="flex flex-col gap-3 px-5 pb-5">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10.5px]">
                      <span className="text-ink-3">Engagement</span>
                      <span className="num text-ink-2">{employee.engagement.toFixed(1)} / 10</span>
                    </div>
                    <Progress value={employee.engagement * 10} tone={employee.engagement < 7.5 ? 'warning' : 'accent'} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10.5px]">
                      <span className="text-ink-3">Goals completed</span>
                      <span className="num text-ink-2">
                        {employee.performance.goalsCompleted}/{employee.performance.goalsTotal}
                      </span>
                    </div>
                    <Progress value={(employee.performance.goalsCompleted / employee.performance.goalsTotal) * 100} tone="primary" />
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-surface-2 px-2.5 py-2">
                    <span className="text-[10.5px] text-ink-3">Performance rating</span>
                    <span className="num inline-flex items-center gap-1 text-[12px] font-semibold text-ink">
                      <TrendingUp className="size-3 text-accent" />
                      {employee.performance.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-ink-4">Last review {formatDate(employee.performance.lastReview, 'd MMM yyyy', locale)}</p>
                </div>
              </Card>

              <Card>
                <CardHeading title="Skills" description="From the HRIS profile." />
                <div className="flex flex-wrap gap-1.5 px-5 pb-5">
                  {employee.skills.length ? (
                    employee.skills.map((skill) => (
                      <Badge key={skill} tone="neutral">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-[10.5px] text-ink-4">No skills recorded yet.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="employment">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeading title="Contract" description="Employment terms and identifiers." />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-5 pb-5 text-[11.5px]">
                {[
                  ['Employment type', employee.employmentType.replace('_', ' ')],
                  ['Grade', employee.grade],
                  ['Department', department?.name ?? '—'],
                  ['Cost centre', department?.costCenter ?? '—'],
                  ['Start date', formatDate(employee.hireDate, 'd MMM yyyy', locale)],
                  ['Probation ends', formatDate(employee.hireDate, 'd MMM yyyy', locale)],
                  ['Nationality', employee.nationality],
                  ['National ID / Iqama', employee.nationalId.replace(/^(\d{3})\d{6}(\d)/, '$1••••••$2')],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[9.5px] uppercase tracking-wide text-ink-4">{label}</dt>
                    <dd className="truncate capitalize text-ink-2">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card>
              <CardHeading title="Compensation" description="Monthly breakdown in SAR." action={<InfoTip>Housing and transport follow the standard 25% and 10% of basic.</InfoTip>} />
              <div className="px-5 pb-3">
                {[
                  ['Basic', employee.salary.basic],
                  ['Housing', employee.salary.housing],
                  ['Transport', employee.salary.transport],
                  ['Other allowances', employee.salary.allowances],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-center justify-between border-b border-line py-1.5 text-[11.5px] last:border-0">
                    <span className="text-ink-3">{label}</span>
                    <span className="num text-ink-2">{formatSAR(Number(value), locale)}</span>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between rounded-md bg-surface-2 px-2.5 py-2 text-[12px] font-semibold">
                  <span className="text-ink-2">Gross monthly</span>
                  <span className="num text-ink">{formatSAR(gross, locale)}</span>
                </div>
              </div>
              <div className="mx-5 mb-4 rounded-md border border-line bg-surface-2 px-3 py-2 text-[10.5px]">
                <p className="flex items-center justify-between">
                  <span className="text-ink-4">Bank</span>
                  <span className="text-ink-2">{employee.bankName}</span>
                </p>
                <p className="mt-1 flex items-center justify-between">
                  <span className="text-ink-4">IBAN</span>
                  <span className="num text-ink-2">{maskIban(employee.iban)}</span>
                </p>
                <p className="mt-1 flex items-center justify-between">
                  <span className="text-ink-4">GOSI number</span>
                  <span className="num text-ink-2">{employee.gosiNumber}</span>
                </p>
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeading title="Compliance dates" description="Statutory document expiry." />
              <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-4">
                {[
                  ['Iqama', employee.compliance.iqamaExpiry],
                  ['Contract', employee.compliance.contractExpiry],
                  ['Medical insurance', employee.compliance.insuranceExpiry],
                  ['Passport', employee.compliance.passportExpiry],
                ].map(([label, value]) => {
                  const days = daysFromToday(value as string | undefined);
                  return (
                    <div key={label as string} className="rounded-md border border-line p-2.5">
                      <p className="text-[9.5px] uppercase tracking-wide text-ink-4">{label}</p>
                      <p className="num mt-0.5 text-[12px] text-ink-2">{value ? formatDate(String(value), 'd MMM yyyy', locale) : 'Not required'}</p>
                      {days !== undefined ? (
                        <Badge tone={days < 0 ? 'danger' : days < 45 ? 'warning' : 'success'} className="mt-1">
                          {days < 0 ? `${Math.abs(days)} days ago` : `${days} days left`}
                        </Badge>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leave">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card>
              <CardHeading title="Balances" description="Current leave year." />
              <div className="flex flex-col gap-3 px-5 pb-5">
                {balances?.map((balance) => (
                  <div key={balance.type}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="capitalize text-ink-2">{balance.type}</span>
                      <span className="num text-ink-3">
                        {balance.remaining} / {balance.entitlement} days
                      </span>
                    </div>
                    <Meter value={(balance.taken / Math.max(1, balance.entitlement)) * 100} tone="accent" />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeading title="Leave history" description="Requests in the last 12 months." />
              {leave?.length ? (
                <div className="px-5 pb-5">
                  {leave.slice(0, 8).map((request) => (
                    <div key={request.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-[11.5px] capitalize text-ink-2">{request.type.replace('_', ' ')}</p>
                        <p className="num truncate text-[9.5px] text-ink-4">
                          {formatDate(request.startDate, 'd MMM', locale)} – {formatDate(request.endDate, 'd MMM yyyy', locale)} · {request.days} days
                        </p>
                      </div>
                      <Badge tone={request.status === 'approved' ? 'success' : request.status === 'pending' ? 'warning' : 'danger'}>{request.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No leave recorded" />
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeading title="Goals" description="H2 2026 objectives and progress." />
              <div className="flex flex-col gap-3 px-5 pb-5">
                {goals?.length ? (
                  goals.map((goal) => (
                    <div key={goal.id}>
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 text-[11.5px] text-ink-2">{goal.title}</p>
                        <span className="num shrink-0 text-[10.5px] text-ink-4">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} tone={goal.status === 'at_risk' ? 'warning' : goal.status === 'done' ? 'accent' : 'primary'} />
                      <p className="mt-0.5 text-[9.5px] capitalize text-ink-4">
                        {goal.category} · weight {goal.weight}% · due {formatDate(goal.dueDate, 'd MMM', locale)}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No goals set" description="Goals appear once the cycle is activated." icon={<Target className="size-5" />} />
                )}
              </div>
            </Card>
            <Card>
              <CardHeading title="Payslips" description="Latest net pay." />
              <div className="px-5 pb-5">
                {payslips?.slice(0, 4).map((slip) => (
                  <div key={slip.id} className="flex items-center justify-between border-b border-line py-2 last:border-0">
                    <div>
                      <p className="num text-[11.5px] text-ink-2">{slip.period}</p>
                      <p className="text-[9.5px] text-ink-4">Net after deductions</p>
                    </div>
                    <span className="num text-[11.5px] font-medium text-ink">{formatSAR(slip.net, locale)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeading
              title="Documents"
              description="Statutory and contractual files."
              action={
                <Button size="xs" variant="secondary">
                  <Download className="size-3" /> Download all
                </Button>
              }
            />
            <div className="grid grid-cols-1 gap-2 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
              {documents?.length ? (
                documents.map((document) => (
                  <div key={document.id} className="flex items-start gap-2 rounded-md border border-line p-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded bg-surface-3 text-ink-4">
                      {document.type === 'iqama' ? <ShieldCheck className="size-3.5" /> : <FileText className="size-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium capitalize text-ink-2">{document.type.replace('_', ' ')}</p>
                      <p className="truncate text-[9.5px] text-ink-4">
                        {document.expiresAt ? `Expires ${formatDate(document.expiresAt, 'd MMM yyyy', locale)}` : `Uploaded ${relativeTime(document.issuedAt, locale)}`}
                      </p>
                      <Badge tone={document.status === 'expired' ? 'danger' : document.status === 'expiring' ? 'warning' : 'success'} className="mt-1">
                        {document.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No documents" description="Upload documents to complete the file." icon={<FileText className="size-5" />} />
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <PageFooter note={`Employee file ${employee.employeeNo}`} right={cn('Last updated', relativeTime(employee.createdAt, locale))} />
    </>
  );
}

