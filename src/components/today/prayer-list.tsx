"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatTime, type DayKey } from "@/lib/date";
import { JUMUAH, PRAYER_META, isPrayed, type PrayerKey } from "@/lib/prayer/constants";
import type { DayTimes } from "@/lib/prayer/times";
import type { LogData } from "@/lib/sync";
import { emptyLog, useApp } from "@/store/app-store";
import { usePrefs } from "@/store/prefs-store";
import { useToast } from "@/store/toast-store";
import { useDay, useTimeZone } from "@/hooks/use-prayer-day";
import { PrayerSheet } from "./prayer-sheet";

type Props = {
  date: DayKey;
  now: Date;
  times: DayTimes;
  /** The prayer whose time it is now, drawn larger. */
  current?: PrayerKey | null;
  /** Its time is nearly up and it isn't marked yet. */
  nudge?: boolean;
  onHold?: () => void;
};

export function prayerName(p: PrayerKey, friday: boolean) {
  return p === "DHUHR" && friday ? JUMUAH.name : PRAYER_META[p].name;
}

/** The day's prayers as quiet lines. Tap to mark, tap again to undo, hold for details. */
export function PrayerList({ date, now, times, current = null, nudge = false, onHold }: Props) {
  const day = useDay(date);
  const tahajjud = useApp((s) => s.settings.tahajjudEnabled);
  const timeFormat = useApp((s) => s.settings.timeFormat);
  const setLog = useApp((s) => s.setLog);
  const arabicNames = usePrefs((s) => s.arabicNames);
  const toast = useToast((s) => s.show);
  const tz = useTimeZone();
  const [sheet, setSheet] = useState<PrayerKey | null>(null);
  const [popped, setPopped] = useState<PrayerKey | null>(null);

  const order: PrayerKey[] = [...(tahajjud ? (["TAHAJJUD"] as const) : []), "FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"];
  const label = (p: PrayerKey) => prayerName(p, day.isFriday);
  const arabic = (p: PrayerKey) => (p === "DHUHR" && day.isFriday ? JUMUAH.arabic : PRAYER_META[p].arabic);
  const fmt = (d: Date) => formatTime(d, tz, timeFormat);

  const toggle = (p: PrayerKey) => {
    const previous = day.get(p);
    if (previous) {
      setLog(date, p, null);
      toast({ message: `${label(p)} unmarked`, action: { label: "Undo", run: () => setLog(date, p, previous) } });
      return;
    }
    setLog(date, p, { ...emptyLog(), rakats: p === "TAHAJJUD" ? 2 : null });
    setPopped(p);
    if ("vibrate" in navigator) navigator.vibrate?.(8);
  };

  return (
    <>
      <ol aria-label="Prayers" className="divide-y divide-line">
        {order.map((p) => (
          <li key={p}>
            <PrayerRow
              name={label(p)}
              arabic={arabicNames ? arabic(p) : null}
              time={fmt(times[p].start)}
              log={day.get(p)}
              current={p === current}
              nudge={p === current && nudge}
              future={now < times[p].start}
              excused={day.excused}
              pop={popped === p}
              onTap={() => toggle(p)}
              onHold={() => {
                setSheet(p);
                onHold?.();
              }}
            />
          </li>
        ))}
      </ol>

      {sheet && (
        <PrayerSheet
          open={Boolean(sheet)}
          onClose={() => setSheet(null)}
          date={date}
          prayer={sheet}
          label={label(sheet)}
          timeLabel={`${fmt(times[sheet].start)} – ${fmt(times[sheet].end)}`}
          existing={day.get(sheet)}
          travel={day.travel}
        />
      )}
    </>
  );
}

type RowProps = {
  name: string;
  arabic: string | null;
  time: string;
  log?: LogData;
  current: boolean;
  nudge: boolean;
  future: boolean;
  excused: boolean;
  pop: boolean;
  onTap: () => void;
  onHold: () => void;
};

const HOLD_MS = 480;

function PrayerRow({ name, arabic, time, log, current, nudge, future, excused, pop, onTap, onHold }: RowProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const held = useRef(false);
  const disabled = future || excused;
  const prayed = isPrayed(log?.status);
  const missed = log?.status === "MISSED";

  const cancel = () => {
    clearTimeout(timer.current);
    origin.current = null;
  };

  const state = excused ? "excused" : prayed ? "prayed" : missed ? "missed" : future ? "not yet" : "not marked";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={prayed}
      aria-label={`${name}, ${time}, ${state}`}
      className={cn(
        "grid w-full grid-cols-[1fr_auto_1.75rem] items-center gap-3.5 text-left select-none [-webkit-touch-callout:none]",
        current ? "py-[1.0625rem] text-[1.3125rem] font-semibold" : "py-[0.8125rem] text-base",
        disabled && "text-ink-soft",
        excused && "opacity-70",
      )}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (disabled) return;
        held.current = false;
        origin.current = { x: e.clientX, y: e.clientY };
        timer.current = setTimeout(() => {
          held.current = true;
          if ("vibrate" in navigator) navigator.vibrate?.(12);
          onHold();
        }, HOLD_MS);
      }}
      onPointerMove={(e) => {
        if (origin.current && Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 10) cancel();
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        // Keyboard users get the details sheet from the context-menu key or Shift+Enter.
        if (!disabled && (e.key === "ContextMenu" || (e.key === "Enter" && e.shiftKey))) {
          e.preventDefault();
          onHold();
        }
      }}
      onClick={() => {
        if (held.current) {
          held.current = false;
          return;
        }
        onTap();
      }}
    >
      <span className="flex min-w-0 items-baseline gap-2.5">
        <span className="truncate">{name}</span>
        {arabic && (
          <span lang="ar" dir="rtl" className="font-arabic text-[0.9375rem] leading-none font-normal text-ink-soft">
            {arabic}
          </span>
        )}
      </span>
      <span className={cn("tnum", current ? "text-base text-ink" : "text-sm font-normal text-ink-soft")}>{time}</span>
      <Ring current={current} prayed={prayed} missed={missed} nudge={nudge} pop={pop} />
    </button>
  );
}

function Ring({ current, prayed, missed, nudge, pop }: { current: boolean; prayed: boolean; missed: boolean; nudge: boolean; pop: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid place-items-center justify-self-end rounded-full",
        current ? "size-7" : "size-6",
        prayed
          ? cn("bg-ink text-btn-ink", pop && "animate-pop")
          : current
            ? cn("shadow-[inset_0_0_0_2px_var(--ink)]", nudge && "animate-breathe")
            : "shadow-[inset_0_0_0_1.5px_var(--ink-soft)]",
      )}
    >
      {prayed && (
        <svg viewBox="0 0 16 16" className={current ? "size-[13px]" : "size-3"} fill="none">
          <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {missed && <span className="h-[1.5px] w-2.5 rounded-full bg-ink-soft" />}
    </span>
  );
}
