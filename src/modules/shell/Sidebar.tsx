import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowUpRight,
  Building2,
  ChevronsUpDown,
  CircleHelp,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import type { AppId } from '@/types';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { Avatar, Badge } from '@/components/ui/misc';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NAV, APP_META, type NavGroup, type NavItem } from './navigation';
import { useShellCounts } from './use-shell-counts';

function Logo() {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-ink text-ink-inverse" aria-hidden="true">
      <svg viewBox="0 0 32 32" className="size-4" fill="none">
        <path d="M16 2.5 28 9.5v13L16 29.5 4 22.5v-13L16 2.5Z" fill="currentColor" />
        <path d="M16 9.5 22.5 22h-4.1L16 17.4 13.6 22H9.5L16 9.5Z" className="fill-ink" />
      </svg>
    </span>
  );
}

function NavRow({
  item,
  active,
  collapsed,
  count,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  count?: number;
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });
  const Icon = item.icon;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
  };

  const content = (
    <>
      {!collapsed ? (
        <span
          {...attributes}
          {...listeners}
          aria-label="Reorder"
          className="absolute inset-y-0 start-0 z-10 flex w-4 cursor-grab touch-none items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical className="size-3 text-ink-4" />
        </span>
      ) : null}
      <Icon className="size-4 shrink-0" />
      {!collapsed ? <span className="flex-1 truncate">{t(item.labelKey)}</span> : null}
      {count && !collapsed ? (
        <span className="num rounded-full bg-primary-soft px-1.5 py-px text-[9.5px] font-semibold text-primary-ink">{count}</span>
      ) : null}
      {count && collapsed ? <span className="absolute end-1 top-1 size-1.5 rounded-full bg-primary" /> : null}
    </>
  );

  const className = cn(
    'group relative flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors',
    collapsed && 'justify-center px-0',
    active ? 'bg-primary-soft text-primary-ink' : 'text-ink-3 hover:bg-surface-3 hover:text-ink',
    isDragging && 'shadow-md',
  );

  const node = collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link ref={setNodeRef} style={style} to={item.path} onClick={onNavigate} className={className} aria-current={active ? 'page' : undefined}>
          {content}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
    </Tooltip>
  ) : (
    <Link ref={setNodeRef} style={style} to={item.path} onClick={onNavigate} className={className} aria-current={active ? 'page' : undefined}>
      {content}
    </Link>
  );

  return node;
}

function NavGroupBlock({
  group,
  app,
  pathname,
  collapsed,
  counts,
  onNavigate,
}: {
  group: NavGroup;
  app: AppId;
  pathname: string;
  collapsed: boolean;
  counts: { pendingLeave: number; pendingExpenses: number };
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  const order = useUIStore((s) => s.sidebarOrder);
  const setSidebarOrder = useUIStore((s) => s.setSidebarOrder);

  const items = React.useMemo(() => {
    const base = [...group.items];
    if (!order.length) return base;
    return base.sort((a, b) => {
      const ai = order.indexOf(a.key);
      const bi = order.indexOf(b.key);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [group.items, order]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const keys = items.map((item) => item.key);
    const oldIndex = keys.indexOf(String(active.id));
    const newIndex = keys.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(keys, oldIndex, newIndex);
    const rest = order.filter((key) => !next.includes(key));
    setSidebarOrder([...next, ...rest]);
  }

  if (!items.length) return null;

  return (
    <div className="mb-1">
      {!collapsed ? (
        <p className="mb-1 px-2.5 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">{t(group.labelKey)}</p>
      ) : (
        <div className="mx-auto my-2 h-px w-6 bg-line" />
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} id={`nav-${app}-${group.key}`}>
        <SortableContext items={items.map((item) => item.key)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <NavRow
                key={item.key}
                item={item}
                active={pathname === item.path || (item.path !== `/${app}` && pathname.startsWith(`${item.path}/`))}
                collapsed={collapsed}
                count={item.badge ? counts[item.badge] : undefined}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export function Sidebar({ app, mobileOpen, onCloseMobile }: { app: AppId; mobileOpen: boolean; onCloseMobile: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsedPreference = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const session = useAuthStore((s) => s.session);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const counts = useShellCounts();
  const [collapsed, setCollapsed] = React.useState(collapsedPreference);

  const groups = NAV[app].map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
  }));

  function switchApp(next: AppId) {
    navigate(APP_META[next].path);
    onCloseMobile();
  }

  return (
    <>
      {mobileOpen ? (
        <button className="fixed inset-0 z-40 bg-[rgb(var(--overlay)/0.4)] backdrop-blur-[1px] lg:hidden" aria-label="Close navigation" onClick={onCloseMobile} />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-40 flex w-[var(--sidebar-w)] flex-col border-e border-line bg-surface transition-[transform,width] duration-200 ease-out lg:sticky lg:top-0 lg:h-dvh lg:shrink-0 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0',
          collapsed && 'lg:w-[var(--sidebar-w-collapsed)]',
        )}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className={cn('flex h-[var(--header-h)] shrink-0 items-center gap-2 border-b border-line px-4', collapsed && 'lg:justify-center lg:px-0')}>
          <Link to="/hr" className="flex items-center gap-2" onClick={onCloseMobile}>
            <Logo />
            {!collapsed ? (
              <span className="font-display text-[15px] font-extrabold tracking-[-0.03em] text-ink">
                arcada<span className="text-primary">.</span>
              </span>
            ) : null}
          </Link>
          <button className="ms-auto grid size-7 place-items-center rounded-md text-ink-4 hover:bg-surface-3 lg:hidden" onClick={onCloseMobile} aria-label="Close navigation">
            <X className="size-4" />
          </button>
          {!collapsed ? (
            <button
              className="ms-auto hidden size-7 place-items-center rounded-md text-ink-4 transition-colors hover:bg-surface-3 hover:text-ink lg:grid"
              onClick={() => {
                setCollapsed(true);
                if (!collapsedPreference) toggleSidebar();
              }}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="size-4 rtl:rotate-180" />
            </button>
          ) : null}
        </div>

        {/* App switcher */}
        {!collapsed ? (
          <div className="px-3 pt-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-md border border-line bg-surface-2 px-2 py-1.5 text-start transition-colors hover:border-line-2 hover:bg-surface-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded bg-ink text-[9px] font-bold text-ink-inverse">
                    {APP_META[app].short}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-semibold text-ink">{t(APP_META[app].labelKey)}</span>
                    <span className="block truncate text-[9.5px] text-ink-4">{t('app.workspace')}</span>
                  </span>
                  <ChevronsUpDown className="size-3 shrink-0 text-ink-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[13.5rem]">
                <DropdownMenuLabel>{t('app.switchApp')}</DropdownMenuLabel>
                {(Object.keys(APP_META) as AppId[]).map((key) => (
                  <DropdownMenuItem key={key} onSelect={() => switchApp(key)} className={cn(key === app && 'bg-surface-3 text-ink')}>
                    {key === 'hr' ? <Building2 /> : key === 'finance' ? <Wallet /> : <Sparkles />}
                    <span className="flex-1">{t(APP_META[key].labelKey)}</span>
                    {key === app ? <Badge tone="primary">Active</Badge> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex justify-center pt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="grid size-8 place-items-center rounded-md bg-surface-3 text-[9px] font-bold text-ink-2" onClick={() => switchApp(app === 'hr' ? 'finance' : app === 'finance' ? 'ess' : 'hr')}>
                  {APP_META[app].short}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{t('app.switchApp')}</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Nav */}
        <nav className="scrollbar-none flex-1 overflow-y-auto px-3 pb-2">
          {groups.map((group) => (
            <NavGroupBlock
              key={group.key}
              group={group}
              app={app}
              pathname={location.pathname}
              collapsed={collapsed}
              counts={counts}
              onNavigate={onCloseMobile}
            />
          ))}
        </nav>

        {/* Promo */}
        {!collapsed ? (
          <div className="mx-3 mb-2 rounded-lg border border-line bg-gradient-to-br from-accent-soft to-surface-2 p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-[12px] font-bold leading-tight text-ink">
                  Good people.
                  <br />
                  Great possibilities.
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-ink-3">Make room for what's next.</p>
              </div>
              <svg viewBox="0 0 40 36" className="h-9 w-10 shrink-0 text-accent" fill="none" aria-hidden="true">
                <path d="M20 34V12M20 27c-9 0-10-5-9-8 6-.5 10 3 9 8Zm1-7c9 0 12-6 10-9-6-.5-10 3-10 9Z" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 34h24" stroke="currentColor" strokeOpacity=".4" />
              </svg>
            </div>
            <button
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-accent-ink hover:underline"
              onClick={() => navigate(app === 'finance' ? '/finance/reports' : '/hr/analytics')}
            >
              Explore your workspace <ArrowUpRight className="size-2.5" />
            </button>
          </div>
        ) : null}

        {/* Footer */}
        <div className={cn('border-t border-line p-3', collapsed && 'px-1.5')}>
          {!collapsed ? (
            <Link to="/help" className="mb-2 flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[12px] font-medium text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink">
              <CircleHelp className="size-4" />
              <span className="flex-1">{t('nav.help')}</span>
              <ArrowUpRight className="size-3" />
            </Link>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn('flex w-full items-center gap-2 rounded-md p-1 text-start transition-colors hover:bg-surface-3', collapsed && 'justify-center')}>
                <Avatar name={session?.name ?? 'User'} hue={session?.avatarHue ?? 20} size="sm" />
                {!collapsed ? (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-semibold text-ink">{session?.name ?? '—'}</span>
                      <span className="block truncate text-[9.5px] capitalize text-ink-4">{session?.role.replace('_', ' ').replace('hr', 'HR') ?? '—'}</span>
                    </span>
                    <ChevronsUpDown className="size-3 shrink-0 text-ink-4" />
                  </>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel>{session?.email}</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => navigate('/me/profile')}>{t('user.settings')}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/help')}>{t('nav.help')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/signin')} className="text-danger">
                {t('user.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {collapsed ? (
          <button
            className="mx-auto mb-2 grid size-7 place-items-center rounded-md text-ink-4 hover:bg-surface-3 hover:text-ink"
            onClick={() => {
              setCollapsed(false);
              if (collapsedPreference) toggleSidebar();
            }}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4 rtl:rotate-180" />
          </button>
        ) : null}
      </aside>
    </>
  );
}
