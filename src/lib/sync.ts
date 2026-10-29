import { z } from "zod";
import { CONGREGATIONS, FARD, PRAYERS, STATUSES } from "./prayer/constants";

/** Shared contract between the offline client store and the sync API. */

const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const logDataSchema = z.object({
  status: z.enum(STATUSES),
  congregation: z.enum(CONGREGATIONS).nullable(),
  sunnahBefore: z.boolean(),
  sunnahAfter: z.boolean(),
  witr: z.boolean(),
  combined: z.boolean(),
  rakats: z.number().int().min(0).max(40).nullable(),
});
export type LogData = z.infer<typeof logDataSchema>;

export const dayDataSchema = z.object({
  excused: z.boolean(),
  travel: z.boolean(),
  note: z.string().max(2000).nullable(),
});
export type DayData = z.infer<typeof dayDataSchema>;

const adjustmentSchema = z.object({
  offset: z.number().int().min(-60).max(60).optional(),
  fixed: hhmm.nullable().optional(),
});

export const settingsSchema = z.object({
  onboarded: z.boolean(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  locationName: z.string().max(120).nullable(),
  countryCode: z.string().max(4).nullable(),
  timezone: z.string().max(64),
  method: z.string().max(40),
  madhab: z.enum(["shafi", "hanafi"]),
  highLatRule: z.string().max(40),
  adjustments: z.partialRecord(z.enum([...PRAYERS, "SUNRISE"]), adjustmentSchema),
  tahajjudEnabled: z.boolean(),
  qadaBaseline: z.partialRecord(z.enum(FARD), z.number().int().min(0).max(1_000_000)),
  notifyAdhan: z.boolean(),
  notifyNudge: z.boolean(),
  nudgeAfterMin: z.number().int().min(5).max(180),
  notifyTahajjud: z.boolean(),
  notifyPrayers: z.array(z.enum(PRAYERS)),
  timeFormat: z.enum(["auto", "12h", "24h"]),
});
export type SettingsData = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: SettingsData = {
  onboarded: false,
  latitude: null,
  longitude: null,
  locationName: null,
  countryCode: null,
  timezone: "UTC",
  method: "MuslimWorldLeague",
  madhab: "shafi",
  highLatRule: "auto",
  adjustments: {},
  tahajjudEnabled: true,
  qadaBaseline: {},
  notifyAdhan: true,
  notifyNudge: true,
  nudgeAfterMin: 30,
  notifyTahajjud: false,
  notifyPrayers: ["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"],
  timeFormat: "auto",
};

export const opSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("log"), date: dayKey, prayer: z.enum(PRAYERS), data: logDataSchema.nullable(), at: z.number() }),
  z.object({ kind: z.literal("day"), date: dayKey, data: dayDataSchema, at: z.number() }),
  z.object({ kind: z.literal("qada-add"), id: z.string().min(8).max(64), prayer: z.enum(FARD), at: z.number() }),
  z.object({ kind: z.literal("qada-remove"), id: z.string().min(8).max(64), at: z.number() }),
  z.object({ kind: z.literal("settings"), data: settingsSchema.partial(), at: z.number() }),
]);
export type Op = z.infer<typeof opSchema>;

export const pushOpsSchema = z.object({ ops: z.array(opSchema).max(500) });

export type LogRecord = LogData & { date: string; prayer: (typeof PRAYERS)[number]; updatedAt: number };
export type DayRecord = DayData & { date: string; updatedAt: number };
export type QadaRecord = { id: string; prayer: (typeof FARD)[number]; createdAt: number };

export type Snapshot = {
  user: { id: string; name: string; email: string; image: string | null; createdAt: number };
  settings: SettingsData;
  logs: LogRecord[];
  days: DayRecord[];
  qada: QadaRecord[];
  serverTime: number;
};
