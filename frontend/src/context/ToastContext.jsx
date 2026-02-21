import { createContext, useCallback, useContext, useReducer } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
// type: 'success' | 'error' | 'warning' | 'info'
// id, message, type, duration (ms)

const ToastContext = createContext(null);

let _nextId = 1;

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast];
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const toast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = _nextId++;
    dispatch({ type: 'ADD', toast: { id, message, type, duration } });
    if (duration > 0) {
      setTimeout(() => dispatch({ type: 'REMOVE', id }), duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id) => dispatch({ type: 'REMOVE', id }), []);
  const clear   = useCallback(()   => dispatch({ type: 'CLEAR' }), []);

  // Convenience aliases
  const success = useCallback((msg, opts) => toast({ message: msg, type: 'success', ...opts }), [toast]);
  const error   = useCallback((msg, opts) => toast({ message: msg, type: 'error',   duration: 6000, ...opts }), [toast]);
  const warning = useCallback((msg, opts) => toast({ message: msg, type: 'warning', ...opts }), [toast]);
  const info    = useCallback((msg, opts) => toast({ message: msg, type: 'info',    ...opts }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, clear, success, error, warning, info }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within <ToastProvider>');
  return ctx;
}
