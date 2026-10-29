"use client";

import { useEffect, useState } from "react";

/** Current time, re-rendering on a fixed tick aligned to the wall clock. */
export function useNow(tickMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const align = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), tickMs);
    }, tickMs - (Date.now() % tickMs));
    const onVisible = () => document.visibilityState === "visible" && setNow(new Date());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(align);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [tickMs]);
  return now;
}
