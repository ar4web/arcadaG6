import * as React from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Employee } from '@/types';
import { db, departmentMap, displayName, getEmployee } from '@/lib/mock/db';
import { useUIStore } from '@/stores/ui';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Avatar, Badge } from '@/components/ui/misc';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';

function Node({ employee, depth = 0 }: { employee: Employee; depth?: number }) {
  const [open, setOpen] = React.useState(depth < 2);
  const reports = db.employees.filter((item) => item.managerId === employee.id && item.status !== 'terminated');
  const department = departmentMap.get(employee.departmentId);

  return (
    <li className="relative">
      <div className={cn('relative flex items-start gap-2', depth > 0 && 'ps-5 pt-2')}>
        {depth > 0 ? (
          <span aria-hidden="true" className="absolute start-0 top-0 h-6 w-4 rounded-bl-md border-b border-s border-line" style={{ borderBottomLeftRadius: 6 }} />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 shadow-xs">
            <Avatar name={displayName(employee)} hue={employee.avatarHue} size="sm" />
            <Link to={`/hr/people/${employee.id}`} className="min-w-0">
              <p className="truncate text-[11.5px] font-medium text-ink hover:text-primary">{displayName(employee)}</p>
              <p className="truncate text-[9.5px] text-ink-4">
                {employee.jobTitle} · {department?.code}
              </p>
            </Link>
            {reports.length ? (
              <button onClick={() => setOpen((value) => !value)} className="ms-1 grid size-5 place-items-center rounded text-ink-4 hover:bg-surface-3" aria-label={open ? 'Collapse' : 'Expand'}>
                {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3 rtl:rotate-180" />}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {open && reports.length ? (
        <ul className="ms-3 border-s border-line">
          {reports.map((report) => (
            <Node key={report.id} employee={report} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function OrgChart() {
  const locale = useUIStore((s) => s.locale);
  const roots = db.employees.filter((employee) => employee.status !== 'terminated' && !employee.managerId && employee.grade.startsWith('M'));
  const ceo = roots[0] ?? getEmployee(db.departments[0]!.headId)!;

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Organisation chart"
        description="Reporting lines generated from the manager field. Expand a node to see the team underneath."
        actions={<Badge tone="neutral">{db.employees.filter((employee) => employee.status !== 'terminated').length} employees</Badge>}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Card className="overflow-x-auto p-4 lg:col-span-3">
          <ul className="min-w-[28rem]">
            <Node employee={ceo} />
          </ul>
        </Card>
        <Card className="p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-ink">
            <Users className="size-3.5" /> Span of control
          </p>
          <div className="flex flex-col gap-1.5">
            {db.departments.map((department) => {
              const head = getEmployee(department.headId);
              const reports = head ? db.employees.filter((employee) => employee.managerId === head.id && employee.status !== 'terminated').length : 0;
              return (
                <div key={department.id} className="flex items-center justify-between text-[10.5px]">
                  <span className="truncate text-ink-3">{department.name}</span>
                  <span className="num text-ink-2">{reports}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <PageFooter note={`Org chart as of ${new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-GB')}`} />
    </>
  );
}
