import * as React from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full rounded-md border border-line bg-surface text-[13px] text-ink placeholder:text-ink-4 transition-[border-color,box-shadow] duration-150 focus:border-primary-ring focus:ring-3 focus:ring-primary-ring/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-ink-4 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode; trailing?: React.ReactNode }>(
  ({ className, icon, trailing, ...props }, ref) => {
    if (!icon && !trailing) {
      return <input ref={ref} className={cn(fieldBase, 'h-9 px-3', className)} {...props} />;
    }
    return (
      <div className="relative flex items-center">
        {icon ? <span className="pointer-events-none absolute start-2.5 text-ink-4 [&_svg]:size-4">{icon}</span> : null}
        <input ref={ref} className={cn(fieldBase, 'h-9 py-2', icon ? 'ps-8.5' : 'ps-3', trailing ? 'pe-9' : 'pe-3', className)} {...props} />
        {trailing ? <span className="absolute end-2 flex items-center text-ink-4">{trailing}</span> : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, 'min-h-20 resize-y px-3 py-2 leading-relaxed', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(fieldBase, 'h-9 cursor-pointer appearance-none bg-[length:14px] bg-[right_10px_center] bg-no-repeat pe-8 ps-3', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23949d8a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...props}
    >
      {children}
    </select>
  ),
);
NativeSelect.displayName = 'NativeSelect';

function Label({ className, children, required, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('mb-1.5 flex items-center gap-0.5 text-[11.5px] font-medium text-ink-2', className)} {...props}>
      {children}
      {required ? <span className="text-danger">*</span> : null}
    </label>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      {label ? <Label required={required}>{label}</Label> : null}
      {children}
      {error ? <p className="mt-1.5 text-[11px] text-danger">{error}</p> : hint ? <p className="mt-1.5 text-[11px] text-ink-4">{hint}</p> : null}
    </div>
  );
}

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-surface-3 px-1.5 font-sans text-[10px] font-medium text-ink-4', className)}>
      {children}
    </kbd>
  );
}

export { Input, Textarea, NativeSelect, Label, Field, Kbd, fieldBase };
