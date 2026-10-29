export const PRAYERS = ["TAHAJJUD", "FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"] as const;
export type PrayerKey = (typeof PRAYERS)[number];

export const FARD = ["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"] as const;
export type FardKey = (typeof FARD)[number];

export const STATUSES = ["ON_TIME", "LATE", "QADA", "MISSED"] as const;
export type Status = (typeof STATUSES)[number];

export const CONGREGATIONS = ["ALONE", "JAMAAH", "MASJID"] as const;
export type CongregationKey = (typeof CONGREGATIONS)[number];

export const PRAYER_META: Record<
  PrayerKey,
  { name: string; arabic: string; sunnahBefore?: string; sunnahAfter?: string; shortenable?: boolean }
> = {
  TAHAJJUD: { name: "Tahajjud", arabic: "التهجد" },
  FAJR: { name: "Fajr", arabic: "الفجر", sunnahBefore: "2 rakʿāt before" },
  DHUHR: {
    name: "Dhuhr",
    arabic: "الظهر",
    sunnahBefore: "4 rakʿāt before",
    sunnahAfter: "2 rakʿāt after",
    shortenable: true,
  },
  ASR: { name: "Asr", arabic: "العصر", sunnahBefore: "4 rakʿāt before", shortenable: true },
  MAGHRIB: { name: "Maghrib", arabic: "المغرب", sunnahAfter: "2 rakʿāt after" },
  ISHA: { name: "Isha", arabic: "العشاء", sunnahAfter: "2 rakʿāt after", shortenable: true },
};

export const JUMUAH = { name: "Jumuʿah", arabic: "الجمعة" };

export const STATUS_LABEL: Record<Status, string> = {
  ON_TIME: "On time",
  LATE: "Late",
  QADA: "Made up",
  MISSED: "Missed",
};

export const CONGREGATION_LABEL: Record<CongregationKey, string> = {
  ALONE: "Alone",
  JAMAAH: "Jamāʿah",
  MASJID: "Masjid",
};

export const isPrayed = (s: Status | undefined) => s === "ON_TIME" || s === "LATE" || s === "QADA";

export const METHODS = [
  { id: "MuslimWorldLeague", label: "Muslim World League" },
  { id: "NorthAmerica", label: "ISNA (North America)" },
  { id: "Egyptian", label: "Egyptian General Authority" },
  { id: "Karachi", label: "University of Islamic Sciences, Karachi" },
  { id: "UmmAlQura", label: "Umm al-Qura, Makkah" },
  { id: "Dubai", label: "Dubai" },
  { id: "Qatar", label: "Qatar" },
  { id: "Kuwait", label: "Kuwait" },
  { id: "MoonsightingCommittee", label: "Moonsighting Committee" },
  { id: "Singapore", label: "Singapore, Malaysia, Indonesia" },
  { id: "Turkey", label: "Diyanet, Turkey" },
  { id: "Tehran", label: "Institute of Geophysics, Tehran" },
] as const;
export type MethodId = (typeof METHODS)[number]["id"];

export const HIGH_LAT_RULES = [
  { id: "auto", label: "Automatic" },
  { id: "middleofthenight", label: "Middle of the night" },
  { id: "seventhofthenight", label: "One-seventh of the night" },
  { id: "twilightangle", label: "Twilight angle" },
] as const;

const HANAFI_REGIONS = ["PK", "IN", "BD", "AF", "TR", "UZ", "TJ", "KZ", "KG", "TM", "AZ"];

/** Sensible defaults for a country, so most people never touch these settings. */
export function suggestCalculation(countryCode?: string | null): { method: MethodId; madhab: "shafi" | "hanafi" } {
  const cc = (countryCode ?? "").toUpperCase();
  const madhab = HANAFI_REGIONS.includes(cc) ? "hanafi" : "shafi";
  const byCountry: Record<string, MethodId> = {
    US: "NorthAmerica",
    CA: "NorthAmerica",
    GB: "MoonsightingCommittee",
    IE: "MoonsightingCommittee",
    PK: "Karachi",
    IN: "Karachi",
    BD: "Karachi",
    AF: "Karachi",
    SA: "UmmAlQura",
    YE: "UmmAlQura",
    EG: "Egyptian",
    SD: "Egyptian",
    LY: "Egyptian",
    DZ: "Egyptian",
    IQ: "Egyptian",
    SY: "Egyptian",
    LB: "Egyptian",
    JO: "Egyptian",
    AE: "Dubai",
    OM: "Dubai",
    BH: "Dubai",
    QA: "Qatar",
    KW: "Kuwait",
    SG: "Singapore",
    MY: "Singapore",
    ID: "Singapore",
    BN: "Singapore",
    TR: "Turkey",
    IR: "Tehran",
  };
  return { method: byCountry[cc] ?? "MuslimWorldLeague", madhab };
}
