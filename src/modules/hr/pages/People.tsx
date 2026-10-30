import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, Check, Columns3, Download, Search, SlidersHorizontal, UserPlus, X } from 'lucide-react';
import type { Employee, SortDirection } from '@/types';
import { listEmployees, createEmployee } from '@/services/employees';
import { exportTable, employeeRegisterReport } from '@/services/reports';
import { departmentMap, displayName, getEmployee, locationMap } from '@/lib/mock/db';
import { useColumnStore } from '@/stores/columns';
import { useUIStore } from '@/stores/ui';
import { cn, formatDate, formatNumber, formatSAR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Field, NativeSelect, Textarea } from '@/components/ui/input';
import { Avatar, Badge, EmptyState, Segmented, Skeleton } from '@/components/ui/misc';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PageFooter, PageHeader } from '@/modules/shell/PageHeader';

interface ColumnDef {
  key: string;
  label: string;
  width: string;
  align?: 'start' | 'end';
  sortable?: boolean;
  render: (employee: Employee) => React.ReactNode;
}

const STATUS_TONE: Record<Employee['status'], { label: string; tone: 'success' | 'warning' | 'info' | 'danger' | 'neutral' }> = {
  active: { label: 'Active', tone: 'success' },
  probation: { label: 'Probation', tone: 'info' },
  on_leave: { label: 'On leave', tone: 'warning' },
  notice: { label: 'Notice', tone: 'warning' },
  terminated: { label: 'Exited', tone: 'neutral' },
};

export default function People() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const locale = useUIStore((s) => s.locale);
  const density = useUIStore((s) => s.density);
  const setDensity = useUIStore((s) => s.setDensity);
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState('');
  const [department, setDepartment] = React.useState('all');
  const [location, setLocation] = React.useState('all');
  const [status, setStatus] = React.useState(params.get('risk') ? 'all' : 'all');
  const [sort, setSort] = React.useState<{ key: string; direction: SortDirection }>({ key: 'firstName', direction: 'asc' });
  const [selected, setSelected] = React.useState<string[]>([]);
  const [addOpen, setAddOpen] = React.useState(params.get('action') === 'new');

  const allColumns: ColumnDef[] = React.useMemo(
    () => [
      {
        key: 'name',
        label: 'Employee',
        width: 'minmax(200px,1.6fr)',
        sortable: true,
        render: (employee) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={displayName(employee)} hue={employee.avatarHue} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-ink">{displayName(employee)}</p>
              <p className="truncate text-[10px] text-ink-4">{employee.email}</p>
            </div>
          </div>
        ),
      },
      { key: 'employeeNo', label: 'No.', width: '76px', sortable: true, render: (employee) => <span className="num text-[11.5px] text-ink-3">{employee.employeeNo}</span> },
      { key: 'departmentId', label: 'Department', width: 'minmax(120px,1fr)', sortable: true, render: (employee) => <span className="text-[11.5px] text-ink-2">{departmentMap.get(employee.departmentId)?.name}</span> },
      { key: 'jobTitle', label: 'Job title', width: 'minmax(150px,1.3fr)', sortable: true, render: (employee) => <span className="truncate text-[11.5px] text-ink-2">{employee.jobTitle}</span> },
      { key: 'locationId', label: 'Location', width: '116px', render: (employee) => <span className="text-[11.5px] text-ink-3">{locationMap.get(employee.locationId)?.city}</span> },
      {
        key: 'managerId',
        label: 'Manager',
        width: 'minmax(120px,1fr)',
        render: (employee) => <span className="truncate text-[11.5px] text-ink-3">{getEmployee(employee.managerId) ? displayName(getEmployee(employee.managerId)!) : '—'}</span>,
      },
      { key: 'hireDate', label: 'Hired', width: '96px', sortable: true, render: (employee) => <span className="num text-[11px] text-ink-3">{formatDate(employee.hireDate, 'MMM yyyy', locale)}</span> },
      {
        key: 'status',
        label: 'Status',
        width: '104px',
        sortable: true,
        render: (employee) => (
          <Badge tone={STATUS_TONE[employee.status].tone} dot>
            {STATUS_TONE[employee.status].label}
          </Badge>
        ),
      },
      {
        key: 'salary',
        label: 'Gross / month',
        width: '118px',
        align: 'end',
        sortable: true,
        render: (employee) => (
          <span className="num text-[11.5px] text-ink-2">
            {formatSAR(employee.salary.basic + employee.salary.housing + employee.salary.transport + employee.salary.allowances, locale)}
          </span>
        ),
      },
      {
        key: 'performance',
        label: 'Rating',
        width: '74px',
        align: 'end',
        sortable: true,
        render: (employee) => <span className="num text-[11.5px] text-ink-2">{employee.performance.rating.toFixed(1)}</span>,
      },
      {
        key: 'flightRisk',
        label: 'Risk',
        width: '82px',
        render: (employee) => (
          <Badge tone={employee.flightRisk === 'high' ? 'danger' : employee.flightRisk === 'medium' ? 'warning' : 'success'}>
            {employee.flightRisk}
          </Badge>
        ),
      },
    ],
    [locale],
  );

  const columnStore = useColumnStore();
  const order = columnStore.order['people'];
  const hidden = columnStore.hidden['people'] ?? [];

  const columns = React.useMemo(() => {
    const ordered = order ? order.map((key) => allColumns.find((column) => column.key === key)).filter(Boolean) as ColumnDef[] : allColumns;
    const missing = allColumns.filter((column) => !ordered.some((c) => c.key === column.key));
    return [...ordered, ...missing].filter((column) => !hidden.includes(column.key));
  }, [allColumns, order, hidden]);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { search, department, location, status, sort }],
    queryFn: () => listEmployees({ search, department, location, status, sort, page: 1, pageSize: 500 }),
  });

  const rows = data?.rows ?? [];
  const scrollRef = React.useRef<HTMLDivElement>(null);
  // Matches --row-height (36px) with a tighter compact setting.
  const rowHeight = density === 'compact' ? 30 : 36;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleColumnDrag(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const keys = columns.map((column) => column.key);
    const oldIndex = keys.indexOf(String(active.id));
    const newIndex = keys.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    columnStore.setOrder('people', arrayMove(keys, oldIndex, newIndex));
  }

  function toggleSort(key: string) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  const template = `40px ${columns.map((column) => column.width).join(' ')}`;

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: (employee) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      setAddOpen(false);
      navigate(`/hr/people/${employee.id}`);
    },
  });

  const allSelected = rows.length > 0 && selected.length === rows.length;

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Employee directory"
        description={`${formatNumber(rows.length)} people across ${new Set(rows.map((r) => r.departmentId)).size} departments. Drag a column header to rearrange the table.`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => exportTable(employeeRegisterReport(rows), 'xlsx')}>
              <Download className="size-3.5" />
              Export
            </Button>
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus className="size-3.5" />
              Add employee
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, title…"
            icon={<Search />}
            trailing={
              search ? (
                <button onClick={() => setSearch('')} aria-label="Clear search">
                  <X className="size-3.5" />
                </button>
              ) : undefined
            }
            className="h-8 text-[11.5px]"
          />
        </div>

        <NativeSelect value={department} onChange={(event) => setDepartment(event.target.value)} className="h-8 w-auto min-w-[9rem] text-[11.5px]">
          <option value="all">All departments</option>
          {[...departmentMap.values()].map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect value={location} onChange={(event) => setLocation(event.target.value)} className="h-8 w-auto min-w-[8rem] text-[11.5px]">
          <option value="all">All locations</option>
          {[...locationMap.values()].map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.city}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect value={status} onChange={(event) => setStatus(event.target.value)} className="h-8 w-auto min-w-[7.5rem] text-[11.5px]">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="probation">Probation</option>
          <option value="on_leave">On leave</option>
          <option value="notice">Notice</option>
        </NativeSelect>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm" className="ms-auto">
              <Columns3 className="size-3.5" />
              Columns
              {hidden.length ? <span className="rounded-full bg-surface-3 px-1.5 text-[9.5px]">{hidden.length}</span> : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            <p className="px-2 py-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-ink-4">Visible columns</p>
            {allColumns.map((column) => (
              <button
                key={column.key}
                onClick={() => columnStore.toggleColumn('people', column.key)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start hover:bg-surface-3"
              >
                <span className={cn('grid size-4 place-items-center rounded border', !hidden.includes(column.key) ? 'border-primary bg-primary text-primary-contrast' : 'border-line-strong')}>
                  {!hidden.includes(column.key) ? <Check className="size-2.5" /> : null}
                </span>
                <span className="text-[11.5px] text-ink-2">{column.label}</span>
              </button>
            ))}
            <div className="mt-1 border-t border-line px-2 py-1.5">
              <button className="text-[10.5px] text-ink-3 hover:text-ink" onClick={() => columnStore.reset('people')}>
                Reset columns
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <Segmented
          value={density}
          onChange={setDensity}
          ariaLabel="Row density"
          options={[
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'Compact' },
          ]}
        />
      </div>

      {selected.length > 0 ? (
        <div className="mb-2 flex items-center gap-3 rounded-md border border-primary/25 bg-primary-soft px-3 py-1.5 text-[11.5px] text-primary-ink">
          <span className="num font-medium">{selected.length} selected</span>
          <button className="hover:underline" onClick={() => setSelected([])}>
            Clear
          </button>
          <span className="ms-auto flex items-center gap-2">
            <Button size="xs" variant="secondary" onClick={() => exportTable(employeeRegisterReport(rows.filter((r) => selected.includes(r.id))), 'csv')}>
              Export selection
            </Button>
            <Button size="xs" variant="secondary">
              Assign to cycle
            </Button>
          </span>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 980 }}>
            {/* Header */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDrag}>
              <SortableContext items={columns.map((column) => column.key)} strategy={horizontalListSortingStrategy}>
                <div
                  role="row"
                  className="sticky top-0 z-10 grid items-center border-b border-line bg-surface-2"
                  style={{ gridTemplateColumns: template }}
                >
                  <div className="flex items-center justify-center py-2">
                    <Checkbox
                      checked={allSelected ? true : selected.length ? 'indeterminate' : false}
                      onCheckedChange={() => setSelected(allSelected ? [] : rows.map((row) => row.id))}
                      aria-label="Select all"
                    />
                  </div>
                  {columns.map((column) => (
                    <SortableHeader key={column.key} column={column} sort={sort} onSort={toggleSort} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Body */}
            <div ref={scrollRef} className="relative overflow-y-auto" style={{ height: 'calc(100dvh - 21rem)', minHeight: 360 }}>
              {isLoading ? (
                <div className="flex flex-col gap-1 p-2">
                  {Array.from({ length: 14 }).map((_, index) => (
                    <Skeleton key={index} className="h-9 w-full" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <EmptyState
                  title="No employees match those filters"
                  description="Try clearing the search or widening the department filter."
                  icon={<SlidersHorizontal className="size-5" />}
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        setSearch('');
                        setDepartment('all');
                        setLocation('all');
                        setStatus('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const employee = rows[virtualRow.index]!;
                    const isSelected = selected.includes(employee.id);
                    return (
                      <div
                        key={employee.id}
                        role="row"
                        tabIndex={0}
                        onClick={() => navigate(`/hr/people/${employee.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') navigate(`/hr/people/${employee.id}`);
                        }}
                        className={cn(
                          'absolute inset-x-0 grid cursor-pointer items-center border-b border-line/70 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none',
                          isSelected && 'bg-primary-soft/50',
                        )}
                        style={{
                          gridTemplateColumns: template,
                          height: virtualRow.size,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="flex items-center justify-center" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              setSelected((current) => (current.includes(employee.id) ? current.filter((id) => id !== employee.id) : [...current, employee.id]))
                            }
                            aria-label={`Select ${displayName(employee)}`}
                          />
                        </div>
                        {columns.map((column) => (
                          <div key={column.key} className={cn('min-w-0 px-2.5', column.align === 'end' && 'text-end')}>
                            <div className={cn(column.align === 'end' ? 'flex justify-end' : 'truncate')}>{column.render(employee)}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-2 px-3 py-2 text-[10.5px] text-ink-4">
          <span>
            Showing <span className="num text-ink-2">{rows.length}</span> of <span className="num text-ink-2">{data?.total ?? 0}</span> employees
            {hidden.length ? ` · ${hidden.length} columns hidden` : ''}
          </span>
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Check className="size-2.5 text-accent" /> Rows virtualised with @tanstack/react-virtual
            </span>
            <span>Updated just now</span>
          </span>
        </div>
      </div>

      <PageFooter note="Directory synced from the HRIS." right="Gross figures exclude GOSI and end-of-service accrual." />

      <AddEmployeeDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={(values) => createMutation.mutate(values)} loading={createMutation.isPending} />
    </>
  );
}

function SortableHeader({
  column,
  sort,
  onSort,
}: {
  column: ColumnDef;
  sort: { key: string; direction: SortDirection };
  onSort: (key: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.key });
  const active = sort.key === column.key;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('min-w-0', isDragging && 'z-20 opacity-80')}
      {...attributes}
      {...listeners}
    >
      <button
        onClick={() => column.sortable && onSort(column.key)}
        className={cn(
          'flex w-full cursor-grab touch-none items-center gap-1 px-2.5 py-2 text-[9.5px] font-semibold uppercase tracking-[0.06em] transition-colors active:cursor-grabbing',
          column.align === 'end' ? 'justify-end' : 'justify-start',
          active ? 'text-ink' : 'text-ink-4 hover:text-ink-2',
        )}
      >
        <span className="truncate">{column.label}</span>
        {active ? sort.direction === 'asc' ? <ArrowUp className="size-2.5" /> : <ArrowDown className="size-2.5" /> : null}
      </button>
    </div>
  );
}

function AddEmployeeDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Partial<Employee>) => void;
  loading: boolean;
}) {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [nameAr, setNameAr] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [jobTitle, setJobTitle] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('tech');
  const [basic, setBasic] = React.useState('12000');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Add an employee</DialogTitle>
          <DialogDescription>
            Creates a probationary record. Compliance documents, bank details and GOSI registration follow in the onboarding checklist.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" required>
              <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Noura" />
            </Field>
            <Field label="Last name" required>
              <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Al-Otaibi" />
            </Field>
            <Field label="Name in Arabic" className="col-span-2">
              <Input value={nameAr} onChange={(event) => setNameAr(event.target.value)} placeholder="نورة العتيبي" dir="rtl" />
            </Field>
            <Field label="Work email" required className="col-span-2">
              <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name.surname@qimma.sa" type="email" />
            </Field>
            <Field label="Job title" required>
              <Input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Product Designer" />
            </Field>
            <Field label="Department" required>
              <NativeSelect value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
                {[...departmentMap.values()].map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Basic salary (SAR)" hint="Housing (25%) and transport (10%) are added automatically.">
              <Input value={basic} onChange={(event) => setBasic(event.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Start date">
              <Input type="date" defaultValue="2026-11-15" />
            </Field>
            <Field label="Notes" className="col-span-2">
              <Textarea placeholder="Anything the onboarding team should know…" rows={3} />
            </Field>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            onClick={() => {
              const basicSalary = Number(basic) || 12000;
              onSubmit({
                firstName: firstName || 'New',
                lastName: lastName || 'Employee',
                nameAr,
                email: email || 'new.employee@qimma.sa',
                jobTitle: jobTitle || 'Team member',
                departmentId,
                salary: {
                  basic: basicSalary,
                  housing: Math.round(basicSalary * 0.25),
                  transport: Math.round(basicSalary * 0.1),
                  allowances: 0,
                  currency: 'SAR',
                },
              });
            }}
          >
            Create employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { STATUS_TONE };
