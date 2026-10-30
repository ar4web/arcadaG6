import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Check, ChevronRight, Command, Languages, LogOut, Menu, Monitor, Moon, Search, Settings2, ShieldCheck, Sun, UserRound } from 'lucide-react';
import type { AppId, Locale, RoleId, Theme } from '@/types';
import { cn, relativeTime } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { db } from '@/lib/mock/db';
import { ROLES } from '@/lib/mock/master';
import { Avatar } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { APP_META, NAV } from './navigation';

export function Header({ app, onOpenMobile }: { app: AppId; onOpenMobile: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const session = useAuthStore((s) => s.session);
  const switchRole = useAuthStore((s) => s.switchRole);
  const [notifications, setNotifications] = React.useState(db.notifications);
  const [openNotifications, setOpenNotifications] = React.useState(false);

  const current = React.useMemo(() => {
    const groups = NAV[app];
    for (const group of groups) {
      for (const item of group.items) {
        if (item.path === location.pathname) return item;
        if (item.path !== `/${app}` && location.pathname.startsWith(`${item.path}/`)) return item;
      }
    }
    return undefined;
  }, [app, location.pathname]);

  const unread = notifications.filter((n) => !n.read).length;

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: t('theme.light'), icon: Sun },
    { value: 'dark', label: t('theme.dark'), icon: Moon },
    { value: 'system', label: t('theme.system'), icon: Monitor },
  ];

  function markAllRead() {
    db.notifications.forEach((n) => {
      n.read = true;
    });
    setNotifications([...db.notifications]);
  }

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-h)] shrink-0 items-center gap-2 border-b border-line bg-canvas/85 px-3 backdrop-blur-md sm:px-4 lg:px-6">
      <button className="grid size-8 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-surface-3 lg:hidden" onClick={onOpenMobile} aria-label="Open navigation">
        <Menu className="size-4.5" />
      </button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-[11.5px] sm:flex">
        <Link to={APP_META[app].path} className="shrink-0 text-ink-4 transition-colors hover:text-ink-2">
          {t(APP_META[app].labelKey)}
        </Link>
        <ChevronRight className="size-3 shrink-0 text-ink-4 rtl:rotate-180" />
        <span className="truncate font-medium text-ink">{current ? t(current.labelKey) : t('app.workspace')}</span>
      </nav>

      <div className="ms-auto flex items-center gap-1">
        <button
          onClick={() => setCommandOpen(true)}
          className="group flex h-8 items-center gap-2 rounded-md border border-line bg-surface ps-2.5 pe-1.5 text-ink-4 shadow-xs transition-colors hover:border-line-2 hover:text-ink-3 sm:w-64"
          aria-label={t('app.commandHint')}
        >
          <Search className="size-3.5 shrink-0" />
          <span className="hidden flex-1 truncate text-start text-[11.5px] sm:inline">{t('app.search')}</span>
          <kbd className="hidden items-center gap-0.5 rounded border border-line bg-surface-3 px-1 py-px font-sans text-[9.5px] font-medium sm:inline-flex">
            <Command className="size-2.5" />K
          </kbd>
        </button>

        <Popover open={openNotifications} onOpenChange={setOpenNotifications}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute end-1 top-1 grid size-3.5 place-items-center rounded-full bg-primary text-[8px] font-bold text-white ring-2 ring-canvas">{unread}</span>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[21rem] p-0">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <p className="text-[12px] font-semibold text-ink">Notifications</p>
              <button className="text-[10.5px] font-medium text-primary hover:underline" onClick={markAllRead}>
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.slice(0, 6).map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.href ?? '#'}
                  onClick={() => setOpenNotifications(false)}
                  className={cn('flex gap-2.5 border-b border-line px-3 py-2.5 transition-colors last:border-0 hover:bg-surface-2', !notification.read && 'bg-primary-soft/40')}
                >
                  <span
                    className={cn(
                      'mt-1 size-1.5 shrink-0 rounded-full',
                      notification.priority === 'high' ? 'bg-danger' : notification.read ? 'bg-line-strong' : 'bg-primary',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-medium leading-snug text-ink">{notification.title}</span>
                    <span className="mt-0.5 block text-[10.5px] leading-relaxed text-ink-3">{notification.body}</span>
                    <span className="mt-1 block text-[9.5px] text-ink-4">{relativeTime(notification.createdAt, locale)}</span>
                  </span>
                </Link>
              ))}
            </div>
            <div className="border-t border-line px-3 py-2">
              <Link to="/hr" className="text-[10.5px] font-medium text-ink-3 hover:text-ink">
                View all activity
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t('theme.toggle')}>
              {theme === 'dark' ? <Moon className="size-4" /> : theme === 'system' ? <Monitor className="size-4" /> : <Sun className="size-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
              {themeOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  <option.icon className="me-1.5 size-3.5" />
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('lang.toggle')}
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          className="text-[10px] font-semibold"
        >
          {locale === 'en' ? <span className="inline-flex items-center gap-0.5"><Languages className="size-3.5" />AR</span> : <span className="inline-flex items-center gap-0.5"><Languages className="size-3.5" />EN</span>}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ms-0.5 flex items-center gap-1.5 rounded-full p-0.5 transition-colors hover:bg-surface-3" aria-label="Account menu">
              <Avatar name={session?.name ?? 'User'} hue={session?.avatarHue ?? 20} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="flex items-center gap-2 px-2 py-2">
              <Avatar name={session?.name ?? 'User'} hue={session?.avatarHue ?? 20} size="md" />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-ink">{locale === 'ar' ? session?.nameAr : session?.name}</p>
                <p className="truncate text-[10px] text-ink-4">{session?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            {session?.mfaEnabled ? (
              <div className="mx-2 mb-1 flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-1 text-[10px] font-medium text-success">
                <ShieldCheck className="size-3" />
                {t('user.mfa')}
              </div>
            ) : null}
            <DropdownMenuLabel>{t('user.role')}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={session?.role ?? 'admin'}
              onValueChange={async (value) => {
                await switchRole(value as RoleId);
                const target = ROLES.find((role) => role.id === value)?.apps[0] ?? 'ess';
                navigate(APP_META[target].path);
              }}
            >
              {ROLES.map((role) => (
                <DropdownMenuRadioItem key={role.id} value={role.id}>
                  <span className="flex-1 truncate">{role.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/me/profile')}>
              <UserRound /> {t('nav.myProfile')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/hr/settings')}>
              <Settings2 /> {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/signin')} className="text-danger">
              <LogOut /> {t('user.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function HeaderSwatch({ locale }: { locale: Locale }) {
  return <span className="sr-only">{locale}</span>;
}

export function HeaderCheck() {
  return <Check className="hidden" />;
}
