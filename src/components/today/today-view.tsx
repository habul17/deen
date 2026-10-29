"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Settings2 } from "lucide-react";
import { addDays, formatCountdown, formatDayLong, formatTime } from "@/lib/date";
import { FARD, PRAYERS, type PrayerKey } from "@/lib/prayer/constants";
import { emptyLog, useApp } from "@/store/app-store";
import { usePrefs } from "@/store/prefs-store";
import { useNow } from "@/hooks/use-now";
import { useDay, useDayTimes, useTimeZone, useTodayKey } from "@/hooks/use-prayer-day";
import { PrayerList, prayerName } from "./prayer-list";
import { DaySheet } from "./day-sheet";

const NUDGE_MS = 20 * 60_000;

export function TodayView() {
  const now = useNow(15_000);
  const today = useTodayKey(now);
  const tz = useTimeZone();
  const timeFormat = useApp((s) => s.settings.timeFormat);
  const { times, tomorrow } = useDayTimes(today);
  const day = useDay(today);
  const yesterday = useDay(addDays(today, -1));
  const setLog = useApp((s) => s.setLog);
  const prefs = usePrefs();
  const [daySheet, setDaySheet] = useState(false);

  // The top of the screen and the list each get their own veil and ink.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.veil = "zones";
    return () => {
      delete root.dataset.veil;
    };
  }, []);

  // Opened from a notification action: /today?mark=FAJR&date=2026-10-29
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mark = params.get("mark") as PrayerKey | null;
    const markDate = params.get("date");
    if (mark && markDate && PRAYERS.includes(mark) && !useApp.getState().logs[`${markDate}|${mark}`]) {
      setLog(markDate, mark, emptyLog());
    }
    if (mark) window.history.replaceState(null, "", "/today");
  }, [setLog]);

  if (!times) return <NoLocation />;

  const t = now.getTime();
  const current = FARD.find((k) => t >= times[k].start.getTime() && t < times[k].end.getTime()) ?? null;
  const next = FARD.find((k) => t < times[k].start.getTime()) ?? null;
  const nudge = Boolean(current && !day.get(current) && times[current].end.getTime() - t <= NUDGE_MS);
  const allDone = day.prayed === FARD.length;
  const fmt = (d: Date) => formatTime(d, tz, timeFormat);

  const focus = day.excused
    ? { title: "Excused", line: <>No prayers expected today</> }
    : allDone
      ? { title: "All done", line: tomorrow && <>Fajr tomorrow at <b className="font-semibold">{fmt(tomorrow.FAJR.start)}</b></> }
      : current
        ? { title: prayerName(current, day.isFriday), line: <>ends in <b className="font-semibold">{formatCountdown(times[current].end.getTime() - t)}</b></> }
        : next
          ? { title: prayerName(next, day.isFriday), line: <>begins in <b className="font-semibold">{formatCountdown(times[next].start.getTime() - t)}</b></> }
          : { title: "Isha", line: null };

  const ishaPending = t < times.FAJR.start.getTime() && !yesterday.get("ISHA") && !yesterday.excused;
  const holdHint = prefs.loaded && !prefs.holdHintSeen && !day.excused;
  const seeHint = () => prefs.set({ holdHintSeen: true });

  return (
    <div className="flex flex-1 flex-col">
      <header className="zone-t">
        <div className="flex items-center justify-between text-sm text-ink-soft">
          <button onClick={() => setDaySheet(true)} className="-ml-1 rounded-md px-1 py-1.5 text-left">
            {formatDayLong(today)}
            {day.travel && " · Travelling"}
          </button>
          <Link href="/settings" aria-label="Settings" className="press -mr-1.5 grid size-9 place-items-center rounded-full">
            <Settings2 className="size-[18px]" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="mt-10 grid gap-2" aria-live="polite">
          <motion.h1
            key={focus.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="display text-[clamp(3rem,18vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.04em]"
          >
            {focus.title}
          </motion.h1>
          {focus.line && (
            <p className={nudge ? "text-[1.1875rem] text-ink transition-colors duration-700" : "text-[1.1875rem] text-ink-soft transition-colors duration-700"}>
              {focus.line}
            </p>
          )}
        </div>
      </header>

      <section className="zone-l mt-auto pt-10">
        {ishaPending ? (
          <Hint onAction={() => setLog(addDays(today, -1), "ISHA", emptyLog())} action="Mark it">
            Last night&apos;s Isha isn&apos;t marked
          </Hint>
        ) : (
          holdHint && (
            <Hint onAction={seeHint} action="Got it">
              Hold a line for jamāʿah or sunnah
            </Hint>
          )
        )}
        <PrayerList date={today} now={now} times={times} current={current} nudge={nudge} onHold={seeHint} />
      </section>

      <DaySheet open={daySheet} onClose={() => setDaySheet(false)} date={today} />
    </div>
  );
}

function Hint({ children, action, onAction }: { children: React.ReactNode; action: string; onAction: () => void }) {
  return (
    <p className="mb-1.5 flex items-baseline justify-between gap-3 text-[0.8125rem] text-ink-soft">
      <span>{children}</span>
      <button onClick={onAction} className="shrink-0 text-ink underline underline-offset-[3px]">
        {action}
      </button>
    </p>
  );
}

function NoLocation() {
  return (
    <div className="flex flex-1 flex-col justify-center pb-16">
      <h1 className="display text-[2.75rem] leading-[0.95] font-semibold">Where do you pray?</h1>
      <p className="mt-3 text-[1.0625rem] text-ink-soft">Prayer times are worked out from your location.</p>
      <Link href="/onboarding" className="press mt-8 inline-flex h-12 w-fit items-center rounded-full bg-ink px-6 font-medium text-btn-ink">
        Set location
      </Link>
    </div>
  );
}
