/**
 * Dates are stored as "YYYY-MM-DD" day keys in the user's chosen timezone.
 * Every helper here takes the timezone explicitly so client and server agree.
 */

export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, "0");

function parts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const out: Record<string, number> = {};
  for (const p of fmt.formatToParts(date)) if (p.type !== "literal") out[p.type] = Number(p.value);
  return out as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

export function safeTimeZone(tz: string | null | undefined): string {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function dayKeyOf(date: Date, timeZone: string): DayKey {
  const p = parts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function parseDayKey(key: DayKey) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

/** Pure calendar arithmetic on day keys, independent of any timezone. */
export function addDays(key: DayKey, n: number): DayKey {
  const { y, m, d } = parseDayKey(key);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function diffDays(a: DayKey, b: DayKey): number {
  const pa = parseDayKey(a);
  const pb = parseDayKey(b);
  return Math.round((Date.UTC(pa.y, pa.m - 1, pa.d) - Date.UTC(pb.y, pb.m - 1, pb.d)) / 86_400_000);
}

export function weekdayOf(key: DayKey): number {
  const { y, m, d } = parseDayKey(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** A Date whose *runtime-local* calendar fields match the day key (what adhan expects). */
export function localDateForKey(key: DayKey): Date {
  const { y, m, d } = parseDayKey(key);
  return new Date(y, m - 1, d, 12);
}

function offsetMs(instant: Date, timeZone: string): number {
  const p = parts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Convert a wall-clock time ("HH:mm") on a given day in a timezone to an absolute instant. */
export function zonedTime(key: DayKey, hhmm: string, timeZone: string): Date {
  const { y, m, d } = parseDayKey(key);
  const [hh, mm] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let result = guess - offsetMs(new Date(guess), timeZone);
  const corrected = guess - offsetMs(new Date(result), timeZone);
  if (corrected !== result) result = corrected;
  return new Date(result);
}

export function formatTime(date: Date, timeZone: string, format: "auto" | "12h" | "24h" = "auto") {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    ...(format === "auto" ? {} : { hourCycle: format === "12h" ? "h12" : "h23" }),
  }).format(date);
}

export function hhmmOf(date: Date, timeZone: string) {
  const p = parts(date, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatDayLong(key: DayKey) {
  const { y, m, d } = parseDayKey(key);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function formatDayShort(key: DayKey) {
  const { y, m, d } = parseDayKey(key);
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
}

export function formatHijri(key: DayKey) {
  const { y, m, d } = parseDayKey(key);
  try {
    return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })
      .format(new Date(Date.UTC(y, m - 1, d, 12)))
      .replace(/\s?AH$/, " AH");
  } catch {
    return "";
  }
}

/** A countdown such as "1h 06m" or "14 min". */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h ${pad(m)}m` : `${m} min`;
}
