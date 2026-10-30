import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, CreditCard, Mail, MapPin, Phone, Save, ShieldCheck, User } from 'lucide-react';
import { leaveBalances } from '@/services/leave';
import { db, displayName, getEmployee } from '@/lib/mock/db';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { formatDate, maskIban } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Avatar, Badge, Progress, Skeleton } from '@/components/ui/misc';
import { Field, Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';
import { toast } from '@/components/ui/toast';

export default function EssProfile() {
  const locale = useUIStore((s) => s.locale);
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? db.employees[0]!.id;
  const employee = getEmployee(employeeId);
  const { data: balances } = useQuery({ queryKey: ['my-balances', employeeId], queryFn: () => leaveBalances(employeeId) });
  const [phone, setPhone] = React.useState(employee?.phone ?? '');

  if (!employee) return <Skeleton className="h-72 w-full rounded-lg" />;

  const department = db.departments.find((dept) => dept.id === employee.departmentId);
  const location = db.locations.find((loc) => loc.id === employee.locationId);

  return (
    <>
      <PageHeader
        eyebrow="My workspace"
        title="My profile"
        description="Keep your contact details current — payroll and insurance depend on them."
        actions={
          <Button variant="primary" size="sm" onClick={() => toast.success('Profile saved')}>
            <Save className="size-3.5" /> Save
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeading title="Personal details" description="Changes to legal name or national ID require HR verification." />
          <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2">
            <Field label="First name">
              <Input defaultValue={employee.firstName} />
            </Field>
            <Field label="Last name">
              <Input defaultValue={employee.lastName} />
            </Field>
            <Field label="الاسم بالعربية">
              <Input defaultValue={employee.nameAr} dir="rtl" />
            </Field>
            <Field label="Work email">
              <Input defaultValue={employee.email} icon={<Mail />} disabled />
            </Field>
            <Field label="Mobile">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} icon={<Phone />} />
            </Field>
            <Field label="Date of birth">
              <Input type="date" defaultValue={employee.birthDate} disabled />
            </Field>
            <Field label="Nationality" hint="Changing nationality affects GOSI contributions.">
              <Input defaultValue={employee.nationality} disabled />
            </Field>
            <Field label="National ID / Iqama">
              <Input defaultValue={employee.nationalId} disabled />
            </Field>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <div className="flex flex-col items-center gap-2 px-5 pt-5 pb-3 text-center">
              <Avatar name={displayName(employee)} hue={employee.avatarHue} size="xl" />
              <div>
                <p className="text-[13px] font-semibold text-ink">{displayName(employee)}</p>
                <p className="text-[10.5px] text-ink-4">{employee.jobTitle}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                <Badge tone="neutral">
                  <Building2 className="size-2.5" /> {department?.name}
                </Badge>
                <Badge tone="neutral">
                  <MapPin className="size-2.5" /> {location?.city}
                </Badge>
                {session?.mfaEnabled ? (
                  <Badge tone="success">
                    <ShieldCheck className="size-2.5" /> MFA
                  </Badge>
                ) : null}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeading title="Leave balances" description="Current leave year." />
            <div className="flex flex-col gap-2.5 px-5 pb-5">
              {balances?.map((balance) => (
                <div key={balance.type}>
                  <div className="mb-1 flex items-center justify-between text-[10.5px]">
                    <span className="capitalize text-ink-3">{balance.type}</span>
                    <span className="num text-ink-2">{balance.remaining} / {balance.entitlement}</span>
                  </div>
                  <Progress value={(balance.taken / Math.max(1, balance.entitlement)) * 100} tone="accent" height="h-1" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeading title="Payroll details" description="Used for WPS salary transfers." action={<CreditCard className="size-4 text-ink-4" />} />
          <div className="flex flex-col gap-2 px-5 pb-5 text-[11.5px]">
            {[
              ['Bank', employee.bankName],
              ['IBAN', maskIban(employee.iban)],
              ['GOSI number', employee.gosiNumber],
              ['Employee number', employee.employeeNo],
              ['Grade', employee.grade],
              ['Joined', formatDate(employee.hireDate, 'd MMMM yyyy', locale)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-line pb-1.5 last:border-0">
                <span className="text-ink-4">{label}</span>
                <span className="num text-ink-2">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeading title="Privacy & preferences" description="You control what is visible to your team." />
          <div className="flex flex-col gap-3 px-5 pb-5">
            {[
              ['Show my birthday to the team', true],
              ['Include me in the anniversary digest', true],
              ['Allow analytics to use my engagement score', false],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11.5px] text-ink-2">{label}</p>
                  <p className="text-[9.5px] text-ink-4">PDPL consent recorded with a timestamp.</p>
                </div>
                <Switch defaultChecked={Boolean(value)} aria-label={String(label)} />
              </div>
            ))}
            <div className="flex items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-2 text-[10px] text-ink-3">
              <User className="size-3" /> Data residency: Riyadh, Saudi Arabia
            </div>
          </div>
        </Card>
      </div>

      <PageFooter note="Your data, your control." right="Consent changes are audit-logged" />
    </>
  );
}
