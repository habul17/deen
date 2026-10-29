"use client";

import { AnimatePresence, motion } from "motion/react";
import { useToast } from "@/store/toast-store";

export function Toaster() {
  const { toast, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-6">
      <AnimatePresence mode="popLayout">
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.16 } }}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-[14px] text-btn-ink shadow-[0_16px_40px_-16px_rgb(7_10_28/0.5)]"
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.run();
                  dismiss();
                }}
                className="press rounded-full px-3 py-1.5 font-semibold underline-offset-[3px] hover:underline"
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
