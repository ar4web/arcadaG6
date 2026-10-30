import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[13px] font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.985]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-contrast shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary-ring/45 focus-visible:outline-none',
        secondary:
          'border border-line bg-surface text-ink-2 shadow-xs hover:border-line-2 hover:bg-surface-3 hover:text-ink',
        subtle: 'bg-surface-3 text-ink-2 hover:bg-canvas-raised hover:text-ink',
        ghost: 'text-ink-3 hover:bg-surface-3 hover:text-ink',
        accent: 'bg-accent text-accent-contrast shadow-xs hover:brightness-110',
        danger: 'bg-danger-soft text-danger border border-danger/30 hover:bg-danger hover:text-primary-contrast',
        outline: 'border border-line-strong text-ink-2 hover:border-ink-3 hover:text-ink',
        link: 'text-primary underline-offset-4 hover:underline px-0',
      },
      size: {
        xs: 'h-7 gap-1 px-2 text-[11px] [&_svg]:size-3.5',
        sm: 'h-8 px-2.5 text-xs [&_svg]:size-3.5',
        md: 'h-9 px-3.5 [&_svg]:size-4',
        lg: 'h-10 px-4.5 text-sm [&_svg]:size-4',
        icon: 'size-9 [&_svg]:size-4',
        'icon-sm': 'size-7 [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
