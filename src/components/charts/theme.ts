import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/ui';

export interface ChartPalette {
  series: string[];
  grid: string;
  axis: string;
  ink: string;
  inkMuted: string;
  surface: string;
  line: string;
  primary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

const FALLBACK: ChartPalette = {
  series: ['#2dd4bf', '#f97316', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#64748b', '#94a3b8'],
  grid: '#232323',
  axis: '#666666',
  ink: '#f0f0f0',
  inkMuted: '#a0a0a0',
  surface: '#141414',
  line: '#2a2a2a',
  primary: '#2dd4bf',
  accent: '#f97316',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

function readPalette(): ChartPalette {
  if (typeof window === 'undefined') return FALLBACK;
  const styles = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    series: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => v(`--chart-${i}`, FALLBACK.series[i - 1]!)),
    grid: v('--chart-grid', FALLBACK.grid),
    axis: v('--chart-axis', FALLBACK.axis),
    ink: v('--ink', FALLBACK.ink),
    inkMuted: v('--ink-3', FALLBACK.inkMuted),
    surface: v('--surface', FALLBACK.surface),
    line: v('--line', FALLBACK.line),
    primary: v('--primary', FALLBACK.primary),
    accent: v('--accent', FALLBACK.accent),
    success: v('--success', FALLBACK.success),
    warning: v('--warning', FALLBACK.warning),
    danger: v('--danger', FALLBACK.danger),
    info: v('--info', FALLBACK.info),
  };
}

/** Palette read straight from the document — safe outside React (SSR, tests). */
export function chartPalette(): ChartPalette {
  return readPalette();
}

/** Palette that re-reads the CSS custom properties whenever theme flips. */
export function useChartPalette() {
  const theme = useUIStore((s) => s.theme);
  const [palette, setPalette] = useState<ChartPalette>(FALLBACK);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPalette(readPalette()));
    return () => cancelAnimationFrame(frame);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setPalette(readPalette());
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  return palette;
}

export const axisProps = (palette: ChartPalette) => ({
  stroke: palette.axis,
  tick: { fill: palette.axis, fontSize: 10, fontFamily: 'inherit' },
  tickLine: false,
  axisLine: false,
});
