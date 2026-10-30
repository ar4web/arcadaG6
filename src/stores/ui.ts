import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale, Theme } from '@/types';
import i18n, { isRtl } from '@/lib/i18n';

type Density = 'comfortable' | 'compact';

interface UIState {
  theme: Theme;
  locale: Locale;
  density: Density;
  sidebarCollapsed: boolean;
  sidebarOrder: string[];
  commandOpen: boolean;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setDensity: (density: Density) => void;
  toggleSidebar: () => void;
  setSidebarOrder: (order: string[]) => void;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      locale: 'en',
      density: 'comfortable',
      sidebarCollapsed: false,
      sidebarOrder: [],
      commandOpen: false,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => {
        void i18n.changeLanguage(locale);
        set({ locale });
      },
      setDensity: (density) => set({ density }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarOrder: (sidebarOrder) => set({ sidebarOrder }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      toggleCommand: () => set({ commandOpen: !get().commandOpen }),
    }),
    {
      name: 'arcada.ui',
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        density: state.density,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarOrder: state.sidebarOrder,
      }),
    },
  ),
);

/** Apply theme + direction to <html>. Called from a single effect in App. */
export function applyDocumentPreferences(theme: Theme, locale: Locale, density: Density) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', dark);
  root.setAttribute('data-density', density);
  root.lang = locale;
  root.dir = isRtl(locale) ? 'rtl' : 'ltr';
  root.style.colorScheme = dark ? 'dark' : 'light';
}
