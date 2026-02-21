import { useEffect, useRef, useState } from 'react';
import { useToastContext } from '@context/ToastContext';

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICONS = {
  success: 'check_circle',
  error:   'error',
  warning: 'warning',
  info:    'info',
};

const STYLES = {
  success: 'bg-green-50  border-green-200  text-green-800',
  error:   'bg-red-50    border-red-200    text-red-800',
  warning: 'bg-amber-50  border-amber-200  text-amber-800',
  info:    'bg-blue-50   border-blue-200   text-blue-800',
};

const ICON_COLORS = {
  success: 'text-green-500',
  error:   'text-red-500',
  warning: 'text-amber-500',
  info:    'text-blue-500',
};

// ─── Single toast item ────────────────────────────────────────────────────────
function ToastItem({ id, message, type = 'info', duration }) {
  const { dismiss } = useToastContext();
  const [visible, setVisible] = useState(false);

  // Trigger enter animation on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Progress bar
  const progressRef = useRef(null);
  useEffect(() => {
    if (!progressRef.current || duration <= 0) return;
    progressRef.current.style.transition = `width ${duration}ms linear`;
    progressRef.current.style.width = '0%';
  }, [duration]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'flex items-start gap-3 w-full max-w-sm rounded-xl border shadow-lg px-4 py-3 relative overflow-hidden',
        'transition-all duration-300',
        STYLES[type],
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
    >
      {/* Icon */}
      <span
        className={`material-symbols-outlined mt-0.5 shrink-0 ${ICON_COLORS[type]}`}
        style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
        aria-hidden="true"
      >
        {ICONS[type]}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>

      {/* Dismiss button */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismiss(id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
          close
        </span>
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-current opacity-20">
          <div
            ref={progressRef}
            className="h-full bg-current opacity-60 w-full"
          />
        </div>
      )}
    </div>
  );
}

// ─── Toast container — rendered once in main.jsx / App.jsx ───────────────────
/**
 * Place <ToastContainer /> once, as a direct child of your root layout.
 * It reads from ToastContext so no props are required.
 *
 * Usage:
 *   // main.jsx
 *   <ToastProvider>
 *     <App />
 *     <ToastContainer />
 *   </ToastProvider>
 */
export default function ToastContainer() {
  const { toasts } = useToastContext();

  if (!toasts.length) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} />
        </div>
      ))}
    </div>
  );
}
