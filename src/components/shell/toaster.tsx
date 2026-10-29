"use client";

import { AnimatePresence, motion } from "motion/react";
import { useToast } from "@/store/toast-store";

export function Toaster() {
  const { toast, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-8 md:pl-[248px]">
      <AnimatePresence mode="popLayout">
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.16 } }}
            className="pointer-events-auto flex items-center gap-4 rounded-2xl bg-ink py-2.5 pr-2.5 pl-4 text-[14px] text-bg shadow-[0_16px_40px_-16px_rgb(0_0_0/0.45)]"
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.run();
                  dismiss();
                }}
                className="press rounded-xl px-3 py-1.5 font-medium text-[color-mix(in_oklab,var(--accent)_55%,var(--bg))] hover:bg-white/10"
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
