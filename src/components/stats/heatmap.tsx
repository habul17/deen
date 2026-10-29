"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, formatDayLong, parseDayKey, weekdayOf, type DayKey } from "@/lib/date";
import { heatCell, type HeatCell, type Ledger, type TodayContext } from "@/lib/prayer/stats";
import { LEVEL_BG } from "./levels";

const CELL = 13;
const GAP = 3;
const LABEL_W = 22;

/** A year of days, one column per week, shaded by how many of the five prayers were kept. */
export function Heatmap({ ledger, ctx, first }: { ledger: Ledger; ctx: TodayContext; first: DayKey }) {
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);
  const [weeks, setWeeks] = useState(18);
  const [hover, setHover] = useState<{ cell: HeatCell; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const fit = Math.floor((entry.contentRect.width - LABEL_W + GAP) / (CELL + GAP));
      setWeeks(Math.max(8, Math.min(53, fit)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columns = useMemo(() => {
    // The last column is the current week; weeks start on Monday for an even rhythm.
    const offset = (weekdayOf(ctx.today) + 6) % 7;
    const lastStart = addDays(ctx.today, -offset);
    return Array.from({ length: weeks }, (_, w) => {
      const start = addDays(lastStart, -(weeks - 1 - w) * 7);
      return Array.from({ length: 7 }, (_, d) => heatCell(ledger, ctx, addDays(start, d), first));
    });
  }, [weeks, ledger, ctx, first]);

  // Label each month where it starts, skipping any that would crowd the previous label.
  let lastLabel = -Infinity;
  const months = columns.map((col, i) => {
    const { m } = parseDayKey(col[0].date);
    const prev = i > 0 ? parseDayKey(columns[i - 1][0].date).m : null;
    if (prev === m || i >= columns.length - 1 || i - lastLabel < 3) return null;
    if (i === 0 && parseDayKey(columns[Math.min(2, columns.length - 1)][0].date).m !== m) return null;
    lastLabel = i;
    return new Intl.DateTimeFormat(undefined, { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, m - 1, 15)));
  });

  const kept = columns.flat().filter((c) => c.kind === "day" && c.level === 5).length;
  const width = LABEL_W + weeks * (CELL + GAP) - GAP;
  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div ref={wrap} className="relative w-full">
      <svg
        width={width}
        height={7 * (CELL + GAP) + 18}
        role="img"
        aria-label={`Last ${weeks} weeks: ${kept} days with all five prayers kept.`}
        className="block overflow-visible"
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <pattern id="heat-excused" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="var(--ink-soft)" strokeWidth="1.2" />
          </pattern>
        </defs>
        {months.map(
          (label, i) =>
            label && (
              <text key={i} x={LABEL_W + i * (CELL + GAP)} y={10} className="fill-ink-soft text-[11px]">
                {label}
              </text>
            ),
        )}
        {dayLabels.map(
          (label, i) =>
            label && (
              <text key={label} x={0} y={18 + i * (CELL + GAP) + CELL - 3} className="fill-ink-soft text-[10px]">
                {label.slice(0, 1)}
              </text>
            ),
        )}
        {columns.map((col, w) =>
          col.map((c, d) => {
            const x = LABEL_W + w * (CELL + GAP);
            const y = 18 + d * (CELL + GAP);
            if (c.kind === "future") return null;
            const empty = c.kind === "untracked" || (c.kind === "day" && c.level === 0);
            const fill = c.kind === "excused" ? "url(#heat-excused)" : empty ? "transparent" : LEVEL_BG[c.level];
            return (
              <rect
                key={c.date}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={3.5}
                fill={fill}
                stroke={c.date === ctx.today ? "var(--ink)" : empty ? "var(--line)" : "none"}
                strokeWidth={c.date === ctx.today ? 1.5 : 1}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onPointerEnter={() => setHover({ cell: c, x: x + CELL / 2, y })}
                onClick={() => router.push(`/history?date=${c.date}`)}
              />
            );
          }),
        )}
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-full bg-ink px-3 py-1.5 text-[12px] whitespace-nowrap text-btn-ink shadow-lg"
          style={{ left: Math.min(Math.max(hover.x, 80), width - 80), top: hover.y - 6 }}
          role="status"
        >
          <span className="font-medium">{formatDayLong(hover.cell.date)}</span>
          <span className="opacity-70">
            {" · "}
            {hover.cell.kind === "excused"
              ? "Excused"
              : hover.cell.kind === "untracked"
                ? "Before you started"
                : `${hover.cell.prayed} of ${hover.cell.date === ctx.today ? hover.cell.due : 5} prayed`}
          </span>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-ink-soft">
        <span>Tap a day to open it in History.</span>
        <div className="flex items-center gap-1.5">
          <span>0</span>
          {LEVEL_BG.map((bg, i) => (
            <span key={i} className="size-[11px] rounded-[3px]" style={i ? { backgroundColor: bg } : { boxShadow: "inset 0 0 0 1px var(--line)" }} />
          ))}
          <span>5 prayers</span>
          <span className="ml-3 size-[11px] rounded-[3px] [background:repeating-linear-gradient(135deg,var(--ink-soft)_0_1.2px,transparent_1.2px_4px)]" />
          <span>Excused</span>
        </div>
      </div>
    </div>
  );
}
