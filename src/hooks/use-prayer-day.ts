"use client";

import { useMemo } from "react";
import { addDays, dayKeyOf, safeTimeZone, weekdayOf } from "@/lib/date";
import { FARD, isPrayed, type PrayerKey } from "@/lib/prayer/constants";
import { computeDay } from "@/lib/prayer/times";
import { logKey, useApp } from "@/store/app-store";

export function useTimeZone() {
  return useApp((s) => safeTimeZone(s.settings.timezone));
}

export function useTodayKey(now: Date) {
  const tz = useTimeZone();
  return dayKeyOf(now, tz);
}

export function useDayTimes(day: string) {
  const s = useApp((st) => st.settings);
  return useMemo(() => {
    const cfg = { ...s, timezone: safeTimeZone(s.timezone) };
    return { times: computeDay(cfg, day), tomorrow: computeDay(cfg, addDays(day, 1)) };
  }, [s, day]);
}

export function useDay(day: string) {
  const logs = useApp((s) => s.logs);
  const entry = useApp((s) => s.days[day]);
  return useMemo(() => {
    const get = (p: PrayerKey) => logs[logKey(day, p)];
    const prayed = FARD.filter((p) => isPrayed(get(p)?.status)).length;
    return {
      get,
      prayed,
      excused: entry?.excused ?? false,
      travel: entry?.travel ?? false,
      note: entry?.note ?? null,
      isFriday: weekdayOf(day) === 5,
    };
  }, [logs, entry, day]);
}
