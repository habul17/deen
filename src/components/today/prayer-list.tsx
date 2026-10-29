"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, Sunrise } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration, formatTime, type DayKey } from "@/lib/date";
import { CONGREGATION_LABEL, JUMUAH, PRAYER_META, STATUS_LABEL, type PrayerKey } from "@/lib/prayer/constants";
import type { DayTimes } from "@/lib/prayer/times";
import type { LogData } from "@/lib/sync";
import { emptyLog, useApp } from "@/store/app-store";
import { useToast } from "@/store/toast-store";
import { useDay, useTimeZone } from "@/hooks/use-prayer-day";
import { PrayerSheet } from "./prayer-sheet";
import { StatusDot } from "./status-dot";

type Props = { date: DayKey; today: DayKey; now: Date; times: DayTimes };

export function PrayerList({ date, today, now, times }: Props) {
  const day = useDay(date);
  const tahajjud = useApp((s) => s.settings.tahajjudEnabled);
  const timeFormat = useApp((s) => s.settings.timeFormat);
  const setLog = useApp((s) => s.setLog);
  const toast = useToast((s) => s.show);
  const tz = useTimeZone();
  const [sheet, setSheet] = useState<PrayerKey | null>(null);

  const order: PrayerKey[] = [...(tahajjud ? (["TAHAJJUD"] as const) : []), "FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"];
  const label = (p: PrayerKey) => (p === "DHUHR" && day.isFriday ? JUMUAH.name : PRAYER_META[p].name);
  const arabic = (p: PrayerKey) => (p === "DHUHR" && day.isFriday ? JUMUAH.arabic : PRAYER_META[p].arabic);
  const fmt = (d: Date) => formatTime(d, tz, timeFormat);
  const isFuture = date > today;

  const quickMark = (p: PrayerKey) => {
    setLog(date, p, { ...emptyLog(), rakats: p === "TAHAJJUD" ? 2 : null });
    if ("vibrate" in navigator) navigator.vibrate?.(8);
    toast({
      message: `${label(p)} · ${p === "TAHAJJUD" ? "prayed" : "on time"}`,
      action: { label: "Undo", run: () => setLog(date, p, null) },
    });
  };

  const active = sheet ? day.get(sheet) : undefined;

  return (
    <>
      <ol className="space-y-2" aria-label="Prayers">
        {order.map((p, i) => {
          const w = times[p];
          const log = day.get(p);
          const upcoming = date === today ? now < w.start : isFuture;
          const current = date === today && now >= w.start && now < w.end;
          const state = day.excused ? "excused" : upcoming ? "upcoming" : current ? "current" : "idle";
          return (
            <motion.li
              key={p}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <PrayerRow
                prayer={p}
                name={label(p)}
                arabic={arabic(p)}
                time={fmt(w.start)}
                log={log}
                state={state}
                endsIn={current ? formatDuration(w.end.getTime() - now.getTime()) : null}
                startsIn={date === today && upcoming ? formatDuration(w.start.getTime() - now.getTime()) : null}
                shortened={day.travel && Boolean(PRAYER_META[p].shortenable)}
                onTap={() => (log ? setSheet(p) : quickMark(p))}
                onDetails={() => setSheet(p)}
              />
              {p === "FAJR" && (
                <div className="flex items-center gap-3 px-5 py-2 text-[13px] text-faint">
                  <Sunrise className="size-4" strokeWidth={1.5} />
                  <span>Sunrise</span>
                  <span className="h-px flex-1 bg-line" />
                  <span className="tnum">{fmt(times.sunrise)}</span>
                </div>
              )}
            </motion.li>
          );
        })}
      </ol>

      {sheet && (
        <PrayerSheet
          open={Boolean(sheet)}
          onClose={() => setSheet(null)}
          date={date}
          prayer={sheet}
          label={label(sheet)}
          timeLabel={`${fmt(times[sheet].start)} – ${fmt(times[sheet].end)}`}
          existing={active}
          travel={day.travel}
        />
      )}
    </>
  );
}

type RowProps = {
  prayer: PrayerKey;
  name: string;
  arabic: string;
  time: string;
  log?: LogData;
  state: "idle" | "current" | "upcoming" | "excused";
  endsIn: string | null;
  startsIn: string | null;
  shortened: boolean;
  onTap: () => void;
  onDetails: () => void;
};

const HOLD_MS = 420;

function PrayerRow({ prayer, name, arabic, time, log, state, endsIn, startsIn, shortened, onTap, onDetails }: RowProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const held = useRef(false);
  const disabled = state === "upcoming" || state === "excused";
  const isTahajjud = prayer === "TAHAJJUD";

  const cancel = () => {
    clearTimeout(timer.current);
    origin.current = null;
  };

  const caption = (() => {
    if (state === "excused") return "Excused";
    if (log) {
      if (isTahajjud) return `Prayed${log.rakats ? ` · ${log.rakats} rakʿāt` : ""}`;
      const parts: string[] = [STATUS_LABEL[log.status]];
      if (log.congregation && log.status !== "MISSED") parts.push(CONGREGATION_LABEL[log.congregation]);
      if (log.combined) parts.push("Combined");
      return parts.join(" · ");
    }
    if (state === "current") return endsIn ? `Now · ${endsIn} left` : "Now";
    if (state === "upcoming") return startsIn ? `In ${startsIn}` : "Upcoming";
    return isTahajjud ? "Optional" : "Not marked";
  })();

  const captionTone = log
    ? { ON_TIME: "text-accent", LATE: "text-late", QADA: "text-qada", MISSED: "text-missed" }[log.status]
    : state === "current"
      ? "text-accent"
      : "text-muted";

  return (
    <div
      className={cn(
        "group relative flex items-center rounded-[20px] border bg-surface transition-[border-color,opacity] duration-300",
        state === "current" && !log ? "border-[color-mix(in_oklab,var(--accent)_45%,var(--line))]" : "border-line",
        state === "excused" && "opacity-55",
      )}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={`${name}, ${time}, ${caption}. ${log ? "Open details" : "Mark as prayed"}`}
        className="press flex min-h-[72px] flex-1 items-center gap-4 rounded-[20px] py-3 pr-2 pl-4 text-left select-none [-webkit-touch-callout:none] disabled:active:scale-100"
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          if (disabled) return;
          held.current = false;
          origin.current = { x: e.clientX, y: e.clientY };
          timer.current = setTimeout(() => {
            held.current = true;
            if ("vibrate" in navigator) navigator.vibrate?.(12);
            onDetails();
          }, HOLD_MS);
        }}
        onPointerMove={(e) => {
          if (origin.current && Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 10) cancel();
        }}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onClick={() => {
          if (held.current) {
            held.current = false;
            return;
          }
          onTap();
        }}
      >
        <StatusDot status={state === "excused" ? undefined : log?.status} state={state} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className={cn("text-[17px] font-medium tracking-tight", isTahajjud && "text-ink-2")}>{name}</span>
            <span lang="ar" dir="rtl" className="font-arabic text-[15px] leading-none text-faint">
              {arabic}
            </span>
            {shortened && (
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium tracking-wide text-muted">Qasr · 2</span>
            )}
          </span>
          <span className={cn("mt-0.5 block truncate text-[13px]", captionTone)}>{caption}</span>
        </span>
        <span className={cn("tnum text-[15px]", state === "current" ? "font-medium text-ink" : "text-ink-2")}>{time}</span>
      </button>
      <button
        type="button"
        onClick={onDetails}
        disabled={disabled}
        aria-label={`${name} details`}
        className="press mr-1.5 grid size-10 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-surface-2 hover:text-ink disabled:invisible"
      >
        <ChevronRight className="size-[18px]" strokeWidth={1.75} />
      </button>
    </div>
  );
}
