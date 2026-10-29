import { addDays, diffDays, type DayKey } from "@/lib/date";
import type { DayRecord, LogRecord, QadaRecord, SettingsData } from "@/lib/sync";
import { FARD, PRAYER_META, isPrayed, type FardKey, type PrayerKey, type Status } from "./constants";

/**
 * Pure aggregations over the local store. Unlogged past prayers are "not marked",
 * never assumed missed; excused days are skipped entirely and never break a streak.
 */

export type Ledger = {
  logs: Record<string, LogRecord>;
  days: Record<string, DayRecord>;
};

/** Which fard prayers have begun today, so a half-finished day isn't scored as incomplete. */
export type TodayContext = { today: DayKey; due: readonly FardKey[] };

const log = (l: Ledger, date: DayKey, p: PrayerKey) => l.logs[`${date}|${p}`];
const excused = (l: Ledger, date: DayKey) => l.days[date]?.excused ?? false;

export function dueOn(date: DayKey, ctx: TodayContext): readonly FardKey[] {
  if (date > ctx.today) return [];
  return date === ctx.today ? ctx.due : FARD;
}

export function prayedCount(l: Ledger, date: DayKey) {
  return FARD.filter((p) => isPrayed(log(l, date, p)?.status)).length;
}

/** The first day worth scoring: account creation or the earliest backfilled entry. */
export function firstTrackedDay(l: Ledger, createdDay: DayKey): DayKey {
  let first = createdDay;
  for (const r of Object.values(l.logs)) if (r.date < first) first = r.date;
  for (const r of Object.values(l.days)) if (r.date < first) first = r.date;
  return first;
}

type DayState = "complete" | "excused" | "pending" | "broken";

function dayState(l: Ledger, date: DayKey, ctx: TodayContext, isDone: (l: Ledger, d: DayKey) => boolean): DayState {
  if (excused(l, date)) return "excused";
  if (isDone(l, date)) return "complete";
  return date === ctx.today ? "pending" : "broken";
}

const allFive = (l: Ledger, d: DayKey) => prayedCount(l, d) === 5;
const prayedTahajjud = (l: Ledger, d: DayKey) => isPrayed(log(l, d, "TAHAJJUD")?.status);

function streaks(l: Ledger, ctx: TodayContext, start: DayKey, isDone: (l: Ledger, d: DayKey) => boolean) {
  let current = 0;
  for (let d = ctx.today; d >= start; d = addDays(d, -1)) {
    const s = dayState(l, d, ctx, isDone);
    if (s === "broken") break;
    if (s === "complete") current++;
  }
  let best = 0;
  let run = 0;
  for (let d = start; d <= ctx.today; d = addDays(d, 1)) {
    const s = dayState(l, d, ctx, isDone);
    if (s === "complete") best = Math.max(best, ++run);
    else if (s === "broken") run = 0;
  }
  return { current, best: Math.max(best, current) };
}

export const prayerStreaks = (l: Ledger, ctx: TodayContext, start: DayKey) => streaks(l, ctx, start, allFive);
export const tahajjudStreaks = (l: Ledger, ctx: TodayContext, start: DayKey) => streaks(l, ctx, start, prayedTahajjud);

export type Outcome = Status | "UNMARKED";
export const OUTCOMES: Outcome[] = ["ON_TIME", "LATE", "QADA", "MISSED", "UNMARKED"];

export type RangeSummary = {
  days: number;
  excusedDays: number;
  expected: number;
  prayed: number;
  onTime: number;
  congregation: number;
  sunnah: number;
  completeDays: number;
  perPrayer: Record<FardKey, Record<Outcome, number>>;
  tahajjud: { nights: number; rakats: number };
};

export function summarize(l: Ledger, ctx: TodayContext, from: DayKey, to: DayKey = ctx.today): RangeSummary {
  const perPrayer = Object.fromEntries(
    FARD.map((p) => [p, { ON_TIME: 0, LATE: 0, QADA: 0, MISSED: 0, UNMARKED: 0 }]),
  ) as RangeSummary["perPrayer"];
  const out: RangeSummary = {
    days: 0,
    excusedDays: 0,
    expected: 0,
    prayed: 0,
    onTime: 0,
    congregation: 0,
    sunnah: 0,
    completeDays: 0,
    perPrayer,
    tahajjud: { nights: 0, rakats: 0 },
  };

  for (let d = from; d <= to; d = addDays(d, 1)) {
    out.days++;
    const t = log(l, d, "TAHAJJUD");
    if (t && isPrayed(t.status)) {
      out.tahajjud.nights++;
      out.tahajjud.rakats += t.rakats ?? 0;
    }
    if (excused(l, d)) {
      out.excusedDays++;
      continue;
    }
    const due = dueOn(d, ctx);
    let dayPrayed = 0;
    for (const p of due) {
      const r = log(l, d, p);
      out.expected++;
      perPrayer[p][r?.status ?? "UNMARKED"]++;
      if (!r || !isPrayed(r.status)) continue;
      dayPrayed++;
      out.prayed++;
      if (r.status === "ON_TIME") out.onTime++;
      if (r.congregation === "JAMAAH" || r.congregation === "MASJID") out.congregation++;
      if (r.sunnahBefore || r.sunnahAfter) out.sunnah++;
    }
    if (due.length === 5 && dayPrayed === 5) out.completeDays++;
  }
  return out;
}

export const ratio = (n: number, d: number) => (d > 0 ? n / d : null);

export type HeatCell = { date: DayKey; level: 0 | 1 | 2 | 3 | 4 | 5; prayed: number; due: number; kind: "day" | "excused" | "future" | "untracked" };

export function heatCell(l: Ledger, ctx: TodayContext, date: DayKey, first: DayKey): HeatCell {
  if (date > ctx.today) return { date, level: 0, prayed: 0, due: 0, kind: "future" };
  const prayed = prayedCount(l, date);
  if (excused(l, date)) return { date, level: 0, prayed, due: 0, kind: "excused" };
  if (date < first && prayed === 0) return { date, level: 0, prayed, due: 0, kind: "untracked" };
  const due = dueOn(date, ctx).length;
  return { date, level: prayed as HeatCell["level"], prayed, due, kind: "day" };
}

/** Prayers still owed: the declared backlog, plus anything logged as missed, minus what's been made up. */
export function qadaOwed(l: Ledger, qada: QadaRecord[], baseline: SettingsData["qadaBaseline"]) {
  const missed = Object.fromEntries(FARD.map((p) => [p, 0])) as Record<FardKey, number>;
  for (const r of Object.values(l.logs)) {
    if (r.status === "MISSED" && r.prayer !== "TAHAJJUD" && !excused(l, r.date)) missed[r.prayer]++;
  }
  const madeUp = Object.fromEntries(FARD.map((p) => [p, 0])) as Record<FardKey, number>;
  for (const q of qada) madeUp[q.prayer]++;
  return FARD.map((p) => {
    const total = (baseline[p] ?? 0) + missed[p];
    return { prayer: p, total, madeUp: Math.min(madeUp[p], total), owed: Math.max(0, total - madeUp[p]) };
  });
}

/** One plain sentence about the period, pointing at the prayer that needs the most care. */
export function insight(s: RangeSummary): string {
  if (s.expected < 5) return "Mark a few prayers and your patterns will start to show here.";
  const done = ratio(s.prayed, s.expected) ?? 0;
  const scored = FARD.map((p) => {
    const c = s.perPrayer[p];
    const due = OUTCOMES.reduce((n, o) => n + c[o], 0);
    return { p, due, onTime: ratio(c.ON_TIME, due) ?? 0 };
  }).filter((x) => x.due >= 3);
  if (!scored.length) return "Keep marking prayers — a fuller picture appears after a few days.";
  scored.sort((a, b) => a.onTime - b.onTime);
  const weakest = scored[0];
  const strongest = scored[scored.length - 1];
  if (done >= 0.98 && weakest.onTime >= 0.9) return "Every prayer accounted for, nearly all on time. Keep it steady.";
  const pct = Math.round(weakest.onTime * 100);
  if (weakest.p === strongest.p || strongest.onTime - weakest.onTime < 0.08) {
    return `Your prayers are evenly kept — ${Math.round(done * 100)}% prayed this period.`;
  }
  return `${PRAYER_META[weakest.p].name} needs the most care — on time ${pct}% of the time. ${PRAYER_META[strongest.p].name} is your steadiest.`;
}

export function rangeStart(today: DayKey, range: "week" | "month" | "quarter" | "year", first: DayKey): DayKey {
  const back = { week: 6, month: 29, quarter: 89, year: 364 }[range];
  const start = addDays(today, -back);
  return start < first ? first : start;
}

export const daysBetween = (from: DayKey, to: DayKey) => diffDays(to, from) + 1;
