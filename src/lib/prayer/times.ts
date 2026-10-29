import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
  SunnahTimes,
} from "adhan";
import { addDays, localDateForKey, zonedTime, type DayKey } from "@/lib/date";
import type { PrayerKey } from "./constants";

export type Adjustment = { offset?: number; fixed?: string | null };
export type Adjustments = Partial<Record<PrayerKey | "SUNRISE", Adjustment>>;

export type TimeSettings = {
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  method: string;
  madhab: string;
  highLatRule: string;
  adjustments: Adjustments;
};

export type Window = { start: Date; end: Date };
export type DayTimes = Record<PrayerKey, Window> & { sunrise: Date };

function params(s: TimeSettings, coords: Coordinates) {
  const factory = CalculationMethod[s.method as keyof typeof CalculationMethod] ?? CalculationMethod.MuslimWorldLeague;
  const p = factory();
  p.madhab = s.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  p.highLatitudeRule =
    s.highLatRule === "auto" || !s.highLatRule
      ? HighLatitudeRule.recommended(coords)
      : (s.highLatRule as typeof p.highLatitudeRule);
  const a = s.adjustments ?? {};
  p.adjustments = {
    fajr: a.FAJR?.offset ?? 0,
    sunrise: a.SUNRISE?.offset ?? 0,
    dhuhr: a.DHUHR?.offset ?? 0,
    asr: a.ASR?.offset ?? 0,
    maghrib: a.MAGHRIB?.offset ?? 0,
    isha: a.ISHA?.offset ?? 0,
  };
  return p;
}

const cache = new Map<string, DayTimes>();

export function computeDay(s: TimeSettings, day: DayKey): DayTimes | null {
  if (s.latitude == null || s.longitude == null) return null;
  const cacheKey = JSON.stringify([s.latitude, s.longitude, s.timezone, s.method, s.madhab, s.highLatRule, s.adjustments, day]);
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const coords = new Coordinates(s.latitude, s.longitude);
  const p = params(s, coords);
  const today = new PrayerTimes(coords, localDateForKey(day), p);
  const yesterday = new PrayerTimes(coords, localDateForKey(addDays(day, -1)), p);
  const tomorrow = new PrayerTimes(coords, localDateForKey(addDays(day, 1)), p);

  const fixed = (key: PrayerKey, fallback: Date) => {
    const f = s.adjustments?.[key]?.fixed;
    return f ? zonedTime(day, f, s.timezone) : fallback;
  };

  const fajr = fixed("FAJR", today.fajr);
  const dhuhr = fixed("DHUHR", today.dhuhr);
  const asr = fixed("ASR", today.asr);
  const maghrib = fixed("MAGHRIB", today.maghrib);
  const isha = fixed("ISHA", today.isha);
  const nextFajr = tomorrow.fajr;

  // Tahajjud belongs to the night that ends at this day's Fajr.
  const lastThird = new SunnahTimes(yesterday).lastThirdOfTheNight;
  const tOffset = s.adjustments?.TAHAJJUD?.offset ?? 0;
  const tahajjudStart = fixed("TAHAJJUD", new Date(lastThird.getTime() + tOffset * 60_000));

  const result: DayTimes = {
    TAHAJJUD: { start: tahajjudStart, end: fajr },
    FAJR: { start: fajr, end: today.sunrise },
    DHUHR: { start: dhuhr, end: asr },
    ASR: { start: asr, end: maghrib },
    MAGHRIB: { start: maghrib, end: isha },
    ISHA: { start: isha, end: nextFajr },
    sunrise: today.sunrise,
  };
  if (cache.size > 400) cache.clear();
  cache.set(cacheKey, result);
  return result;
}

/** The prayer whose window contains `now`, and the next one to begin. */
export function currentAndNext(
  times: DayTimes,
  tomorrow: DayTimes | null,
  now: Date,
  includeTahajjud: boolean,
): { current: PrayerKey | null; next: { key: PrayerKey; at: Date; tomorrow: boolean } | null } {
  const order: PrayerKey[] = includeTahajjud
    ? ["TAHAJJUD", "FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"]
    : ["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"];
  const t = now.getTime();
  let current: PrayerKey | null = null;
  for (const k of order) {
    if (t >= times[k].start.getTime() && t < times[k].end.getTime()) current = k;
  }
  for (const k of order) {
    if (times[k].start.getTime() > t) return { current, next: { key: k, at: times[k].start, tomorrow: false } };
  }
  if (tomorrow) {
    const k = order[0];
    return { current, next: { key: k, at: tomorrow[k].start, tomorrow: true } };
  }
  return { current, next: null };
}
