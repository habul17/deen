"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Ellipsis, NotebookPen, Plane } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDayLong, formatHijri, parseDayKey, weekdayOf, type DayKey } from "@/lib/date";
import { heatCell, ratio, summarize, type HeatCell } from "@/lib/prayer/stats";
import { useApp } from "@/store/app-store";
import { useNow } from "@/hooks/use-now";
import { useLedger } from "@/hooks/use-ledger";
import { useDay, useDayTimes } from "@/hooks/use-prayer-day";
import { PrayerList } from "@/components/today/prayer-list";
import { DaySheet } from "@/components/today/day-sheet";
import { LEVEL_BG } from "@/components/stats/levels";

type Month = { y: number; m: number };

const monthKey = ({ y, m }: Month, d = 1): DayKey => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const shiftMonth = ({ y, m }: Month, n: number): Month => {
  const t = y * 12 + (m - 1) + n;
  return { y: Math.floor(t / 12), m: (t % 12) + 1 };
};
const daysInMonth = ({ y, m }: Month) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** First day of the week for the reader's locale (0 = Sunday). */
/** A day deep-linked from the stats heatmap: /history?date=2026-10-29 */
function linkedDate(): DayKey | null {
  const date = new URLSearchParams(window.location.search).get("date");
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function weekStart(): number {
  try {
    const locale = new Intl.Locale(navigator.language) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const first = locale.getWeekInfo?.().firstDay ?? locale.weekInfo?.firstDay;
    if (first) return first % 7;
  } catch {}
  return 1;
}

export function HistoryView() {
  const now = useNow(60_000);
  const { ledger, ctx, first, today } = useLedger(now);
  // Rendered only after the store has loaded on the client, so the URL is safe to read here.
  const [linked] = useState(linkedDate);
  const [selected, setSelected] = useState<DayKey | null>(linked);
  const [month, setMonth] = useState<Month | null>(() => (linked ? { y: parseDayKey(linked).y, m: parseDayKey(linked).m } : null));
  const [direction, setDirection] = useState(0);
  const [startDay] = useState(weekStart);

  useEffect(() => {
    if (linked) window.history.replaceState(null, "", "/history");
  }, [linked]);

  const active = selected ?? today;
  const current = useMemo(() => month ?? { y: parseDayKey(today).y, m: parseDayKey(today).m }, [month, today]);
  const isCurrentMonth = monthKey(current) === monthKey({ y: parseDayKey(today).y, m: parseDayKey(today).m });

  const cells = useMemo(() => {
    const total = daysInMonth(current);
    const lead = (weekdayOf(monthKey(current)) - startDay + 7) % 7;
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: total }, (_, i) => heatCell(ledger, ctx, monthKey(current, i + 1), first)),
    ];
  }, [current, startDay, ledger, ctx, first]);

  const summary = useMemo(() => {
    const from = monthKey(current);
    const end = monthKey(current, daysInMonth(current));
    if (from > today) return null;
    return summarize(ledger, ctx, from < first ? first : from, end > today ? today : end);
  }, [current, ledger, ctx, first, today]);

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(undefined, { weekday: "narrow", timeZone: "UTC" }).format(
      new Date(Date.UTC(2023, 0, 1 + ((startDay + i) % 7))),
    ),
  );
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(current.y, current.m - 1, 15)),
  );
  const hijriSpan = hijriMonths(monthKey(current), monthKey(current, daysInMonth(current)));

  const go = (n: number) => {
    setDirection(n);
    setMonth(shiftMonth(current, n));
  };

  const pct = summary ? ratio(summary.prayed, summary.expected) : null;

  return (
    <div className="pt-4 md:pt-0">
      <header className="mb-6">
        <h1 className="font-serif text-[34px] leading-none tracking-tight md:text-[44px]">History</h1>
        <p className="mt-2 text-[14px] text-muted">Every day you&apos;ve kept, and the ones to return to.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <section className="self-start rounded-[28px] border border-line bg-surface p-4 sm:p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <div className="min-w-0">
              <h2 className="text-[17px] font-medium tracking-tight">{monthLabel}</h2>
              <p className="truncate text-[13px] text-muted">{hijriSpan}</p>
            </div>
            <div className="flex items-center gap-1">
              {!isCurrentMonth && (
                <button
                  onClick={() => {
                    setDirection(1);
                    setMonth(null);
                    setSelected(null);
                  }}
                  className="press mr-1 h-9 rounded-full bg-accent-soft px-3.5 text-[13px] font-medium text-accent"
                >
                  Today
                </button>
              )}
              <NavButton label="Previous month" onClick={() => go(-1)}>
                <ChevronLeft className="size-[18px]" strokeWidth={1.75} />
              </NavButton>
              <NavButton label="Next month" onClick={() => go(1)} disabled={isCurrentMonth}>
                <ChevronRight className="size-[18px]" strokeWidth={1.75} />
              </NavButton>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-medium text-faint" aria-hidden>
            {weekdays.map((w, i) => (
              <div key={i} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.div
                key={monthKey(current)}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ x: d * 40, opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (d: number) => ({ x: d * -40, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-7 gap-1"
                role="grid"
                aria-label={monthLabel}
              >
                {cells.map((c, i) =>
                  c ? (
                    <DayCell key={c.date} cell={c} today={today} selected={c.date === active} onSelect={() => setSelected(c.date)} />
                  ) : (
                    <div key={`pad-${i}`} />
                  ),
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line px-1 pt-4">
            <p className="text-[13px] text-muted">
              {summary && summary.expected > 0 ? (
                <>
                  <span className="font-medium text-ink">{summary.completeDays}</span> complete{" "}
                  {summary.completeDays === 1 ? "day" : "days"} ·{" "}
                  <span className="font-medium text-ink">{Math.round((pct ?? 0) * 100)}%</span> prayed
                </>
              ) : (
                "Nothing logged this month yet."
              )}
            </p>
            <Legend />
          </div>
        </section>

        <DayPanel key={active} date={active} today={today} now={now} />
      </div>
    </div>
  );
}


function DayCell({ cell, today, selected, onSelect }: { cell: HeatCell; today: DayKey; selected: boolean; onSelect: () => void }) {
  const entry = useApp((s) => s.days[cell.date]);
  const { d } = parseDayKey(cell.date);
  const future = cell.kind === "future";
  const filled = cell.kind === "day" && cell.level > 0;
  const strong = cell.kind === "day" && cell.level >= 4;
  const label =
    cell.kind === "excused"
      ? "excused"
      : future
        ? "upcoming"
        : `${cell.prayed} of 5 prayed`;

  return (
    <button
      type="button"
      role="gridcell"
      disabled={future}
      aria-selected={selected}
      aria-label={`${formatDayLong(cell.date)}, ${label}${entry?.travel ? ", travelling" : ""}${entry?.note ? ", has a note" : ""}`}
      onClick={onSelect}
      className="press group flex flex-col items-center gap-1 rounded-xl py-1 disabled:pointer-events-none"
    >
      <span
        className={cn(
          "tnum grid aspect-square w-full max-w-11 place-items-center rounded-full text-[14px] transition-[box-shadow,background-color] duration-300",
          future && "text-faint/60",
          cell.kind === "excused" && "bg-excused-soft text-excused",
          cell.kind === "untracked" && "text-faint",
          cell.kind === "day" && (strong ? "font-medium text-accent-ink" : filled ? "text-ink" : "text-ink-2"),
          cell.date === today && !selected && "ring-1 ring-ink/70",
          selected && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
          !future && !selected && "group-hover:ring-1 group-hover:ring-line-strong",
        )}
        style={cell.kind === "day" && cell.level > 0 ? { backgroundColor: LEVEL_BG[cell.level] } : undefined}
      >
        {d}
      </span>
      <span className="flex h-1.5 items-center gap-0.5" aria-hidden>
        {entry?.travel && <span className="size-1 rounded-full bg-qada" />}
        {entry?.note && <span className="size-1 rounded-full bg-muted" />}
      </span>
    </button>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-[12px] text-muted">
      <div className="flex items-center gap-1.5">
        <span>0</span>
        {LEVEL_BG.slice(1).map((bg, i) => (
          <span key={i} className="size-3 rounded-full" style={{ backgroundColor: bg }} />
        ))}
        <span>5</span>
      </div>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-excused-soft ring-1 ring-excused/40" />
        Excused
      </span>
      <span className="hidden items-center gap-1.5 sm:flex">
        <span className="size-1.5 rounded-full bg-qada" />
        Travel
      </span>
      <span className="hidden items-center gap-1.5 sm:flex">
        <span className="size-1.5 rounded-full bg-muted" />
        Note
      </span>
    </div>
  );
}

function DayPanel({ date, today, now }: { date: DayKey; today: DayKey; now: Date }) {
  const { times } = useDayTimes(date);
  const day = useDay(date);
  const [sheet, setSheet] = useState(false);
  const isToday = date === today;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      aria-label={formatDayLong(date)}
      className="self-start"
    >
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div className="min-w-0">
          <p className="truncate text-[13px] text-muted">{formatHijri(date)}</p>
          <h2 className="mt-0.5 font-serif text-[28px] leading-tight tracking-tight">
            {isToday ? "Today" : formatDayLong(date)}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="tnum rounded-full bg-surface-2 px-3 py-1.5 text-[13px] font-medium text-ink-2">
            {day.excused ? "Excused" : `${day.prayed} / 5`}
          </span>
          <NavButton label="Day options" onClick={() => setSheet(true)}>
            <Ellipsis className="size-[18px]" strokeWidth={1.75} />
          </NavButton>
        </div>
      </div>

      {(day.travel || day.note) && (
        <button
          onClick={() => setSheet(true)}
          className="press mb-3 flex w-full items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left text-[14px]"
        >
          {day.travel ? (
            <Plane className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} />
          ) : (
            <NotebookPen className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} />
          )}
          <span className="min-w-0 text-ink-2">
            {day.travel && <span className="block font-medium text-ink">Travelling · prayers shortened</span>}
            {day.note && <span className="line-clamp-4 block whitespace-pre-line">{day.note}</span>}
          </span>
        </button>
      )}

      {times ? (
        <PrayerList date={date} today={today} now={now} times={times} />
      ) : (
        <p className="rounded-2xl border border-line bg-surface px-4 py-6 text-center text-[14px] text-muted">
          Set your location in Settings to see prayer times.
        </p>
      )}

      {!isToday && !day.excused && day.prayed < 5 && (
        <p className="mt-3 px-1 text-[13px] text-muted">Forgot to log? Tap a prayer to mark it, or hold for details.</p>
      )}

      <DaySheet open={sheet} onClose={() => setSheet(false)} date={date} />
    </motion.section>
  );
}

function NavButton({ label, children, ...props }: React.ComponentProps<"button"> & { label: string }) {
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

function hijriMonths(from: DayKey, to: DayKey) {
  const fmt = (k: DayKey) => {
    const { y, m, d } = parseDayKey(k);
    try {
      return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "long", year: "numeric", timeZone: "UTC" })
        .format(new Date(Date.UTC(y, m - 1, d, 12)))
        .replace(/\s?AH$/, "");
    } catch {
      return "";
    }
  };
  const a = fmt(from);
  const b = fmt(to);
  if (!a) return "";
  if (a === b) return `${a} AH`;
  const [am, ay] = [a.replace(/\s\d+$/, ""), a.match(/\d+$/)?.[0]];
  const [bm, by] = [b.replace(/\s\d+$/, ""), b.match(/\d+$/)?.[0]];
  return ay === by ? `${am} – ${bm} ${by} AH` : `${a} – ${b} AH`;
}

