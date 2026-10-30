import { Skeleton } from './misc';

export function PageSkeleton() {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <div className="hidden w-[var(--sidebar-w)] shrink-0 border-e border-line bg-surface p-3 lg:block">
        <Skeleton className="h-8 w-28" />
        <div className="mt-6 flex flex-col gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-5">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="mt-3 h-72 w-full" />
      </div>
    </div>
  );
}
