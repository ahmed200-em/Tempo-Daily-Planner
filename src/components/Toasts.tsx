import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export interface ToastOptions {
  title: string;
  description?: string;
  kind?: "success" | "info" | "warn";
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  kind: "success" | "info" | "warn";
  action?: { label: string; onClick: () => void };
}

const ToastCtx = createContext<(t: ToastOptions) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

const ICONS = {
  success: <CheckCircle2 size={17} className="text-accent" aria-hidden />,
  info: <Info size={17} className="text-soft" aria-hidden />,
  warn: <AlertTriangle size={17} className="text-warn" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (opts: ToastOptions) => {
      const id = idRef.current++;
      const item: ToastItem = {
        id,
        title: opts.title,
        description: opts.description,
        kind: opts.kind ?? "info",
        action: opts.action,
      };
      setToasts((ts) => [...ts.slice(-2), item]);
      window.setTimeout(() => dismiss(id), opts.duration ?? 4200);
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 480, damping: 34 }}
              role="status"
              className="pointer-events-auto flex w-full max-w-[380px] items-start gap-2.5 rounded-2xl border border-line bg-panel px-3.5 py-3 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.35)]"
            >
              <span className="mt-0.5 shrink-0">{ICONS[t.kind]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-snug text-soft">
                    {t.description}
                  </p>
                )}
                {t.action && (
                  <button
                    onClick={() => {
                      t.action!.onClick();
                      dismiss(t.id);
                    }}
                    className="mt-1.5 text-xs font-bold uppercase tracking-wide text-accent hover:underline"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-full p-1 text-mute transition-colors hover:bg-well hover:text-ink"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
