import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, Undo2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'undo';
  title: string;
  message?: string;
  onUndo?: () => void;
  duration?: number; // ms
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [timeLeft, setTimeLeft] = useState(toast.duration ? Math.floor(toast.duration / 1000) : 10);

  useEffect(() => {
    const duration = toast.duration || (toast.type === 'undo' ? 10000 : 4000);

    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    let interval: any;
    if (toast.type === 'undo') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
    undo: <Undo2 className="w-5 h-5 text-indigo-500 shrink-0" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto w-full bg-slate-900/95 text-white dark:bg-slate-800/95 dark:text-white rounded-2xl p-4 shadow-xl border border-slate-700/80 backdrop-blur-md flex items-center justify-between space-x-3"
    >
      <div className="flex items-center space-x-3 overflow-hidden">
        {icons[toast.type]}
        <div className="overflow-hidden">
          <h4 className="text-xs font-semibold leading-tight">{toast.title}</h4>
          {toast.message && (
            <p className="text-[11px] text-slate-300 truncate mt-0.5">{toast.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {toast.type === 'undo' && toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo!();
              onDismiss(toast.id);
            }}
            className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo ({timeLeft}s)</span>
          </button>
        )}
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-white p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
