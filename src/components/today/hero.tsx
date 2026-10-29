"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { formatDuration, formatTime } from "@/lib/date";
import { FARD, JUMUAH, PRAYER_META, isPrayed, type PrayerKey } from "@/lib/prayer/constants";
import { currentAndNext, type DayTimes } from "@/lib/prayer/times";
import { emptyLog, useApp } from "@/store/app-store";
import { useToast } from "@/store/toast-store";
import { useDay, useTimeZone } from "@/hooks/use-prayer-day";
import { DayArc } from "./day-arc";

export function Hero({ date, now, times, tomorrow }: { date: string; now: Date; times: DayTimes; tomorrow: DayTimes | null }) {
  const day = useDay(date);
  const tahajjud = useApp((s) => s.settings.tahajjudEnabled);
  const timeFormat = useApp((s) => s.settings.timeFormat);
  const location = useApp((s) => s.settings.locationName);
  const setLog = useApp((s) => s.setLog);
  const toast = useToast((s) => s.show);
  const tz = useTimeZone();
  const { current, next } = currentAndNext(times, tomorrow, now, tahajjud);

  const name = (p: PrayerKey, friday = day.isFriday) => (p === "DHUHR" && friday ? JUMUAH.name : PRAYER_META[p].name);
  const arabic = (p: PrayerKey, friday = day.isFriday) => (p === "DHUHR" && friday ? JUMUAH.arabic : PRAYER_META[p].arabic);
  const fmt = (d: Date) => formatTime(d, tz, timeFormat);

  const currentOpen = current && !day.get(current) && !day.excused;
  const allDone = FARD.every((p) => isPrayed(day.get(p)?.status));
  const focus: PrayerKey | null = currentOpen ? current : next?.key ?? null;
  const statuses = Object.fromEntries(FARD.map((p) => [p, day.get(p)?.status]));

  let eyebrow = "Next prayer";
  let line: React.ReactNode = null;
  if (day.excused) {
    eyebrow = "Excused today";
  } else if (currentOpen && current) {
    eyebrow = "Now";
    line = (
      <>
        <span className="tnum">{formatDuration(times[current].end.getTime() - now.getTime())}</span> left · until{" "}
        <span className="tnum">{fmt(times[current].end)}</span>
      </>
    );
  } else if (next) {
    line = (
      <>
        in <span className="tnum">{formatDuration(next.at.getTime() - now.getTime())}</span> ·{" "}
        <span className="tnum">{fmt(next.at)}</span>
        {next.tomorrow && " tomorrow"}
      </>
    );
  }

  return (
    <section
      className="relative overflow-hidden rounded-[28px] border border-line bg-surface px-6 pt-6 pb-5"
      style={{ boxShadow: "var(--shadow-card)" }}
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={cn("text-[12px] font-medium tracking-[0.12em] uppercase", eyebrow === "Now" ? "text-accent" : "text-muted")}>
            {eyebrow}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={day.excused ? "excused" : focus}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="mt-1 flex items-baseline gap-3 font-serif text-[52px] leading-[1.05] tracking-tight">
                {day.excused ? "Rest" : focus ? name(focus, next?.tomorrow && !currentOpen ? false : day.isFriday) : "—"}
                {!day.excused && focus && (
                  <span lang="ar" dir="rtl" className="font-arabic text-[22px] text-faint">
                    {arabic(focus, next?.tomorrow && !currentOpen ? false : day.isFriday)}
                  </span>
                )}
              </h2>
              <p className="mt-1 text-[15px] text-ink-2">
                {day.excused ? "No prayers are expected. Your streak is safe." : line}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        {currentOpen && current && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => {
              setLog(date, current, { ...emptyLog(), rakats: current === "TAHAJJUD" ? 2 : null });
              toast({ message: `${name(current)} · on time`, action: { label: "Undo", run: () => setLog(date, current, null) } });
            }}
            className="press mt-1 shrink-0 rounded-full bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink hover:bg-accent-hover"
          >
            Mark prayed
          </motion.button>
        )}
      </div>

      <div className="mt-5 -mx-1">
        <DayArc times={times} now={now} statuses={statuses} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-[13px] text-muted">
        <div className="flex items-center gap-3">
          <div className="flex gap-1" aria-hidden>
            {FARD.map((p) => (
              <span
                key={p}
                className={cn("h-1.5 w-5 rounded-full transition-colors duration-500", isPrayed(day.get(p)?.status) ? "bg-accent" : "bg-line-strong")}
              />
            ))}
          </div>
          <span>{allDone ? "All five prayed · alḥamdulillāh" : `${day.prayed} of 5 prayed`}</span>
        </div>
        {location && <span className="hidden truncate sm:block">{location}</span>}
      </div>
    </section>
  );
}
