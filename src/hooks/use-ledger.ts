"use client";

import { useMemo } from "react";
import { dayKeyOf } from "@/lib/date";
import { FARD } from "@/lib/prayer/constants";
import { firstTrackedDay, type Ledger, type TodayContext } from "@/lib/prayer/stats";
import { useApp } from "@/store/app-store";
import { useDayTimes, useTimeZone, useTodayKey } from "./use-prayer-day";

/** Everything the stats helpers need: the local records, today's due prayers and the first tracked day. */
export function useLedger(now: Date) {
  const logs = useApp((s) => s.logs);
  const days = useApp((s) => s.days);
  const createdAt = useApp((s) => s.user?.createdAt ?? Date.now());
  const tz = useTimeZone();
  const today = useTodayKey(now);
  const { times } = useDayTimes(today);

  const ledger: Ledger = useMemo(() => ({ logs, days }), [logs, days]);
  const minute = Math.floor(now.getTime() / 60_000);
  const ctx: TodayContext = useMemo(
    () => ({ today, due: times ? FARD.filter((p) => times[p].start.getTime() <= minute * 60_000) : [] }),
    [today, times, minute],
  );
  const first = useMemo(() => firstTrackedDay(ledger, dayKeyOf(new Date(createdAt), tz)), [ledger, createdAt, tz]);
  return { ledger, ctx, first, today };
}
