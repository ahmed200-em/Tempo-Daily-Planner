import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: ReactNode;
  maxWidth?: string;
}

/* Modals can stack (e.g. the edit form under the conflict dialog), so the
   scroll lock is reference-counted instead of each modal restoring its own
   previous value — otherwise closing them in the wrong order leaves the page
   stuck with `overflow: hidden`. */
let modalLockCount = 0;
let overflowBeforeLock = "";

export function Modal({ open, onClose, labelledBy, children, maxWidth }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    if (modalLockCount === 0) overflowBeforeLock = document.body.style.overflow;
    modalLockCount += 1;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      modalLockCount = Math.max(0, modalLockCount - 1);
      if (modalLockCount === 0) document.body.style.overflow = overflowBeforeLock;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className={`relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-panel shadow-2xl sm:rounded-3xl ${
              maxWidth ?? "sm:max-w-lg"
            }`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
