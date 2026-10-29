import { dayKeyOf, hhmmOf, type DayKey } from "@/lib/date";
import type { DayTimes } from "@/lib/prayer/times";

/** A colour stop of the sky: minute of the day, then the top, middle and bottom of the gradient. */
export type SkyKey = [minute: number, top: string, mid: string, bottom: string];
/** Everything needed to paint the sky for one day. Sunrise and sunset place the sun and moon. */
export type SkyFrame = { keys: SkyKey[]; sunrise: number; sunset: number };

export const SKY_STORAGE_KEY = "deen:sky";

// Night, pre-dawn, dawn, sunrise, morning, noon, afternoon, golden hour, sunset, dusk, night, night.
const PALETTE: [string, string, string][] = [
  ["#070a1c", "#0f1430", "#1a1d3e"],
  ["#0b1030", "#1c2150", "#2d2a5a"],
  ["#27306a", "#7a6aa0", "#e8a98c"],
  ["#6f9fd6", "#f0c6a4", "#fbe2c4"],
  ["#5d9be0", "#a8d0f0", "#e6f2fa"],
  ["#4f95e2", "#9fcdf2", "#eef6fb"],
  ["#79a3d2", "#e6cfa6", "#f7e6cb"],
  ["#5a5f9a", "#e09a78", "#f6c48f"],
  ["#2e2e66", "#a8577e", "#f08a68"],
  ["#151a40", "#3b2d63", "#6b3f6e"],
  ["#0b0f2a", "#171c42", "#2a2650"],
  ["#070a1c", "#0f1430", "#1a1d3e"],
];

const keysAt = (minutes: number[]): SkyKey[] => minutes.map((m, i) => [m, ...PALETTE[i]]);

/** A typical autumn day, used before the real prayer times are known. */
export const DEFAULT_FRAME: SkyFrame = {
  keys: keysAt([0, 280, 330, 394, 520, 728, 921, 1030, 1064, 1110, 1142, 1440]),
  sunrise: 394,
  sunset: 1064,
};

const minuteOf = (date: Date, timeZone: string) => {
  const [h, m] = hhmmOf(date, timeZone).split(":").map(Number);
  return h * 60 + m;
};

export function minuteNow(now: Date, timeZone: string) {
  return minuteOf(now, timeZone);
}

/** Pin the sky's colour stops to the day's real prayer and sun times. */
export function skyFrame(times: DayTimes, day: DayKey, timeZone: string): SkyFrame {
  // Times that fall after midnight (Isha in a northern summer) stay at the end of the day.
  const at = (d: Date) => (dayKeyOf(d, timeZone) > day ? 1439 : minuteOf(d, timeZone));
  const fajr = at(times.FAJR.start);
  const sunrise = at(times.sunrise);
  const dhuhr = at(times.DHUHR.start);
  const asr = at(times.ASR.start);
  const maghrib = at(times.MAGHRIB.start);
  const isha = at(times.ISHA.start);
  const raw = [
    0,
    fajr - 32,
    fajr + (sunrise - fajr) * 0.22,
    sunrise,
    sunrise + (dhuhr - sunrise) * 0.377,
    dhuhr,
    asr,
    asr + (maghrib - asr) * 0.762,
    maghrib,
    maghrib + (isha - maghrib) * 0.59,
    isha,
    1440,
  ];
  // Keep the stops in order even when the sun does unusual things at high latitudes.
  const minutes = raw.map(Math.round);
  for (let i = 1; i < minutes.length - 1; i++) minutes[i] = Math.min(1439 - (minutes.length - 2 - i), Math.max(minutes[i - 1] + 1, minutes[i]));
  return { keys: keysAt(minutes), sunrise, sunset: maghrib };
}

/**
 * Paint the sky onto `root` as CSS variables: the gradient, and an ink colour for the top of the
 * screen, the list at the bottom and plain pages, each with the lightest veil that keeps text readable
 * (4.5:1 for text, 3:1 for soft text). Self-contained so it can also run as an inline script before
 * the first paint.
 */
export function paintSky(root: HTMLElement, minute: number, frame: SkyFrame) {
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a: number[], b: number[], f: number) => a.map((v, i) => v + (b[i] - v) * f);
  const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = (c: number[]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const contrast = (a: number[], b: number[]) => {
    const x = lum(a);
    const y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const rgb = (c: number[], a = 1) => `rgb(${c.map(Math.round).join(" ")} / ${a})`;

  const keys = frame.keys;
  const m = ((minute % 1440) + 1440) % 1440;
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1][0] <= m) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const f = b[0] > a[0] ? Math.min(1, Math.max(0, (m - a[0]) / (b[0] - a[0]))) : 0;
  const sky = [1, 2, 3].map((j) => mix(hex(a[j] as string), hex(b[j] as string), f));
  const at = (p: number) => (p <= 0.58 ? mix(sky[0], sky[1], p / 0.58) : mix(sky[1], sky[2], (p - 0.58) / 0.42));

  const DARK = [14, 20, 38];
  const LIGHT = [238, 240, 250];
  const WHITE = [255, 255, 255];
  const NIGHT = [7, 10, 28];
  const zone = (ps: number[], maxVeil: number) => {
    const bgs = ps.map(at);
    let best: { ink: number[]; veil: number[]; v: number; full: number } | null = null;
    for (let v = 0; v <= maxVeil + 0.001; v += 0.02) {
      for (const [ink, veil] of [
        [DARK, WHITE],
        [LIGHT, NIGHT],
      ]) {
        const under = bgs.map((c) => mix(c, veil, v));
        const full = Math.min(...under.map((c) => contrast(ink, c)));
        const soft = Math.min(...under.map((c) => contrast(mix(c, ink, 0.72), c)));
        if (full >= 4.5 && soft >= 3) return { ink, veil, v, full };
        if (!best || full > best.full) best = { ink, veil, v, full };
      }
    }
    return best!;
  };

  const set = (k: string, v: string) => root.style.setProperty(k, v);
  sky.forEach((c, j) => set(`--s${j + 1}`, rgb(c)));
  const top = zone([0.08, 0.15, 0.22, 0.3, 0.36], 0.3);
  const list = zone([0.5, 0.6, 0.7, 0.8, 0.88, 0.95], 0.3);
  const page = zone([0.02, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 0.96], 0.62);
  for (const [z, c] of [
    ["t", top],
    ["l", list],
    ["p", page],
  ] as const) {
    const dark = c.ink === LIGHT;
    set(`--${z}-ink`, rgb(c.ink));
    set(`--${z}-soft`, rgb(c.ink, 0.72));
    set(`--${z}-line`, rgb(c.ink, dark ? 0.16 : 0.13));
    set(`--${z}-btn`, rgb(dark ? DARK : [244, 246, 251]));
    set(`--${z}-veil`, rgb(c.veil, Math.round(c.v * 100) / 100));
  }
  root.dataset.mode = page.ink === LIGHT ? "dark" : "light";

  // Stars come out once the top of the sky is dark enough.
  const glow = (0.299 * sky[0][0] + 0.587 * sky[0][1] + 0.114 * sky[0][2]) / 255;
  set("--stars", String(top.ink === LIGHT ? Math.round(Math.max(0, Math.min(1, (0.55 - glow) * 2.4)) * 100) / 100 : 0));

  // The sun crosses the empty band in the middle of the screen by day, the moon by night.
  const rise = frame.sunrise - 10;
  const down = frame.sunset + 8;
  const day = m >= rise && m < down;
  const p = day ? (m - rise) / (down - rise) : ((m - down + 1440) % 1440) / (1440 - (down - rise));
  root.dataset.orb = day ? "sun" : "moon";
  set("--orb-x", `${(14 + p * 72).toFixed(2)}%`);
  set("--orb-y", `${(40 - Math.sin(Math.PI * p) * 3).toFixed(2)}%`);

  // Let the browser chrome match the top of the sky.
  const toHex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = toHex(sky[0]);
}

/** Runs during HTML parsing, before the first paint, with the last sky this device saw. */
export const skyBootScript = `(function(){try{var f=null;try{f=JSON.parse(localStorage.getItem(${JSON.stringify(SKY_STORAGE_KEY)}))}catch(e){}if(!f||!f.keys)f=${JSON.stringify(DEFAULT_FRAME)};var d=new Date(),r=document.documentElement;if(location.pathname.indexOf("/today")===0)r.dataset.veil="zones";(${paintSky.toString()})(r,d.getHours()*60+d.getMinutes(),f)}catch(e){}})()`;
