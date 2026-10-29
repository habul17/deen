"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { SkyDriver } from "@/components/sky/sky-driver";
import { usePrefs } from "@/store/prefs-store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    usePrefs.getState().load();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 420, damping: 38 }}>
      <SkyDriver />
      {children}
    </MotionConfig>
  );
}
