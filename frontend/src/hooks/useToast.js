import { useToastContext } from '@context/ToastContext';

/**
 * Convenience hook for firing toasts from any component.
 *
 * Usage:
 *   const { success, error, warning, info } = useToast();
 *   success('Issue reported!');
 *   error('Something went wrong.');
 */
export function useToast() {
  const { toast, dismiss, clear, success, error, warning, info } = useToastContext();
  return { toast, dismiss, clear, success, error, warning, info };
}
