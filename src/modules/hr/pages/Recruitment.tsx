import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Briefcase, Filter, MapPin, Plus, Search, Star, Users } from 'lucide-react';
import type { Candidate, PipelineStage } from '@/types';
import { listCandidates, listJobs, moveCandidate } from '@/services/recruitment';
import { db, departmentMap, displayName, getEmployee } from '@/lib/mock/db';
import { useUIStore } from '@/stores/ui';
import { cn, formatDate, relativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeading } from '@/components/ui/card';
import { Avatar, Badge, EmptyState, Progress, Skeleton } from '@/components/ui/misc';
import { ChartCard, HorizontalBars } from '@/components/charts/primitives';
import { useChartPalette } from '@/components/charts/theme';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';

const STAGES: { id: PipelineStage; label: string; hint: string }[] = [
  { id: 'applied', label: 'Applied', hint: 'New applications' },
  { id: 'screening', label: 'Screening', hint: 'Phone screen' },
  { id: 'interview', label: 'Interview', hint: 'Panel rounds' },
  { id: 'offer', label: 'Offer', hint: 'Awaiting signature' },
  { id: 'hired', label: 'Hired', hint: 'Contract signed' },
];

function CandidateCard({ candidate, dragging }: { candidate: Candidate; dragging?: boolean }) {
  const job = db.jobs.find((item) => item.id === candidate.jobId);
  return (
    <div
      className={cn(
        'rounded-md border border-line bg-surface p-2.5 shadow-xs transition-shadow',
        dragging ? 'rotate-[1.5deg] shadow-lg' : 'hover:border-line-2 hover:shadow-sm',
      )}
    >
      <div className="flex items-start gap-2">
        <Avatar name={candidate.name} hue={candidate.avatarHue} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11.5px] font-medium text-ink">{candidate.name}</p>
          <p className="truncate text-[9.5px] text-ink-4">{job?.title ?? 'General application'}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-[9.5px] text-warning">
          {candidate.rating}
          <Star className="size-2.5 fill-current" />
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge tone="neutral">{candidate.source.replace('_', ' ')}</Badge>
        <Badge tone="outline">{candidate.nationality}</Badge>
      </div>
      <p className="mt-1.5 truncate text-[9px] text-ink-4">Applied {relativeTime(candidate.appliedAt, 'en')}</p>
    </div>
  );
}

function DraggableCandidate({ candidate }: { candidate: Candidate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: candidate.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <CandidateCard candidate={candidate} />
    </div>
  );
}

function StageColumn({ stage, candidates }: { stage: (typeof STAGES)[number]; candidates: Candidate[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-[15.5rem] shrink-0 flex-col rounded-lg border bg-surface-2/70 transition-colors',
        isOver ? 'border-primary/50 bg-primary-soft/40' : 'border-line',
      )}
    >
      <div className="flex items-center justify-between px-2.5 py-2">
        <div>
          <p className="text-[11.5px] font-semibold text-ink">{stage.label}</p>
          <p className="text-[9px] text-ink-4">{stage.hint}</p>
        </div>
        <span className="num rounded-full bg-surface px-1.5 py-0.5 text-[9.5px] font-semibold text-ink-3">{candidates.length}</span>
      </div>
      <div className="scrollbar-none flex max-h-[30rem] flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-2">
        {candidates.map((candidate) => (
          <DraggableCandidate key={candidate.id} candidate={candidate} />
        ))}
        {candidates.length === 0 ? <p className="px-1 py-6 text-center text-[9.5px] text-ink-4">Drop candidates here</p> : null}
      </div>
    </div>
  );
}

export default function Recruitment() {
  const locale = useUIStore((s) => s.locale);
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const { data: jobs } = useQuery({ queryKey: ['jobs'], queryFn: listJobs });
  const { data: candidates, isLoading } = useQuery({ queryKey: ['candidates'], queryFn: () => listCandidates() });

  const move = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: PipelineStage }) => moveCandidate(id, stage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidates'] }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

  const filtered = (candidates ?? []).filter(
    (candidate) => !search || `${candidate.name} ${candidate.nationality} ${candidate.email}`.toLowerCase().includes(search.toLowerCase()),
  );

  const active = activeId ? (candidates ?? []).find((candidate) => candidate.id === activeId) : null;
  const palette = useChartPalette();

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active: dragged, over } = event;
    if (!over) return;
    const candidate = (candidates ?? []).find((item) => item.id === dragged.id);
    if (!candidate) return;
    const stage = STAGES.find((item) => item.id === over.id);
    if (stage && stage.id !== candidate.stage) {
      move.mutate({ id: candidate.id, stage: stage.id });
    }
  }

  const funnel = STAGES.map((stage) => ({
    label: stage.label,
    value: (candidates ?? []).filter((candidate) => candidate.stage === stage.id).length,
  }));

  const openRoles = (jobs ?? []).filter((job) => job.status === 'open');

  return (
    <>
      <PageHeader
        eyebrow="Workforce · Talent"
        title="Recruitment"
        description="Drag a candidate between stages to advance the pipeline. Every move is written to the audit log."
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Filter className="size-3.5" /> Filters
            </Button>
            <Button variant="primary" size="sm">
              <Plus className="size-3.5" /> Add candidate
            </Button>
          </>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: 'Open requisitions', value: openRoles.length, hint: `${openRoles.reduce((sum, job) => sum + (job.openings - job.filled), 0)} seats to fill` },
          { label: 'Active candidates', value: (candidates ?? []).filter((c) => c.stage !== 'hired' && c.stage !== 'rejected').length, hint: 'in pipeline today' },
          { label: 'Offers out', value: (candidates ?? []).filter((c) => c.stage === 'offer').length, hint: 'awaiting signature' },
          { label: 'Avg. time to hire', value: '31 d', hint: 'target 32 days' },
        ].map((stat) => (
          <Card key={stat.label} className="p-3.5">
            <p className="text-[10.5px] text-ink-3">{stat.label}</p>
            <p className="num mt-1 text-[20px] font-semibold leading-none text-ink">{stat.value}</p>
            <p className="mt-1 truncate text-[9.5px] text-ink-4">{stat.hint}</p>
          </Card>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidates…" icon={<Search />} className="h-8 max-w-xs text-[11.5px]" />
        <span className="text-[10.5px] text-ink-4">{filtered.length} candidates</span>
        <span className="ms-auto inline-flex items-center gap-1 text-[10px] text-ink-4">
          <Users className="size-3" /> Drag between columns
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="scrollbar-none flex gap-2.5 overflow-x-auto pb-2">
          {isLoading
            ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-72 w-[15.5rem] shrink-0 rounded-lg" />)
            : STAGES.map((stage) => (
                <StageColumn key={stage.id} stage={stage} candidates={filtered.filter((candidate) => candidate.stage === stage.id)} />
              ))}
        </div>
        <DragOverlay>{active ? <div className="w-[15rem]"><CandidateCard candidate={active} dragging /></div> : null}</DragOverlay>
      </DndContext>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartCard title="Hiring funnel" description="Active pipeline by stage." bodyClassName="px-3 pt-2">
          <HorizontalBars
            data={funnel.map((stage, index) => ({ ...stage, color: palette.series[index % palette.series.length] }))}
            formatter={(value) => `${value}`}
          />
          <p className="mt-2 px-1 text-[9.5px] text-ink-4">
            Conversion from application to offer:{' '}
            {funnel[0]?.value ? Math.round(((funnel[3]?.value ?? 0) / funnel[0].value) * 100) : 0}%
          </p>
        </ChartCard>

        <Card className="lg:col-span-2">
          <CardHeading title="Open roles" description="Requisitions with headcount still to fill." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-y border-line bg-surface-2">
                  {['Role', 'Department', 'Location', 'Progress', 'Hiring manager'].map((heading) => (
                    <th key={heading} className="px-3 py-1.5 text-start text-[9.5px] font-semibold uppercase tracking-wide text-ink-4">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {openRoles.slice(0, 8).map((job) => (
                  <tr key={job.id} className="hover:bg-surface-2">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span className="grid size-6 shrink-0 place-items-center rounded bg-primary-soft text-primary-ink">
                          <Briefcase className="size-3" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[11.5px] font-medium text-ink">{job.title}</span>
                          <span className="block text-[9px] text-ink-4">Opened {formatDate(job.openedAt, 'd MMM', locale)}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-ink-3">{departmentMap.get(job.departmentId)?.name}</td>
                    <td className="px-3 py-2 text-[11px] text-ink-3">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-2.5" /> {db.locations.find((location) => location.id === job.locationId)?.city}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <Progress value={(job.filled / Math.max(1, job.openings)) * 100} className="w-14" tone="accent" />
                        <span className="num text-[10.5px] text-ink-3">
                          {job.filled}/{job.openings}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-ink-3">{displayName(getEmployee(job.hiringManagerId)!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!openRoles.length ? <EmptyState title="No open requisitions" description="Create a requisition to start a pipeline." /> : null}
        </Card>
      </div>

      <PageFooter note="Pipeline moves are audit-logged." right="Sources: LinkedIn 41% · Referrals 28% · Agency 14%" />
    </>
  );
}
