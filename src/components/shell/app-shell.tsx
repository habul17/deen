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
    <div className="min-h-dvh md:pl-[248px]">
      <Nav />
      <main className="mx-auto w-full max-w-[1080px] px-4 pt-[max(env(safe-area-inset-top),12px)] pb-[calc(88px+env(safe-area-inset-bottom))] sm:px-6 md:px-10 md:pt-10 md:pb-16">
        {ready ? children : <ShellSkeleton />}
      </main>
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

function ShellSkeleton() {
  return (
    <div className="animate-pulse space-y-4 pt-4" aria-hidden>
      <div className="h-5 w-40 rounded-md bg-surface-2" />
      <div className="h-44 rounded-3xl bg-surface-2" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
