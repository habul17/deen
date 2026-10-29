"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { FARD, PRAYER_META, type FardKey } from "@/lib/prayer/constants";
import { OUTCOMES, ratio, type Outcome, type RangeSummary } from "@/lib/prayer/stats";

const OUTCOME_META: Record<Outcome, { label: string; color: string }> = {
  ON_TIME: { label: "On time", color: "var(--accent)" },
  LATE: { label: "Late", color: "var(--late)" },
  QADA: { label: "Made up", color: "var(--qada)" },
  MISSED: { label: "Missed", color: "var(--missed)" },
  UNMARKED: { label: "Not marked", color: "var(--line-strong)" },
};

/** One 100% bar per prayer: how each was kept across the selected period. */
export function Breakdown({ summary }: { summary: RangeSummary }) {
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<{ prayer: FardKey; outcome: Outcome } | null>(null);

  const rows = FARD.map((p) => {
    const counts = summary.perPrayer[p];
    const total = OUTCOMES.reduce((n, o) => n + counts[o], 0);
    return { prayer: p, counts, total };
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-ink-2" aria-label="Legend">
          {OUTCOMES.map((o) => (
            <li key={o} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: OUTCOME_META[o].color }} />
              {OUTCOME_META[o].label}
            </li>
          ))}
        </ul>
        <button
          onClick={() => setTable((t) => !t)}
          className="press rounded-full px-2.5 py-1 text-[12px] font-medium text-muted ring-1 ring-line hover:text-ink"
          aria-pressed={table}
        >
          {table ? "Chart" : "Table"}
        </button>
      </div>

      {table ? (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[440px] text-[13px]">
            <thead>
              <tr className="text-left text-muted">
                <th className="px-1 pb-2 font-medium">Prayer</th>
                {OUTCOMES.map((o) => (
                  <th key={o} className="px-1 pb-2 text-right font-medium">
                    {OUTCOME_META[o].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.prayer}>
                  <td className="px-1 py-2">{PRAYER_META[r.prayer].name}</td>
                  {OUTCOMES.map((o) => (
                    <td key={o} className="tnum px-1 py-2 text-right text-ink-2">
                      {r.counts[o]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => {
            const onTime = ratio(r.counts.ON_TIME, r.total);
            return (
              <li key={r.prayer} className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-3">
                <span className="text-[14px] font-medium">{PRAYER_META[r.prayer].name}</span>
                <div className="relative flex h-2.5 gap-[2px]" onPointerLeave={() => setHover(null)}>
                  {r.total === 0 ? (
                    <span className="h-full w-full rounded-full bg-surface-2" />
                  ) : (
                    OUTCOMES.filter((o) => r.counts[o] > 0).map((o, i, shown) => {
                      const active = hover?.prayer === r.prayer && hover.outcome === o;
                      return (
                        <span
                          key={o}
                          className={cn(
                            "relative h-full transition-opacity duration-200",
                            i === 0 && "rounded-l-full",
                            i === shown.length - 1 && "rounded-r-full",
                            hover?.prayer === r.prayer && !active && "opacity-50",
                          )}
                          style={{ flexGrow: r.counts[o], flexBasis: 0, backgroundColor: OUTCOME_META[o].color }}
                          onPointerEnter={() => setHover({ prayer: r.prayer, outcome: o })}
                        >
                          {/* Taller invisible hit area so thin segments are easy to point at. */}
                          <span className="absolute -inset-y-2 inset-x-0" />
                          {active && (
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-[12px] whitespace-nowrap text-bg shadow-lg">
                              <span className="font-medium">{OUTCOME_META[o].label}</span>
                              <span className="opacity-70">
                                {" · "}
                                {r.counts[o]} of {r.total} ({Math.round((r.counts[o] / r.total) * 100)}%)
                              </span>
                            </span>
                          )}
                        </span>
                      );
                    })
                  )}
                </div>
                <span className="tnum text-right text-[13px] text-ink-2" title="On time">
                  {onTime === null ? "—" : `${Math.round(onTime * 100)}%`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {!table && <p className="mt-4 text-right text-[12px] text-faint">Right column: share prayed on time</p>}
    </div>
  );
}
