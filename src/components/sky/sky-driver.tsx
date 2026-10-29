"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useNow } from "@/hooks/use-now";
import { useDayTimes, useTimeZone, useTodayKey } from "@/hooks/use-prayer-day";
import { DEFAULT_FRAME, SKY_STORAGE_KEY, minuteNow, paintSky, skyFrame, type SkyFrame } from "@/lib/sky";

function storedFrame(): SkyFrame {
  try {
    const f = JSON.parse(localStorage.getItem(SKY_STORAGE_KEY) ?? "null");
    if (f?.keys) return f;
  } catch {}
  return DEFAULT_FRAME;
}

const noSubscribe = () => () => {};

/** Keeps the sky in step with the clock and the user's real prayer times. */
export function SkyDriver() {
  // The clock only exists in the browser; the inline script has already painted the first frame.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  return mounted ? <SkyClock /> : null;
}

function SkyClock() {
  const now = useNow(60_000);
  const tz = useTimeZone();
  const today = useTodayKey(now);
  const { times } = useDayTimes(today);

  const frame = useMemo(() => (times ? skyFrame(times, today, tz) : null), [times, today, tz]);

  useEffect(() => {
    if (frame) {
      try {
        localStorage.setItem(SKY_STORAGE_KEY, JSON.stringify(frame));
      } catch {}
    }
    paintSky(document.documentElement, frame ? minuteNow(now, tz) : now.getHours() * 60 + now.getMinutes(), frame ?? storedFrame());
  }, [frame, now, tz]);

  return null;
}

/** The fixed sky behind every screen. Painted before first paint by the inline script. */
export function Sky() {
  return (
    <div className="sky" aria-hidden>
      <div className="sky-stars" />
      <div className="sky-orb" />
      <div className="sky-veil" />
    </div>
  );
}
