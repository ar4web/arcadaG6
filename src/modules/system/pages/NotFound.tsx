import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas px-5 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-line bg-surface text-ink-4">
        <Compass className="size-5" />
      </span>
      <p className="num text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-4">404</p>
      <h1 className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-ink">This page has moved on</h1>
      <p className="max-w-sm text-[12px] leading-relaxed text-ink-3">
        The page you asked for isn't part of this workspace. Try the HR console, or press ⌘K to search.
      </p>
      <Button variant="primary" size="sm" asChild>
        <Link to="/hr">
          <ArrowLeft className="size-3.5 rtl:rotate-180" /> Back to the overview
        </Link>
      </Button>
    </div>
  );
}
