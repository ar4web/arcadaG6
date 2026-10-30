import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { arSA, enUS } from 'react-day-picker/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';
import 'react-day-picker/style.css';

export type CalendarProps = DayPickerProps;

/**
 * Date picker built on react-day-picker, re-skinned with the workspace tokens.
 * Locale follows the app language so the month grid flips for Arabic.
 */
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const locale = useUIStore((state) => state.locale);

  return (
    <DayPicker
      locale={locale === 'ar' ? arSA : enUS}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        root: 'relative',
        months: 'flex flex-col gap-3 sm:flex-row',
        month: 'flex flex-col gap-3',
        month_caption: 'flex h-8 items-center justify-center px-8',
        caption_label: 'text-[12px] font-medium text-ink',
        nav: 'absolute inset-x-0 top-0 flex h-8 items-center justify-between',
        button_previous:
          'inline-grid size-7 place-items-center rounded-md border border-line bg-surface text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40',
        button_next:
          'inline-grid size-7 place-items-center rounded-md border border-line bg-surface text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'w-8 pb-1 text-[9.5px] font-medium uppercase tracking-wide text-ink-4',
        week: 'mt-0.5 flex w-full',
        day: 'relative size-8 p-0 text-center',
        day_button:
          'num inline-grid size-8 cursor-pointer place-items-center rounded-md text-[11.5px] text-ink-2 transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary-ring/40 focus-visible:outline-none',
        selected: '[&_button]:bg-primary [&_button]:text-primary-contrast [&_button]:hover:bg-primary',
        today: '[&_button]:font-semibold [&_button]:text-primary',
        outside: 'text-ink-4/60',
        disabled: 'opacity-35',
        range_start: 'rounded-s-md bg-primary-soft',
        range_middle: 'bg-primary-soft [&_button]:bg-transparent [&_button]:text-primary',
        range_end: 'rounded-e-md bg-primary-soft',
        hidden: 'invisible',
        chevron: 'size-3.5',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...rest }) =>
          orientation === 'left' ? (
            <ChevronLeft className={cn('size-3.5', chevronClass)} {...rest} />
          ) : (
            <ChevronRight className={cn('size-3.5', chevronClass)} {...rest} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
