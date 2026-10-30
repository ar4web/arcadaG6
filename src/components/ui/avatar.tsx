import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, initials } from '@/lib/utils';

const AvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
AvatarRoot.displayName = 'AvatarRoot';

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('aspect-square size-full object-cover', className)} {...props} />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn('grid size-full place-items-center rounded-full bg-surface-3 text-[11px] font-semibold text-ink-3', className)}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

const SIZES = {
  xs: 'size-6 text-[9px]',
  sm: 'size-7 text-[10px]',
  md: 'size-9 text-[11.5px]',
  lg: 'size-12 text-sm',
  xl: 'size-16 text-lg',
} as const;

export interface AvatarProps {
  name: string;
  /** Optional photo; falls back to initials when missing or the image fails. */
  src?: string | null;
  hue?: number;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}

/**
 * Product avatar: a photo when we have one, otherwise deterministic initials on
 * a gradient derived from the person's hue. Radix handles the load/fail states.
 */
function Avatar({ name, src, hue = 0, size = 'md', className, ring }: AvatarProps) {
  return (
    <AvatarRoot
      aria-hidden="true"
      className={cn(SIZES[size], ring && 'ring-2 ring-surface', className)}
    >
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback
        className={cn('font-semibold uppercase tracking-wide text-white/95', SIZES[size])}
        style={{
          background: `linear-gradient(145deg, hsl(${hue} 32% 48%), hsl(${(hue + 28) % 360} 34% 38%))`,
        }}
      >
        {initials(name)}
      </AvatarFallback>
    </AvatarRoot>
  );
}

export { Avatar, AvatarRoot, AvatarImage, AvatarFallback };
