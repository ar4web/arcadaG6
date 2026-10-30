import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Award, CalendarClock, Target, TrendingUp } from 'lucide-react';
import { listCycles, nineBox, performanceByDepartment, topPerformers } from '@/services/performance';
import { displayName } from '@/lib/mock/db';
import { useUIStore } from '@/stores/ui';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeading } from '@/components/ui/card';
import { Avatar, Badge, EmptyState, Progress, Skeleton } from '@/components/ui/misc';
import { BarCompare, ChartCard } from '@/components/charts/primitives';
import { useChartPalette } from '@/components/charts/theme';
import { methodology } from '@/lib/copy';
import { MethodologyNote, PageFooter, PageHeader } from '@/modules/shell/PageHeader';

const BANDS = {
  performance: ['Below', 'Meets', 'Exceeds'],
  potential: ['Growth', 'Strong', 'High potential'],
} as const;

export default function Performance() {
  const locale = useUIStore((s) => s.locale);
  const palette = useChartPalette();
  const [selected, setSelected] = React.useState<string | null>(null);

  const { data: boxes, isLoading } = useQuery({ queryKey: ['nine-box'], queryFn: nineBox });
  const { data: cycles } = useQuery({ queryKey: ['cycles'], queryFn: listCycles });
  const { data: byDepartment } = useQuery({ queryKey: ['perf-department'], queryFn: performanceByDepartment });
  const { data: top } = useQuery({ queryKey: ['top-performers'], queryFn: () => topPerformers(6) });

  const activeCycle = cycles?.find((cycle) => cycle.status === 'active');
  const selectedBox = selected && boxes ? boxes[selected] : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Workforce · Talent review"
        title="Performance & potential"
        description="The nine-box view used in calibration. Click a cell to see who sits inside it."
        actions={
          <Button variant="secondary" size="sm">
            <CalendarClock className="size-3.5" /> Calibration
          </Button>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: 'Active cycle', value: activeCycle?.name ?? '—', hint: `Due ${activeCycle ? formatDate(activeCycle.dueDate, 'd MMM', locale) : '—'}`, small: true },
          { label: 'Reviews completed', value: `${activeCycle?.completed ?? 0}/${activeCycle?.participants ?? 0}`, hint: `${Math.round(((activeCycle?.completed ?? 0) / Math.max(1, activeCycle?.participants ?? 1)) * 100)}% of participants` },
          { label: 'High performers', value: formatNumber((boxes?.['3-3']?.employees.length ?? 0) + (boxes?.['3-2']?.employees.length ?? 0)), hint: 'exceeding expectations' },
          { label: 'Needs support', value: formatNumber((boxes?.['1-1']?.employees.length ?? 0) + (boxes?.['1-2']?.employees.length ?? 0)), hint: 'below expectations' },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5">
            <p className="text-[10.5px] text-ink-3">{stat.label}</p>
            <p className={cn('num mt-1 font-semibold leading-none text-ink', stat.small ? 'text-[12.5px]' : 'text-[20px]')}>{stat.value}</p>
            <p className="mt-1 truncate text-[9.5px] text-ink-4">{stat.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeading
            title="9-box talent grid"
            description="Performance on the horizontal axis, potential on the vertical."
            action={<Badge tone="accent">H2 2026</Badge>}
          />
          <div className="px-5 pb-5">
            <div className="flex gap-2">
              <div className="flex items-center">
                <span className="-rotate-90 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-4">Potential</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-3 gap-1.5">
                  {[3, 2, 1].map((potential) =>
                    [1, 2, 3].map((performance) => {
                      const key = `${performance}-${potential}`;
                      const cell = boxes?.[key];
                      const count = cell?.employees.length ?? 0;
                      const isSelected = selected === key;
                      const warm = performance === 3 && potential === 3;
                      return (
                        <button
                          key={key}
                          onClick={() => setSelected(isSelected ? null : key)}
                          className={cn(
                            'relative flex h-20 flex-col justify-between rounded-md border p-2 text-start transition-all',
                            isSelected ? 'border-primary ring-2 ring-primary-ring/30' : 'border-line hover:border-line-2',
                            warm ? 'bg-primary-soft/60' : performance === 1 && potential === 1 ? 'bg-danger-soft/40' : 'bg-surface-2',
                          )}
                        >
                          <span className="num text-[17px] font-semibold leading-none text-ink">{count}</span>
                          <span className="flex -space-x-1.5">
                            {cell?.employees.slice(0, 3).map((employee) => (
                              <Avatar key={employee.id} name={displayName(employee)} hue={employee.avatarHue} size="xs" ring className="size-5 text-[7px]" />
                            ))}
                            {count > 3 ? <span className="grid size-5 place-items-center rounded-full bg-surface-3 text-[7.5px] font-semibold text-ink-3 ring-2 ring-surface">+{count - 3}</span> : null}
                          </span>
                        </button>
                      );
                    }),
                  )}
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {BANDS.performance.map((band) => (
                    <span key={band} className="text-center text-[9px] font-medium uppercase tracking-wide text-ink-4">
                      {band}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex w-3 flex-col justify-between py-1">
                {[...BANDS.potential].reverse().map((band) => (
                  <span key={band} className="whitespace-nowrap text-[8px] uppercase tracking-wide text-ink-4" style={{ writingMode: 'vertical-rl' }}>
                    {band}
                  </span>
                ))}
              </div>
            </div>

            {selectedBox ? (
              <div className="mt-3 rounded-md border border-line bg-surface-2 p-3">
                <p className="mb-2 text-[10.5px] font-semibold text-ink-2">
                  {BANDS.performance[selectedBox.performance - 1]} performance · {BANDS.potential[selectedBox.potential - 1]}
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {selectedBox.employees.map((employee) => (
                    <div key={employee.id} className="flex items-center gap-2 rounded bg-surface px-2 py-1.5">
                      <Avatar name={displayName(employee)} hue={employee.avatarHue} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium text-ink">{displayName(employee)}</span>
                        <span className="block truncate text-[9px] text-ink-4">{employee.jobTitle}</span>
                      </span>
                      <span className="num text-[10.5px] text-ink-3">{employee.performance.rating.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[9.5px] text-ink-4">Select a cell to list the people inside it.</p>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <CardHeading title="Review cycles" description="Open and recent calibration rounds." />
            <div className="flex flex-col px-5 pb-5">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                cycles?.map((cycle) => (
                  <div key={cycle.id} className="border-b border-line py-2 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[11.5px] font-medium text-ink">{cycle.name}</p>
                      <Badge tone={cycle.status === 'active' ? 'primary' : cycle.status === 'closed' ? 'success' : 'neutral'}>{cycle.status}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Progress value={(cycle.completed / Math.max(1, cycle.participants)) * 100} className="flex-1" tone="accent" height="h-1" />
                      <span className="num text-[9.5px] text-ink-4">
                        {cycle.completed}/{cycle.participants}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeading
              title="Top performers"
              description="Highest rated in the last closed cycle."
              action={
                <Button variant="ghost" size="xs">
                  <ArrowUpRight className="size-3" />
                </Button>
              }
            />
            <div className="flex flex-col px-5 pb-5">
              {top?.map((employee, index) => (
                <div key={employee.id} className="flex items-center gap-2 border-b border-line py-1.5 last:border-0">
                  <span className="num w-4 text-[9.5px] text-ink-4">{index + 1}</span>
                  <Avatar name={displayName(employee)} hue={employee.avatarHue} size="xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium text-ink">{displayName(employee)}</span>
                    <span className="block truncate text-[9px] text-ink-4">{employee.jobTitle}</span>
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-warning">
                    <Award className="size-3" />
                    {employee.performance.rating.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard title="Goal completion by department" description="Against an 80% target." bodyClassName="px-2">
          <BarCompare
            data={(byDepartment ?? []).map((row) => ({ label: row.department, goals: row.goals, target: 80 }))}
            xKey="label"
            series={[
              { key: 'goals', label: 'Completion', color: palette.series[2]! },
              { key: 'target', label: 'Target', color: palette.series[7]! },
            ]}
            height={200}
            formatter={(value) => `${value}%`}
          />
        </ChartCard>

        <Card>
          <CardHeading title="Rating distribution" description="Average rating and spread by department." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px]">
              <thead>
                <tr className="border-y border-line bg-surface-2">
                  {['Department', 'Average', 'High', 'Below', 'Goals'].map((heading) => (
                    <th key={heading} className="px-3 py-1.5 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {byDepartment?.map((row) => (
                  <tr key={row.department} className="hover:bg-surface-2">
                    <td className="px-3 py-1.5 text-[11.5px] text-ink-2">{row.department}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-ink-2">{row.average.toFixed(2)}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-success">{row.high}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-danger">{row.low}</td>
                    <td className="num px-3 py-1.5 text-[11px] text-ink-3">{row.goals}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!byDepartment?.length ? <EmptyState title="No reviews yet" icon={<Target className="size-5" />} /> : null}
        </Card>
      </div>

      <MethodologyNote>{methodology.engagement}</MethodologyNote>
      <PageFooter note="Calibration decisions require human review." right="Ratings are indicative, not automated decisions" />
    </>
  );
}

export { TrendingUp };
