"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

const ToastCtx = createContext<(message: string, type?: ToastType) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="print-hide pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

const STYLES: Record<ToastType, { ring: string; icon: ReactNode }> = {
  success: {
    ring: "border-emerald-500/30",
    icon: (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    ),
  },
  error: {
    ring: "border-red-500/30",
    icon: (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </span>
    ),
  },
  info: {
    ring: "border-cyan-500/30",
    icon: (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
      </span>
    ),
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const s = STYLES[toast.type];
  return (
    <div
      className={`animate-toast-in pointer-events-auto flex items-center gap-3 rounded-xl border ${s.ring} bg-zinc-900/95 px-4 py-3 text-sm text-zinc-100 shadow-xl shadow-black/40 backdrop-blur`}
    >
      {s.icon}
      <span className="min-w-0 flex-1">{toast.message}</span>
    </div>
  );
}
