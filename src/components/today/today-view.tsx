"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Ellipsis, MapPin, NotebookPen, Plane } from "lucide-react";
import { motion } from "motion/react";
import { addDays, formatDayLong, formatHijri } from "@/lib/date";
import { PRAYERS, type PrayerKey } from "@/lib/prayer/constants";
import { emptyLog, useApp } from "@/store/app-store";
import { useNow } from "@/hooks/use-now";
import { useDay, useDayTimes, useTodayKey } from "@/hooks/use-prayer-day";
import { Hero } from "./hero";
import { PrayerList } from "./prayer-list";
import { DaySheet } from "./day-sheet";

export function TodayView() {
  const now = useNow(15_000);
  const today = useTodayKey(now);
  const [viewed, setViewed] = useState<string | null>(null);
  const date = viewed ?? today;
  const isToday = date === today;
  const [daySheet, setDaySheet] = useState(false);
  const { times, tomorrow } = useDayTimes(date);
  const day = useDay(date);
  const yesterday = useDay(addDays(today, -1));
  const todayTimes = useDayTimes(today).times;
  const setLog = useApp((s) => s.setLog);

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

  const showIshaPrompt =
    isToday && todayTimes && now < todayTimes.FAJR.start && !yesterday.get("ISHA") && !yesterday.excused;

  return (
    <div className="pt-4 md:pt-0">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[13px] text-muted">
            <span className="truncate">{formatHijri(date)}</span>
          </div>
          <h1 className="mt-1 font-serif text-[34px] leading-none tracking-tight md:text-[44px]">
            {isToday ? "Today" : formatDayLong(date).split(",")[0]}
            <span className="ml-3 align-middle font-sans text-[15px] tracking-normal text-muted">
              {formatDayLong(date).split(",").slice(1).join(",").trim() || formatDayLong(date)}
            </span>
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!isToday && (
            <button
              onClick={() => setViewed(null)}
              className="press mr-1 h-9 rounded-full bg-accent-soft px-3.5 text-[13px] font-medium text-accent"
            >
              Today
            </button>
          )}
          <IconButton label="Previous day" onClick={() => setViewed(addDays(date, -1))}>
            <ChevronLeft className="size-[18px]" strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Next day" onClick={() => setViewed(addDays(date, 1) === today ? null : addDays(date, 1))} disabled={isToday}>
            <ChevronRight className="size-[18px]" strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Day options" onClick={() => setDaySheet(true)}>
            <Ellipsis className="size-[18px]" strokeWidth={1.75} />
          </IconButton>
        </div>
      </header>

      {showIshaPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-[14px]"
        >
          <span className="text-ink-2">Last night&apos;s Isha isn&apos;t marked yet.</span>
          <button
            className="press shrink-0 rounded-full bg-surface px-3 py-1.5 text-[13px] font-medium text-accent ring-1 ring-line"
            onClick={() => setLog(addDays(today, -1), "ISHA", emptyLog())}
          >
            Mark prayed
          </button>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
        <div className="space-y-3 lg:sticky lg:top-10 lg:self-start">
          {isToday ? (
            <Hero date={date} now={now} times={times} tomorrow={tomorrow} />
          ) : (
            <PastDaySummary date={date} />
          )}
          {(day.travel || day.note) && (
            <button
              onClick={() => setDaySheet(true)}
              className="press flex w-full items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left text-[14px]"
            >
              {day.travel ? <Plane className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} /> : <NotebookPen className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} />}
              <span className="min-w-0 text-ink-2">
                {day.travel && <span className="block font-medium text-ink">Travelling · prayers shortened</span>}
                {day.note && <span className="line-clamp-3 block whitespace-pre-line">{day.note}</span>}
              </span>
            </button>
          )}
        </div>
        <PrayerList date={date} today={today} now={now} times={times} />
      </div>

      <DaySheet open={daySheet} onClose={() => setDaySheet(false)} date={date} />
    </div>
  );
}

function PastDaySummary({ date }: { date: string }) {
  const day = useDay(date);
  return (
    <section className="rounded-[28px] border border-line bg-surface px-6 py-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="text-[12px] font-medium tracking-[0.12em] text-muted uppercase">{day.excused ? "Excused" : "Prayed"}</div>
      <div className="mt-1 font-serif text-[52px] leading-none tracking-tight">
        {day.excused ? "Rest" : (
          <>
            {day.prayed}
            <span className="text-faint"> / 5</span>
          </>
        )}
      </div>
      <p className="mt-2 text-[14px] text-muted">Tap a prayer to log it. Hold, or use the arrow, for details.</p>
    </section>
  );
}

function IconButton({ label, children, ...props }: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      aria-label={label}
      className="press grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}

function NoLocation() {
  return (
    <div className="mx-auto max-w-sm pt-24 text-center">
      <MapPin className="mx-auto size-6 text-muted" strokeWidth={1.5} />
      <h1 className="mt-4 font-serif text-3xl">Where are you praying?</h1>
      <p className="mt-2 text-muted">Prayer times are calculated from your location.</p>
      <Link href="/onboarding" className="press mt-6 inline-flex h-11 items-center rounded-xl bg-accent px-5 font-medium text-accent-ink">
        Set location
      </Link>
    </div>
  );
}
