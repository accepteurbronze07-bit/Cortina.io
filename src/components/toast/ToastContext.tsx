import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Download,
  Save,
  Copy,
  Sparkles,
} from 'lucide-react';
import { soundFx } from '../../utils/audioUtils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  timestamp: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (options: {
    type?: ToastType;
    title?: string;
    message: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
  }) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Standalone global imperative toast dispatcher
export const toast = {
  success: (message: string, title = 'Succès', options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    dispatchToastEvent({ type: 'success', title, message, ...options });
  },
  error: (message: string, title = 'Erreur', options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    dispatchToastEvent({ type: 'error', title, message, ...options });
  },
  info: (message: string, title = 'Information', options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    dispatchToastEvent({ type: 'info', title, message, ...options });
  },
  warning: (message: string, title = 'Attention', options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    dispatchToastEvent({ type: 'warning', title, message, ...options });
  },
};

function dispatchToastEvent(detail: {
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cortia:toast', { detail }));
  }
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type = 'info',
      title,
      message,
      duration = 4500,
      action,
    }: {
      type?: ToastType;
      title?: string;
      message: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        duration,
        timestamp: Date.now(),
        action,
      };

      // Sound feedback based on type
      if (type === 'success') {
        soundFx.playSfx('ding');
      } else if (type === 'error') {
        soundFx.playSfx('whoosh');
      } else if (type === 'info') {
        soundFx.playSfx('pop');
      }

      setToasts((prev) => [newToast, ...prev].slice(0, 5));
      return id;
    },
    []
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Listen to global window events
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type?: ToastType;
        title?: string;
        message: string;
        duration?: number;
        action?: { label: string; onClick: () => void };
      }>;
      if (customEvent.detail && customEvent.detail.message) {
        addToast(customEvent.detail);
      }
    };

    window.addEventListener('cortia:toast', handleGlobalToast);
    return () => window.removeEventListener('cortia:toast', handleGlobalToast);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

// Internal Toast Container with Individual Toast Items
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-4 sm:px-0 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toastItem) => (
        <SingleToast key={toastItem.id} toast={toastItem} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const SingleToast: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 4500;

  useEffect(() => {
    if (duration <= 0) return;
    const startTime = Date.now();
    const interval = 50;

    const timer = setInterval(() => {
      if (!isPaused) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          onDismiss(toast.id);
        }
      }
    }, interval);

    return () => clearInterval(timer);
  }, [toast.id, duration, isPaused, onDismiss]);

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          border: 'border-emerald-500/40',
          bg: 'bg-[#0b1419]/95',
          accent: 'bg-emerald-500',
          titleColor: 'text-emerald-300',
          glow: 'shadow-lg shadow-emerald-500/10',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          border: 'border-rose-500/40',
          bg: 'bg-[#180d14]/95',
          accent: 'bg-rose-500',
          titleColor: 'text-rose-300',
          glow: 'shadow-lg shadow-rose-500/10',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          border: 'border-amber-500/40',
          bg: 'bg-[#18140c]/95',
          accent: 'bg-amber-500',
          titleColor: 'text-amber-300',
          glow: 'shadow-lg shadow-amber-500/10',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
          border: 'border-cyan-500/40',
          bg: 'bg-[#0b131a]/95',
          accent: 'bg-cyan-500',
          titleColor: 'text-cyan-300',
          glow: 'shadow-lg shadow-cyan-500/10',
        };
    }
  };

  const style = getTypeStyles();

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${style.border} ${style.bg} ${style.glow} backdrop-blur-md p-4 transition-all duration-200 animate-in slide-in-from-bottom-3 fade-in`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{style.icon}</div>

        <div className="flex-1 min-w-0 pr-2">
          {toast.title && (
            <h5 className={`text-xs font-black uppercase tracking-wider ${style.titleColor}`}>
              {toast.title}
            </h5>
          )}
          <p className="text-xs text-slate-200 font-medium leading-relaxed mt-0.5">
            {toast.message}
          </p>

          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              className="mt-2.5 text-[11px] font-extrabold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
          aria-label="Fermer la notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar Indicator */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/60">
          <div
            className={`h-full ${style.accent} transition-all duration-50 linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
