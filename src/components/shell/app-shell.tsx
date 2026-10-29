"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/store/app-store";
import { Nav } from "./nav";
import { SyncBadge } from "./sync-badge";
import { Toaster } from "./toaster";

/** Boots the offline store, keeps it in sync, and frames every signed-in screen. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const ready = useApp((s) => s.ready);
  const onboarded = useApp((s) => s.settings.onboarded);
  const hasUser = useApp((s) => Boolean(s.user));
  const router = useRouter();
  const pathname = usePathname();

  useBootstrap();

  useEffect(() => {
    if (ready && hasUser && !onboarded && pathname !== "/onboarding") router.replace("/onboarding");
  }, [ready, hasUser, onboarded, pathname, router]);

  return (
    <div className="min-h-dvh">
      <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[calc(4.75rem+env(safe-area-inset-bottom))]">
        {ready ? children : <div className="flex-1" aria-busy />}
      </main>
      <Nav />
      <SyncBadge />
      <Toaster />
    </div>
  );
}

export function useBootstrap() {
  useEffect(() => {
    const store = useApp.getState();
    if (!store.ready) void store.init();

    const onOnline = () => void useApp.getState().flush().then(() => useApp.getState().refresh());
    const onVisible = () => {
      if (document.visibilityState === "visible") void useApp.getState().refresh();
    };
    // The service worker marks prayers from notification buttons; pull the change in.
    const onWorkerMessage = (e: MessageEvent) => {
      if (e.data?.type === "deen:synced") void useApp.getState().refresh();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    navigator.serviceWorker?.addEventListener("message", onWorkerMessage);

    // Warm the offline cache with every tab so they open without a connection.
    if ("caches" in window && process.env.NODE_ENV === "production") {
      caches
        .open("deen-pages")
        .then((c) => Promise.all(["/today", "/history", "/stats", "/settings"].map((u) => c.add(u).catch(() => {}))))
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("message", onWorkerMessage);
    };
  }, []);
}
