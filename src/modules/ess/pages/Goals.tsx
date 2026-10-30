import { useQuery } from '@tanstack/react-query';
import { Target, TrendingUp } from 'lucide-react';
import { goalsFor } from '@/services/performance';
import { db } from '@/lib/mock/db';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { cn, formatDate } from '@/lib/utils';
import { Card, CardHeading } from '@/components/ui/card';
import { Badge, EmptyState, Progress, Skeleton } from '@/components/ui/misc';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';

const STATUS_TONE = { on_track: 'success', at_risk: 'warning', done: 'accent', not_started: 'neutral' } as const;

export default function Goals() {
  const locale = useUIStore((s) => s.locale);
  const session = useAuthStore((s) => s.session);
  const employeeId = session?.employeeId ?? db.employees[0]!.id;
  const { data: goals, isLoading } = useQuery({ queryKey: ['my-goals', employeeId], queryFn: () => goalsFor(employeeId) });

  const average = goals?.length ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0;

  return (
    <>
      <PageHeader
        eyebrow="My workspace"
        title="My goals"
        description="H2 2026 objectives. Update progress before the review window closes on 30 November."
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: 'Goals set', value: goals?.length ?? 0 },
          { label: 'Average progress', value: `${average}%` },
          { label: 'On track', value: goals?.filter((goal) => goal.status === 'on_track').length ?? 0 },
          { label: 'At risk', value: goals?.filter((goal) => goal.status === 'at_risk').length ?? 0 },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5">
            <p className="text-[10.5px] text-ink-3">{stat.label}</p>
            <p className="num mt-1 text-[19px] font-semibold leading-none text-ink">{stat.value}</p>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : goals?.length ? (
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {goals.map((goal) => (
            <Card key={goal.id} className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-ink">{goal.title}</p>
                  <p className="mt-0.5 text-[9.5px] capitalize text-ink-4">
                    {goal.category} · weight {goal.weight}% · due {formatDate(goal.dueDate, 'd MMM', locale)}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[goal.status]} dot>
                  {goal.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <Progress value={goal.progress} tone={goal.status === 'at_risk' ? 'warning' : goal.status === 'done' ? 'accent' : 'primary'} />
                <span className={cn('num w-9 shrink-0 text-end text-[11px]', goal.progress >= 70 ? 'text-success' : 'text-ink-3')}>{goal.progress}%</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState title="No goals yet" description="Your manager sets goals during the planning window." icon={<Target className="size-5" />} />
        </Card>
      )}

      <Card className="mt-3">
        <CardHeading title="How goals are scored" description="Weighted average across all objectives." />
        <div className="flex items-start gap-2.5 px-5 pb-5">
          <span className="grid size-6 shrink-0 place-items-center rounded bg-accent-soft text-accent">
            <TrendingUp className="size-3.5" />
          </span>
          <p className="text-[10.5px] leading-relaxed text-ink-3">
            Each objective carries a weight. Completion contributes weight × progress to the score. Objectives at risk are flagged to your manager but do not affect your rating until calibration.
          </p>
        </div>
      </Card>

      <PageFooter note="Goal updates are visible to your manager." />
    </>
  );
}
