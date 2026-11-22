"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Lightbulb } from "lucide-react";
import {
  daysBetween,
  insight,
  prayerStreaks,
  rangeStart,
  ratio,
  summarize,
  tahajjudStreaks,
} from "@/lib/prayer/stats";
import { useApp } from "@/store/app-store";
import { useNow } from "@/hooks/use-now";
import { useLedger } from "@/hooks/use-ledger";
import { Heatmap } from "./heatmap";
import { Breakdown } from "./breakdown";
import { QadaPanel } from "./qada-panel";
import { Card, Tile, TileGrid } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";

type Range = "week" | "month" | "quarter" | "year";
const RANGE_KEY = "deen:stats-range";
const RANGE_LABEL: Record<Range, string> = { week: "this week", month: "the last 30 days", quarter: "the last 3 months", year: "the last year" };
const RANGES: [Range, string][] = [
  ["week", "Week"],
  ["month", "Month"],
  ["quarter", "3 months"],
  ["year", "Year"],
];

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

export function StatsView() {
  const now = useNow(60_000);
  const { ledger, ctx, first, today } = useLedger(now);
  const tahajjudEnabled = useApp((s) => s.settings.tahajjudEnabled);
  // Rendered only after the store has loaded on the client, so storage is safe to read here.
  const [range, setRange] = useState<Range>(() => {
    try {
      const saved = localStorage.getItem(RANGE_KEY) as Range | null;
      if (saved && saved in RANGE_LABEL) return saved;
    } catch {}
    return "month";
  });
  const pick = (r: Range) => {
    setRange(r);
    try {
      localStorage.setItem(RANGE_KEY, r);
    } catch {}
  };

  const streak = useMemo(() => prayerStreaks(ledger, ctx, first), [ledger, ctx, first]);
  const night = useMemo(() => tahajjudStreaks(ledger, ctx, first), [ledger, ctx, first]);
  const from = rangeStart(today, range, first);
  const summary = useMemo(() => summarize(ledger, ctx, from), [ledger, ctx, from]);
  const allTime = useMemo(() => summarize(ledger, ctx, first), [ledger, ctx, first]);
  const span = daysBetween(from, today);
  const scoredDays = span - summary.excusedDays;

  return (
    <div className="pt-6">
      <h1 className="display text-[2.75rem] leading-[0.95] font-semibold">Stats</h1>

      <section className="mt-8" aria-label="Streak">
        <div className="flex items-baseline gap-3">
          <span className="display tnum text-[5rem] leading-[0.9] font-semibold">{streak.current}</span>
          <span className="text-[1.0625rem] text-ink-soft">{streak.current === 1 ? "day" : "days"} in a row</span>
        </div>
        <p className="mt-2 text-[0.8125rem] text-ink-soft">
          {streak.current === 0 ? "Pray all five today to begin a streak." : "All five prayers, every day."}
        </p>
        <TileGrid className="mt-6 border-t border-line pt-5">
          <Tile label="Best streak" value={streak.best} sub={streak.best === 1 ? "day" : "days"} />
          {tahajjudEnabled ? (
            <Tile label="Tahajjud streak" value={night.current} sub={`${night.current === 1 ? "night" : "nights"} · best ${night.best}`} />
          ) : (
            <Tile label="All-time prayed" value={pct(ratio(allTime.prayed, allTime.expected))} sub={`${allTime.prayed} prayers`} />
          )}
        </TileGrid>
      </section>

      <Card className="mt-8" title="Consistency" hint="Tap a day to open it in History">
        <Heatmap ledger={ledger} ctx={ctx} first={first} />
      </Card>

      <section className="mt-10" aria-label="Breakdown">
        <h2 className="text-[1.0625rem] font-semibold">Breakdown</h2>
        <div className="mt-3">
          <Segmented size="sm" label="Period" value={range} onChange={pick} options={RANGES.map(([value, label]) => ({ value, label }))} />
        </div>
        <p className="mt-2.5 text-center text-[0.75rem] text-ink-soft">
          {RANGE_LABEL[range][0].toUpperCase() + RANGE_LABEL[range].slice(1)} · {days(scoredDays)}
          {summary.excusedDays > 0 && ` · ${summary.excusedDays} excused`}
        </p>

        <motion.div key={range} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mt-4 space-y-4">
          <Card>
            <TileGrid>
              <Tile label="Prayed" value={pct(ratio(summary.prayed, summary.expected))} sub={`${summary.prayed} of ${summary.expected}`} />
              <Tile label="On time" value={pct(ratio(summary.onTime, summary.prayed))} sub="of prayers prayed" />
              <Tile label="In congregation" value={pct(ratio(summary.congregation, summary.prayed))} sub="jamāʿah or masjid" />
              <Tile label="With sunnah" value={pct(ratio(summary.sunnah, summary.prayed))} sub="before or after" />
            </TileGrid>
            <p className="mt-5 flex gap-2.5 border-t border-line pt-4 text-[0.875rem] leading-relaxed">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-ink-soft" strokeWidth={1.75} aria-hidden />
              {insight(summary)}
            </p>
          </Card>

          <Breakdown summary={summary} />

          {tahajjudEnabled && (
            <Card title="Night prayer" hint="Tahajjud is voluntary and tracked on its own">
              <TileGrid cols={3}>
                <Tile label="Nights" value={summary.tahajjud.nights} sub={`${pct(ratio(summary.tahajjud.nights, span))} of nights`} />
                <Tile
                  label="Avg rakʿāt"
                  value={summary.tahajjud.nights ? (summary.tahajjud.rakats / summary.tahajjud.nights).toFixed(1).replace(/\.0$/, "") : "—"}
                  sub={`${summary.tahajjud.rakats} in total`}
                />
                <Tile label="All time" value={allTime.tahajjud.nights} sub="nights stood" />
              </TileGrid>
            </Card>
          )}
        </motion.div>
      </section>

      <QadaPanel ledger={ledger} />
    </div>
  );
}
