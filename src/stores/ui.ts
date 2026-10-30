import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale, Theme } from '@/types';
import i18n, { isRtl } from '@/lib/i18n';

type Density = 'comfortable' | 'compact';

interface UIState {
  theme: Theme;
  locale: Locale;
  density: Density;
  /** Accessibility preferences surfaced in Settings and the command palette. */
  highContrast: boolean;
  reduceMotion: boolean;
  sidebarCollapsed: boolean;
  sidebarOrder: string[];
  commandOpen: boolean;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setDensity: (density: Density) => void;
  setHighContrast: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOrder: (order: string[]) => void;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      locale: 'en',
      density: 'comfortable',
      highContrast: false,
      reduceMotion: false,
      sidebarCollapsed: false,
      sidebarOrder: [],
      commandOpen: false,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => {
        void i18n.changeLanguage(locale);
        set({ locale });
      },
      setDensity: (density) => set({ density }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
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
        highContrast: state.highContrast,
        reduceMotion: state.reduceMotion,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarOrder: state.sidebarOrder,
      }),
    },
  ),
);

/**
 * Apply theme, accessibility and direction preferences to <html>.
 * Called from a single effect in App so the whole tree updates together.
 */
export function applyDocumentPreferences(
  theme: Theme,
  locale: Locale,
  density: Density,
  highContrast = false,
  reduceMotion = false,
) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  root.classList.toggle('dark', dark);
  root.setAttribute('data-hc', String(highContrast));
  root.setAttribute('data-reduce-motion', String(reduceMotion || prefersReducedMotion));
  root.setAttribute('data-density', density);
  root.lang = locale;
  root.dir = isRtl(locale) ? 'rtl' : 'ltr';
  root.style.colorScheme = dark ? 'dark' : 'light';
}
