"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDayLong, formatHijri, parseDayKey, weekdayOf, type DayKey } from "@/lib/date";
import { heatCell, ratio, summarize, type HeatCell } from "@/lib/prayer/stats";
import { useApp } from "@/store/app-store";
import { useNow } from "@/hooks/use-now";
import { useLedger } from "@/hooks/use-ledger";
import { useDay, useDayTimes } from "@/hooks/use-prayer-day";
import { PrayerList } from "@/components/today/prayer-list";
import { DaySheet } from "@/components/today/day-sheet";
import { LEVEL_BG, LEVEL_INVERTS } from "@/components/stats/levels";

type Month = { y: number; m: number };

const monthKey = ({ y, m }: Month, d = 1): DayKey => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const shiftMonth = ({ y, m }: Month, n: number): Month => {
  const t = y * 12 + (m - 1) + n;
  return { y: Math.floor(t / 12), m: (t % 12) + 1 };
};
const daysInMonth = ({ y, m }: Month) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** A day deep-linked from the stats heatmap: /history?date=2026-10-29 */
function linkedDate(): DayKey | null {
  const date = new URLSearchParams(window.location.search).get("date");
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

/** First day of the week for the reader's locale (0 = Sunday). */
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
    <div className="pt-6">
      <h1 className="display text-[2.75rem] leading-[0.95] font-semibold">History</h1>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[1.0625rem] font-semibold">{monthLabel}</h2>
            <p className="truncate text-[0.8125rem] text-ink-soft">{hijriSpan}</p>
          </div>
          <div className="-mr-2 flex items-center">
            {!isCurrentMonth && (
              <button
                onClick={() => {
                  setDirection(1);
                  setMonth(null);
                  setSelected(null);
                }}
                className="mr-1 px-2 py-1.5 text-[0.8125rem] font-semibold underline-offset-[3px] hover:underline"
              >
                This month
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

        <div className="grid grid-cols-7 gap-1 text-center text-[0.75rem] text-ink-soft" aria-hidden>
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[0.8125rem] text-ink-soft">
          <p>
            {summary && summary.expected > 0 ? (
              <>
                <span className="font-semibold text-ink">{summary.completeDays}</span> complete{" "}
                {summary.completeDays === 1 ? "day" : "days"} ·{" "}
                <span className="font-semibold text-ink">{Math.round((pct ?? 0) * 100)}%</span> prayed
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
  );
}

function DayCell({ cell, today, selected, onSelect }: { cell: HeatCell; today: DayKey; selected: boolean; onSelect: () => void }) {
  const entry = useApp((s) => s.days[cell.date]);
  const { d } = parseDayKey(cell.date);
  const future = cell.kind === "future";
  const level = cell.kind === "day" ? cell.level : 0;
  const label = cell.kind === "excused" ? "excused" : future ? "upcoming" : `${cell.prayed} of 5 prayed`;

  return (
    <button
      type="button"
      role="gridcell"
      disabled={future}
      aria-selected={selected}
      aria-label={`${formatDayLong(cell.date)}, ${label}${entry?.travel ? ", travelling" : ""}${entry?.note ? ", has a note" : ""}`}
      onClick={onSelect}
      className="press group flex flex-col items-center gap-1 py-1 disabled:pointer-events-none"
    >
      <span
        className={cn(
          "tnum grid aspect-square w-full max-w-10 place-items-center rounded-full text-[0.875rem] transition-[box-shadow,background-color] duration-300",
          future && "text-ink-faint",
          cell.kind === "excused" && "text-ink-soft shadow-[inset_0_0_0_1.5px_var(--line)] [background:repeating-linear-gradient(135deg,var(--line)_0_2px,transparent_2px_6px)]",
          cell.kind === "untracked" && "text-ink-faint",
          cell.kind === "day" && (LEVEL_INVERTS(level) ? "font-semibold text-btn-ink" : level === 0 ? "text-ink-soft" : "text-ink"),
          cell.date === today && !selected && "shadow-[inset_0_0_0_1.5px_var(--ink)]",
          selected && "outline-2 outline-offset-2 outline-ink",
        )}
        style={level > 0 ? { backgroundColor: LEVEL_BG[level] } : undefined}
      >
        {d}
      </span>
      <span className="flex h-1 items-center" aria-hidden>
        {(entry?.travel || entry?.note) && <span className="size-1 rounded-full bg-ink-soft" />}
      </span>
    </button>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[0.75rem]" aria-hidden>
      <span>Fewer</span>
      {LEVEL_BG.slice(1).map((bg, i) => (
        <span key={i} className="size-2.5 rounded-full" style={{ backgroundColor: bg }} />
      ))}
      <span>All five</span>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      aria-label={formatDayLong(date)}
      className="mt-10"
    >
      <div className="mb-2 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="display text-[1.75rem] leading-tight font-semibold">{isToday ? "Today" : formatDayLong(date)}</h2>
          <p className="truncate text-[0.8125rem] text-ink-soft">
            {formatHijri(date)}
            {" · "}
            {day.excused ? "Excused" : `${day.prayed} of 5`}
            {day.travel && " · Travelling"}
          </p>
        </div>
        <button onClick={() => setSheet(true)} className="shrink-0 pb-0.5 text-[0.8125rem] font-semibold underline-offset-[3px] hover:underline">
          Day options
        </button>
      </div>

      {day.note && (
        <button onClick={() => setSheet(true)} className="mb-2 block w-full text-left text-[0.875rem] text-ink-soft">
          <span className="line-clamp-3 whitespace-pre-line">{day.note}</span>
        </button>
      )}

      {times ? (
        <PrayerList date={date} now={now} times={times} />
      ) : (
        <p className="border-y border-line py-6 text-center text-[0.875rem] text-ink-soft">Set your location in Settings to see prayer times.</p>
      )}

      {!isToday && !day.excused && day.prayed < 5 && (
        <p className="mt-3 text-[0.8125rem] text-ink-soft">Forgot to log? Tap a prayer to mark it, or hold for details.</p>
      )}

      <DaySheet open={sheet} onClose={() => setSheet(false)} date={date} />
    </motion.section>
  );
}

function NavButton({ label, children, ...props }: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      aria-label={label}
      className="press grid size-9 place-items-center rounded-full transition-colors hover:bg-fill disabled:opacity-30"
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

