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
  series: ['#c26a37', '#e0a06a', '#6d8a5f', '#a8bc96', '#d9b382', '#8a7a9e', '#7d9aa8', '#c3bda8'],
  grid: '#eaeee3',
  axis: '#8d9784',
  ink: '#262c23',
  inkMuted: '#6f7a66',
  surface: '#ffffff',
  line: '#e4e8dc',
  primary: '#b95f2d',
  accent: '#5f7d52',
  success: '#4f7a45',
  warning: '#a87328',
  danger: '#b3453a',
  info: '#4a7189',
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
