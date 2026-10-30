import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, LayoutGrid, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useAnalytics } from '@/lib/hooks';
import { db } from '@/lib/mock/db';
import { cn } from '@/lib/utils';
import { useLayoutStore, type WidgetPlacement } from '@/stores/layout';
import { useUIStore } from '@/stores/ui';
import { WIDGETS, type WidgetContext } from '@/components/widgets/registry';
import { useChartPalette } from '@/components/charts/theme';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/misc';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';

const SPAN_CLASS: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-1 md:col-span-2',
  3: 'col-span-1 md:col-span-2 xl:col-span-3',
  4: 'col-span-1 md:col-span-2 xl:col-span-4',
};

const WIDGET_INDEX = new Map(WIDGETS.map((widget) => [widget.id, widget]));

function SortableWidget({ placement, ctx, editing }: { placement: WidgetPlacement; ctx: WidgetContext; editing: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: placement.id });
  const definition = WIDGET_INDEX.get(placement.id);
  if (!definition) return null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('group/widget relative min-w-0', SPAN_CLASS[placement.span], isDragging && 'z-20 opacity-90')}
    >
      <div className={cn('h-full', isDragging && 'rounded-lg ring-2 ring-primary-ring/50 shadow-lg')}>
        {definition.render(ctx)}
      </div>
      {editing ? (
        <button
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${definition.title}`}
          className="absolute end-2 top-2 z-10 grid size-6 cursor-grab touch-none place-items-center rounded-md border border-line bg-surface/95 text-ink-4 shadow-xs transition-colors hover:text-ink active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const locale = useUIStore((s) => s.locale);
  const widgets = useLayoutStore((s) => s.widgets);
  const setWidgets = useLayoutStore((s) => s.setWidgets);
  const resetLayout = useLayoutStore((s) => s.resetLayout);
  const [editing, setEditing] = React.useState(false);
  const [department, setDepartment] = React.useState('all');

  const scope = React.useMemo(
    () => (department === 'all' ? db.employees : db.employees.filter((e) => e.departmentId === department)),
    [department],
  );
  const { data: analytics, isLoading } = useAnalytics(scope, department);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = widgets.map((widget) => widget.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setWidgets(arrayMove(widgets, oldIndex, newIndex));
  }

  function toggleWidget(id: string) {
    setWidgets(widgets.map((widget) => (widget.id === id ? { ...widget, visible: !widget.visible } : widget)));
  }

  const visible = widgets.filter((widget) => widget.visible);
  const hidden = widgets.filter((widget) => !widget.visible);

  const palette = useChartPalette();
  const ctx: WidgetContext = {
    analytics: analytics!,
    palette,
    locale,
    navigate: (path) => navigate(path),
    departmentFilter: department,
  };

  return (
    <>
      <PageHeader
        eyebrow="Your people, your potential"
        title="People overview"
        description="A little perspective. A lot of possibility. Let's grow a better workplace."
        actions={
          <>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-8 w-[10.5rem] text-[11.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {db.departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" size="sm">
                  <SlidersHorizontal className="size-3.5" />
                  Customise
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[19rem] p-0">
                <div className="flex items-center justify-between border-b border-line px-3 py-2">
                  <p className="text-[11.5px] font-semibold text-ink">Dashboard widgets</p>
                  <button className="inline-flex items-center gap-1 text-[10.5px] text-ink-3 hover:text-ink" onClick={resetLayout}>
                    <RotateCcw className="size-3" /> Reset
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto p-1">
                  {widgets.map((widget) => {
                    const definition = WIDGET_INDEX.get(widget.id);
                    if (!definition) return null;
                    return (
                      <button
                        key={widget.id}
                        onClick={() => toggleWidget(widget.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start hover:bg-surface-3"
                      >
                        <span
                          className={cn(
                            'grid size-4 shrink-0 place-items-center rounded border',
                            widget.visible ? 'border-primary bg-primary text-primary-contrast' : 'border-line-strong',
                          )}
                        >
                          {widget.visible ? <Check className="size-2.5" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11.5px] text-ink">{definition.title}</span>
                          <span className="block truncate text-[9.5px] text-ink-4">{definition.category}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-line px-3 py-2 text-[9.5px] text-ink-4">
                  {hidden.length} hidden · drag the handle on a card to reorder
                </div>
              </PopoverContent>
            </Popover>

            <Button variant={editing ? 'primary' : 'secondary'} size="sm" onClick={() => setEditing((value) => !value)}>
              <LayoutGrid className="size-3.5" />
              {editing ? 'Done arranging' : 'Arrange'}
            </Button>
          </>
        }
        tabs={
          <div className="flex flex-wrap items-center gap-1 border-b border-line">
            {['Overview', 'Workforce', 'Retention'].map((tab, index) => (
              <button
                key={tab}
                className={cn(
                  '-mb-px border-b-2 px-2.5 pb-2 text-[12px] font-medium transition-colors',
                  index === 0 ? 'border-primary text-ink' : 'border-transparent text-ink-4 hover:text-ink-2',
                )}
              >
                {tab}
                {index === 2 ? <span className="ms-1.5 rounded bg-primary-soft px-1 text-[8.5px] font-semibold uppercase text-primary-ink">New</span> : null}
              </button>
            ))}
            <span className="ms-auto hidden text-[10px] text-ink-4 sm:block">Updated just now · figures are synthetic</span>
          </div>
        }
      />

      {isLoading || !analytics ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className={cn('h-32 rounded-lg', index > 3 && 'md:col-span-2 h-64')} />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visible.map((widget) => widget.id)} strategy={rectSortingStrategy}>
            <div className="grid auto-rows-min grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {visible.map((placement) => (
                <SortableWidget key={placement.id} placement={placement} ctx={ctx} editing={editing} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <PageFooter note="Your people, in perspective." right={`Sample workspace · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · changes saved locally`} />
    </>
  );
}
