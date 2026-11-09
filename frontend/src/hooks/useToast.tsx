import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  type ReactElement,
} from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (toast: { type: ToastType; message: string }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message }: { type: ToastType; message: string }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => {
        const next = [...prev, { id, type, message }];
        if (next.length > 3) {
          return next.slice(next.length - 3);
        }
        return next;
      });

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`shadow-dialog animate-slide-in pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 text-sm font-medium transition-all duration-200 ${
              toast.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                : toast.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
                  : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200'
            }`}
          >
            <span className="shrink-0 text-base" aria-hidden="true">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <div className="flex-1 break-words">{toast.message}</div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
