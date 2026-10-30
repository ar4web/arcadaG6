import { Toaster as SonnerToaster, toast } from 'sonner';
import { useUIStore } from '@/stores/ui';

/**
 * Toasts are rendered by sonner; this wrapper keeps the theme in sync with the
 * workspace and gives the product a single import for notifications.
 */
function Toaster() {
  const theme = useUIStore((state) => state.theme);
  return (
    <SonnerToaster
      position="bottom-right"
      closeButton
      theme={theme === 'system' ? 'system' : theme}
      toastOptions={{
        style: {
          fontSize: '12px',
          borderRadius: '10px',
          background: 'var(--surface)',
          color: 'var(--ink)',
          border: '1px solid var(--line)',
        },
      }}
    />
  );
}

export { Toaster, toast };
export type { ExternalToast } from 'sonner';
