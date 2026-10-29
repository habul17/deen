"use client";

import { AnimatePresence, motion } from "motion/react";
import { CloudOff } from "lucide-react";
import { useApp } from "@/store/app-store";

/** A quiet pill that appears only when changes are waiting for a connection. */
export function SyncBadge() {
  const state = useApp((s) => s.syncState);
  const pending = useApp((s) => s.outbox.length);
  const show = state === "offline" || (state === "error" && pending > 0);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          role="status"
          className="surface fixed top-[max(env(safe-area-inset-top),12px)] left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] shadow-[0_8px_24px_-12px_rgb(7_10_28/0.4)]"
        >
          <CloudOff className="size-3.5 text-ink-soft" strokeWidth={1.75} />
          {pending > 0 ? `Offline · ${pending} change${pending === 1 ? "" : "s"} will sync` : "Offline · saved on this device"}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
