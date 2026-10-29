"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
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
          <span className="display tnum text-[5.5rem] leading-[0.9] font-semibold">{streak.current}</span>
          <span className="text-[1.1875rem] text-ink-soft">{streak.current === 1 ? "day" : "days"} in a row</span>
        </div>
        <p className="mt-3 text-[0.875rem] text-ink-soft">
          {streak.current === 0 ? "Pray all five today to begin a streak." : "All five prayed each day."} Best{" "}
          <span className="font-semibold text-ink">{days(streak.best)}</span>
          {tahajjudEnabled && (
            <>
              {" · "}Tahajjud <span className="font-semibold text-ink">{night.current}</span> {night.current === 1 ? "night" : "nights"}
            </>
          )}
        </p>
      </section>

      <Section title="Consistency" subtitle="Each square is a day, shaded by prayers kept.">
        <Heatmap ledger={ledger} ctx={ctx} first={first} />
      </Section>

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 className="text-[1.0625rem] font-semibold">Breakdown</h2>
          <div role="radiogroup" aria-label="Period" className="-mr-1.5 flex text-[0.8125rem]">
            {RANGES.map(([r, label]) => (
              <button
                key={r}
                role="radio"
                aria-checked={range === r}
                onClick={() => pick(r)}
                className={range === r ? "px-1.5 py-1 font-semibold text-ink" : "px-1.5 py-1 text-ink-soft hover:text-ink"}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-0.5 text-[0.8125rem] text-ink-soft">
          {RANGE_LABEL[range][0].toUpperCase() + RANGE_LABEL[range].slice(1)} · {days(scoredDays)}
          {summary.excusedDays > 0 && ` (${summary.excusedDays} excused)`}
        </p>

        <motion.div key={range} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            <Stat label="Prayed" value={pct(ratio(summary.prayed, summary.expected))} sub={`${summary.prayed} of ${summary.expected}`} />
            <Stat label="On time" value={pct(ratio(summary.onTime, summary.prayed))} sub="of prayers prayed" />
            <Stat label="In congregation" value={pct(ratio(summary.congregation, summary.prayed))} sub="jamāʿah or masjid" />
            <Stat label="With sunnah" value={pct(ratio(summary.sunnah, summary.prayed))} sub="before or after" />
          </dl>
          <p className="mt-4 text-[0.9375rem] leading-relaxed">{insight(summary)}</p>

          <Section title="By prayer" subtitle="How each prayer was kept.">
            <Breakdown summary={summary} />
          </Section>

          {tahajjudEnabled && (
            <Section title="Night prayer" subtitle="Tahajjud is voluntary and tracked on its own.">
              <dl className="divide-y divide-line border-y border-line">
                <Stat label="Nights" value={String(summary.tahajjud.nights)} sub={`${pct(ratio(summary.tahajjud.nights, span))} of nights`} />
                <Stat
                  label="Average rakʿāt"
                  value={summary.tahajjud.nights ? (summary.tahajjud.rakats / summary.tahajjud.nights).toFixed(1).replace(/\.0$/, "") : "—"}
                  sub={`${summary.tahajjud.rakats} in total`}
                />
                <Stat label="All time" value={String(allTime.tahajjud.nights)} sub="nights you stood" />
              </dl>
            </Section>
          )}
        </motion.div>
      </section>

      <QadaPanel ledger={ledger} />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-[0.9375rem]">
        {label}
        {sub && <span className="ml-2 text-[0.8125rem] text-ink-soft">{sub}</span>}
      </dt>
      <dd className="tnum text-[1.0625rem] font-semibold">{value}</dd>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-[1.0625rem] font-semibold">{title}</h2>
      {subtitle && <p className="mt-0.5 mb-4 text-[0.8125rem] text-ink-soft">{subtitle}</p>}
      {children}
    </section>
  );
}
