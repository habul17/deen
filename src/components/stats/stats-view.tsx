"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Flame, Moon, Sparkles } from "lucide-react";
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
import { Segmented } from "@/components/ui/segmented";
import { Heatmap } from "./heatmap";
import { Breakdown } from "./breakdown";
import { QadaPanel } from "./qada-panel";

type Range = "week" | "month" | "quarter" | "year";
const RANGE_KEY = "deen:stats-range";
const RANGE_LABEL: Record<Range, string> = { week: "this week", month: "the last 30 days", quarter: "the last 3 months", year: "the last year" };

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
    <div className="pt-4 md:pt-0">
      <header className="mb-6">
        <h1 className="font-serif text-[34px] leading-none tracking-tight md:text-[44px]">Stats</h1>
        <p className="mt-2 text-[14px] text-muted">Consistency over perfection. Excused days never count against you.</p>
      </header>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile
            icon={<Flame className="size-4" strokeWidth={1.75} />}
            label="Current streak"
            value={days(streak.current)}
            sub={streak.current === 0 ? "Pray all five today to begin" : "All five prayed each day"}
            accent
          />
          <Tile label="Best streak" value={days(streak.best)} sub="Your longest run so far" />
          {tahajjudEnabled ? (
            <>
              <Tile
                icon={<Moon className="size-4" strokeWidth={1.75} />}
                label="Tahajjud streak"
                value={`${night.current} ${night.current === 1 ? "night" : "nights"}`}
                sub={`Best ${night.best}`}
              />
              <Tile label="Tahajjud, all time" value={String(allTime.tahajjud.nights)} sub="Nights you stood" />
            </>
          ) : (
            <>
              <Tile label="Days tracked" value={String(daysBetween(first, today))} sub="Since you began" />
              <Tile label="All-five days" value={String(allTime.completeDays)} sub="All time" />
            </>
          )}
        </div>

        <Card title="Consistency" subtitle="Each square is a day, shaded by prayers kept.">
          <Heatmap ledger={ledger} ctx={ctx} first={first} />
        </Card>

        <div className="pt-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[17px] font-medium tracking-tight">Breakdown</h2>
              <p className="text-[13px] text-muted">
                {RANGE_LABEL[range][0].toUpperCase() + RANGE_LABEL[range].slice(1)} · {days(scoredDays)}
                {summary.excusedDays > 0 && ` (${summary.excusedDays} excused)`}
              </p>
            </div>
            <div className="sm:w-[340px]">
              <Segmented<Range>
                label="Period"
                size="sm"
                value={range}
                onChange={pick}
                options={[
                  { value: "week", label: "Week" },
                  { value: "month", label: "Month" },
                  { value: "quarter", label: "3 months" },
                  { value: "year", label: "Year" },
                ]}
              />
            </div>
          </div>

          <motion.div key={range} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile label="Prayed" value={pct(ratio(summary.prayed, summary.expected))} sub={`${summary.prayed} of ${summary.expected} prayers`} />
              <Tile label="On time" value={pct(ratio(summary.onTime, summary.prayed))} sub="Of prayers prayed" />
              <Tile label="In congregation" value={pct(ratio(summary.congregation, summary.prayed))} sub="Jamāʿah or masjid" />
              <Tile label="With sunnah" value={pct(ratio(summary.sunnah, summary.prayed))} sub="Rawātib before or after" />
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-[14px] text-ink-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
              <p>{insight(summary)}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <Card title="By prayer" subtitle="How each prayer was kept.">
                <Breakdown summary={summary} />
              </Card>
              {tahajjudEnabled && (
                <Card title="Night prayer" subtitle="Tahajjud is voluntary and tracked on its own.">
                  <dl className="grid grid-cols-2 gap-4">
                    <Figure label="Nights" value={String(summary.tahajjud.nights)} />
                    <Figure
                      label="Avg. rakʿāt"
                      value={summary.tahajjud.nights ? (summary.tahajjud.rakats / summary.tahajjud.nights).toFixed(1).replace(/\.0$/, "") : "—"}
                    />
                    <Figure label="Of nights" value={pct(ratio(summary.tahajjud.nights, span))} />
                    <Figure label="Total rakʿāt" value={String(summary.tahajjud.rakats)} />
                  </dl>
                </Card>
              )}
            </div>
          </motion.div>
        </div>

        <div className="pt-4">
          <QadaPanel ledger={ledger} />
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, sub, icon, accent }: { label: string; value: string; sub?: string; icon?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-[22px] border border-line bg-surface px-4 py-4 sm:px-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={accent ? "flex items-center gap-1.5 text-[13px] text-accent" : "flex items-center gap-1.5 text-[13px] text-muted"}>
        {icon}
        {label}
      </div>
      <div className="mt-2 text-[28px] leading-none font-semibold tracking-tight sm:text-[32px]">{value}</div>
      {sub && <div className="mt-2 text-[12px] leading-snug text-muted">{sub}</div>}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1 text-[24px] leading-none font-semibold tracking-tight">{value}</dd>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-line bg-surface p-5 sm:p-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <h2 className="text-[17px] font-medium tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 mb-5 text-[13px] text-muted">{subtitle}</p>}
      {children}
    </section>
  );
}
