import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardHeading } from '@/components/ui/card';
import { axisProps, useChartPalette, type ChartPalette } from './theme';

/* -------------------------------- Tooltip --------------------------------- */

interface TooltipPayloadItem {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  palette,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  formatter?: (value: number | string, name: string) => string;
  palette: ChartPalette;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-2.5 py-2 shadow-pop"
      style={{ background: palette.surface, borderColor: palette.line }}
    >
      {label !== undefined ? (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: palette.inkMuted }}>
          {label}
        </p>
      ) : null}
      <div className="flex flex-col gap-0.5">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-[11px]">
            <span className="size-1.5 rounded-full" style={{ background: item.color }} />
            <span style={{ color: palette.inkMuted }}>{item.name}</span>
            <span className="num ms-auto font-semibold" style={{ color: palette.ink }}>
              {formatter ? formatter(item.value ?? 0, String(item.name ?? '')) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- ChartCard -------------------------------- */

export function ChartCard({
  title,
  description,
  action,
  legend,
  footer,
  children,
  className,
  bodyClassName,
  ariaLabel,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  legend?: { label: string; color: string; dashed?: boolean }[];
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  ariaLabel?: string;
}) {
  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeading title={title} description={description} action={action} />
      {legend?.length ? (
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-5 pb-1">
          {legend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5 text-[10.5px] text-ink-3">
              <span
                className={cn('size-1.5 rounded-full', item.dashed && 'ring-2 ring-offset-0')}
                style={{ background: item.color, boxShadow: item.dashed ? `0 0 0 3px ${item.color}22` : undefined }}
              />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className={cn('flex-1 px-2 pb-2', bodyClassName)} role="img" aria-label={ariaLabel}>
        {children}
      </div>
      {footer ? <div className="border-t border-line px-5 py-2 text-[10.5px] text-ink-4">{footer}</div> : null}
    </Card>
  );
}

/* --------------------------------- Charts --------------------------------- */

export function AreaTrend({
  data,
  xKey,
  series,
  height = 200,
  formatter,
  yTickFormatter,
  showGrid = true,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
  formatter?: (value: number, name: string) => string;
  yTickFormatter?: (value: number) => string;
  showGrid?: boolean;
}) {
  const palette = useChartPalette();
  const axis = axisProps(palette);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -14 }}>
        <defs>
          {series.map((s, index) => {
            const color = s.color ?? palette.series[index % palette.series.length]!;
            return (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>
        {showGrid ? <CartesianGrid stroke={palette.grid} strokeDasharray="3 4" vertical={false} /> : null}
        <XAxis dataKey={xKey} {...axis} tickMargin={8} />
        <YAxis {...axis} tickFormatter={yTickFormatter} width={48} />
        <Tooltip
          cursor={{ stroke: palette.line, strokeWidth: 1 }}
          content={(props) => (
            <ChartTooltip
              {...(props as { active?: boolean; payload?: TooltipPayloadItem[]; label?: string | number })}
              palette={palette}
              formatter={formatter ? (v, n) => formatter(Number(v), n) : undefined}
            />
          )}
        />
        {series.map((s, index) => {
          const color = s.color ?? palette.series[index % palette.series.length]!;
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              activeDot={{ r: 3.5, strokeWidth: 2, stroke: palette.surface }}
              dot={false}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarCompare({
  data,
  xKey,
  series,
  height = 200,
  stacked,
  layout = 'horizontal',
  formatter,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
  stacked?: boolean;
  layout?: 'horizontal' | 'vertical';
  formatter?: (value: number, name: string) => string;
}) {
  const palette = useChartPalette();
  const axis = axisProps(palette);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 12, bottom: 0, left: layout === 'vertical' ? 4 : -14 }} barGap={3}>
        <CartesianGrid stroke={palette.grid} strokeDasharray="3 4" vertical={layout === 'vertical'} horizontal={layout === 'horizontal'} />
        {layout === 'horizontal' ? (
          <>
            <XAxis dataKey={xKey} {...axis} tickMargin={8} interval={0} />
            <YAxis {...axis} width={44} />
          </>
        ) : (
          <>
            <XAxis type="number" {...axis} />
            <YAxis type="category" dataKey={xKey} {...axis} width={92} tickMargin={4} />
          </>
        )}
        <Tooltip
          cursor={{ fill: palette.grid, fillOpacity: 0.5 }}
          content={(props) => (
            <ChartTooltip
              {...(props as { active?: boolean; payload?: TooltipPayloadItem[]; label?: string | number })}
              palette={palette}
              formatter={formatter ? (v, n) => formatter(Number(v), n) : undefined}
            />
          )}
        />
        {series.map((s, index) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={stacked ? 'stack' : undefined}
            fill={s.color ?? palette.series[index % palette.series.length]!}
            radius={layout === 'vertical' ? [0, 3, 3, 0] : [3, 3, 0, 0]}
            maxBarSize={layout === 'vertical' ? 12 : 26}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineTrend({
  data,
  xKey,
  series,
  height = 180,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string; color?: string; dashed?: boolean }[];
  height?: number;
}) {
  const palette = useChartPalette();
  const axis = axisProps(palette);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={palette.grid} strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey={xKey} {...axis} tickMargin={8} />
        <YAxis {...axis} width={44} />
        <Tooltip
          content={(props) => (
            <ChartTooltip {...(props as { active?: boolean; payload?: TooltipPayloadItem[]; label?: string | number })} palette={palette} />
          )}
        />
        {series.map((s, index) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? palette.series[index % palette.series.length]!}
            strokeWidth={2}
            strokeDasharray={s.dashed ? '4 4' : undefined}
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 2, stroke: palette.surface }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  height = 190,
  innerRadius = 56,
  outerRadius = 78,
  centerLabel,
  centerValue,
  onSelect,
  formatter,
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  centerLabel?: string;
  centerValue?: string | number;
  onSelect?: (label: string) => void;
  formatter?: (value: number, name: string) => string;
}) {
  const palette = useChartPalette();
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            stroke="none"
            onClick={(entry) => onSelect?.((entry as unknown as { label: string }).label)}
          >
            {data.map((item, index) => (
              <Cell key={item.label} fill={item.color ?? palette.series[index % palette.series.length]!} className={onSelect ? 'cursor-pointer' : undefined} />
            ))}
          </Pie>
          <Tooltip
            content={(props) => (
              <ChartTooltip
                {...(props as { active?: boolean; payload?: TooltipPayloadItem[]; label?: string | number })}
                palette={palette}
                formatter={formatter ? (v, n) => formatter(Number(v), n) : undefined}
              />
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerValue !== undefined ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-[25px] font-semibold leading-none tracking-tight text-ink">{centerValue}</span>
          {centerLabel ? <span className="mt-1 text-[10px] text-ink-4">{centerLabel}</span> : null}
        </div>
      ) : null}
      <span className="sr-only">{`${total} total across ${data.length} categories`}</span>
    </div>
  );
}

export function HorizontalBars({
  data,
  formatter,
  max,
  height,
}: {
  data: { label: string; value: number; color?: string; suffix?: string }[];
  formatter?: (value: number) => string;
  max?: number;
  height?: number;
}) {
  const palette = useChartPalette();
  const maxValue = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col justify-center gap-2.5 px-3 py-1" style={height ? { minHeight: height } : undefined}>
      {data.map((item, index) => (
        <div key={item.label} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-[11.5px] text-ink-2">{item.label}</span>
          <span className="num text-[11.5px] font-semibold text-ink">
            {formatter ? formatter(item.value) : item.value}
            {item.suffix ? <span className="ms-1 text-[10px] font-normal text-ink-4">{item.suffix}</span> : null}
          </span>
          <div className="col-span-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-[width] duration-500 group-hover:brightness-105"
              style={{
                width: `${Math.max(1.5, (item.value / maxValue) * 100)}%`,
                background: item.color ?? palette.series[index % palette.series.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({
  values,
  color,
  height = 34,
  className,
}: {
  values: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const palette = useChartPalette();
  const id = React.useId();
  const stroke = color ?? palette.primary;
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 88;
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - 3 - ((value - min) / range) * (height - 1);
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('h-8 w-[88px] overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${path} L${width} ${height} L0 ${height} Z`} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1]![0]} cy={points[points.length - 1]![1]} r={1.9} fill={stroke} />
    </svg>
  );
}

export function RadialGauge({
  value,
  max = 100,
  label,
  sublabel,
  size = 132,
  tone,
}: {
  value: number;
  max?: number;
  label?: string;
  sublabel?: string;
  size?: number;
  tone?: string;
}) {
  const palette = useChartPalette();
  const ratio = Math.max(0, Math.min(1, value / max));
  const radius = size / 2 - 10;
  const circumference = Math.PI * radius;
  const color = tone ?? palette.primary;
  return (
    <div className="flex flex-col items-center justify-center gap-1" style={{ width: size }}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`} aria-hidden="true">
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke={palette.grid}
          strokeWidth={9}
          strokeLinecap="round"
        />
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
          className="transition-[stroke-dasharray] duration-700"
        />
      </svg>
      <div className="-mt-3 text-center">
        <p className="num text-xl font-semibold leading-none text-ink">{label ?? `${Math.round(ratio * 100)}%`}</p>
        {sublabel ? <p className="mt-1 text-[10px] text-ink-4">{sublabel}</p> : null}
      </div>
    </div>
  );
}

export function HeatStrip({
  values,
  labels,
  legend,
}: {
  values: number[];
  labels?: string[];
  legend?: [string, string];
}) {
  const palette = useChartPalette();
  const max = Math.max(...values, 1);
  return (
    <div className="px-3">
      <div className="flex items-end gap-1">
        {values.map((value, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-[3px] transition-all duration-500 hover:opacity-80"
              style={{
                height: `${Math.max(4, (value / max) * 52)}px`,
                background: palette.series[2]!,
                opacity: 0.35 + (value / max) * 0.65,
              }}
              title={`${labels?.[index] ?? index}: ${value}`}
            />
            {labels ? <span className="text-[9px] text-ink-4">{labels[index]}</span> : null}
          </div>
        ))}
      </div>
      {legend ? (
        <div className="mt-2 flex items-center justify-between text-[9.5px] text-ink-4">
          <span>{legend[0]}</span>
          <span>{legend[1]}</span>
        </div>
      ) : null}
    </div>
  );
}
