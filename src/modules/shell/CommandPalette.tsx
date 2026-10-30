import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  ArrowRight,
  Building2,
  CalendarPlus,
  CornerDownLeft,
  Eye,
  EyeOff,
  Moon,
  Search,
  Sparkles,
  Sun,
  UserPlus,
  Users,
  Wallet,
  ZapOff,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { db, displayName } from '@/lib/mock/db';
import { Avatar } from '@/components/ui/misc';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { NAV, APP_META } from './navigation';
import type { AppId } from '@/types';

const PAGE_ICON_OVERRIDES: Record<string, typeof Users> = {};

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const highContrast = useUIStore((s) => s.highContrast);
  const setHighContrast = useUIStore((s) => s.setHighContrast);
  const reduceMotion = useUIStore((s) => s.reduceMotion);
  const setReduceMotion = useUIStore((s) => s.setReduceMotion);
  const session = useAuthStore((s) => s.session);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');

  const dismiss = React.useCallback(() => {
    setOpen(false);
    setQuery('');
  }, [setOpen]);

  const go = React.useCallback(
    (path: string) => {
      setOpen(false);
      setQuery('');
      navigate(path);
    },
    [navigate, setOpen],
  );

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!useUIStore.getState().commandOpen);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen, setQuery]);

  const people = React.useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return db.employees
      .filter((e) => e.status !== 'terminated' && `${e.firstName} ${e.lastName} ${e.nameAr} ${e.jobTitle}`.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query]);

  const pages = React.useMemo(() => {
    return (Object.keys(NAV) as AppId[]).flatMap((app) =>
      NAV[app].flatMap((group) =>
        group.items
          .filter((item) => !item.permission || hasPermission(item.permission))
          .map((item) => ({ ...item, app, groupKey: group.labelKey })),
      ),
    );
  }, [hasPermission]);

  if (!open) return null;

  const actions = [
    { icon: UserPlus, label: 'Add an employee', run: () => go('/hr/people?action=new') },
    { icon: CalendarPlus, label: 'Request leave on behalf of someone', run: () => go('/hr/leave?action=new') },
    { icon: Wallet, label: 'Open the October payroll run', run: () => go('/finance/payroll') },
    { icon: Sparkles, label: 'Review compliance watchlist', run: () => go('/hr/compliance') },
    { icon: theme === 'dark' ? Sun : Moon, label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`, run: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
    {
      icon: highContrast ? EyeOff : Eye,
      label: `${highContrast ? 'Disable' : 'Enable'} high contrast`,
      run: () => {
        setHighContrast(!highContrast);
        toast.success(highContrast ? 'High contrast off' : 'High contrast on');
      },
    },
    {
      icon: ZapOff,
      label: `${reduceMotion ? 'Enable' : 'Reduce'} motion`,
      run: () => {
        setReduceMotion(!reduceMotion);
        toast.success(reduceMotion ? 'Motion enabled' : 'Reduced motion on');
      },
    },
    { icon: Building2, label: locale === 'en' ? 'التبديل إلى العربية' : 'Switch to English', run: () => setLocale(locale === 'en' ? 'ar' : 'en') },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-[rgb(var(--overlay)/0.42)] px-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <Command
        shouldFilter
        loop
        className="w-full max-w-[38rem] overflow-hidden rounded-xl border border-line bg-surface shadow-lg animate-in fade-in-0 zoom-in-95"
        onKeyDown={(event) => {
          if (event.key === 'Escape') dismiss();
        }}
        label="Command palette"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <Search className="size-4 shrink-0 text-ink-4" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search people, pages and actions…"
            className="h-11 w-full bg-transparent text-[13px] text-ink placeholder:text-ink-4 focus:outline-none"
          />
          <kbd className="rounded border border-line bg-surface-3 px-1.5 py-0.5 font-sans text-[9.5px] text-ink-4">ESC</kbd>
        </div>

        <Command.List className="max-h-[58vh] overflow-y-auto p-1.5">
          <Command.Empty className="px-3 py-8 text-center text-[12px] text-ink-4">No matches for “{query}”.</Command.Empty>

          {people.length > 0 ? (
            <Command.Group heading="People" className="mb-1">
              {people.map((person) => (
                <Command.Item
                  key={person.id}
                  value={`${displayName(person)} ${person.nameAr} ${person.jobTitle}`}
                  onSelect={() => go(`/hr/people/${person.id}`)}
                  className={itemClass}
                >
                  <Avatar name={displayName(person)} hue={person.avatarHue} size="xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-ink">{locale === 'ar' ? person.nameAr : displayName(person)}</span>
                    <span className="block truncate text-[10px] text-ink-4">{person.jobTitle}</span>
                  </span>
                  <ArrowRight className="size-3 text-ink-4" />
                </Command.Item>
              ))}
            </Command.Group>
          ) : null}

          <Command.Group heading="Go to" className="mb-1">
            {pages.map((page) => {
              const Icon = page.icon;
              return (
                <Command.Item
                  key={`${page.app}-${page.key}`}
                  value={`${page.key} ${page.path} ${APP_META[page.app].short}`}
                  onSelect={() => go(page.path)}
                  className={itemClass}
                >
                  <Icon className="size-3.5 text-ink-4" />
                  <span className="flex-1 truncate text-[12px]">{page.labelKey.replace('nav.', '').replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-[9.5px] uppercase tracking-wide text-ink-4">{APP_META[page.app].short}</span>
                </Command.Item>
              );
            })}
          </Command.Group>

          <Command.Group heading="Actions">
            {actions.map((action) => (
              <Command.Item key={action.label} value={action.label} onSelect={action.run} className={itemClass}>
                <action.icon className="size-3.5 text-ink-4" />
                <span className="flex-1 truncate text-[12px]">{action.label}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>

        <div className="flex items-center gap-3 border-t border-line bg-surface-2 px-3.5 py-2 text-[9.5px] text-ink-4">
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft className="size-2.5" /> open
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="rounded border border-line bg-surface px-1">↑↓</span> navigate
          </span>
          <span className="ms-auto">{session ? `Signed in as ${session.name}` : 'Preview session'}</span>
        </div>
      </Command>
    </div>
  );
}

const itemClass = cn(
  'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-ink-2 outline-none',
  'data-[selected=true]:bg-surface-3 data-[selected=true]:text-ink',
);

export { PAGE_ICON_OVERRIDES };
