import "server-only";
import { db } from "./db";
import { DEFAULT_SETTINGS, settingsSchema, type Op, type SettingsData, type Snapshot } from "./sync";
import type { Prisma } from "@/generated/prisma/client";

type Db = typeof db;

function toSettings(row: Record<string, unknown> | null): SettingsData {
  if (!row) return DEFAULT_SETTINGS;
  const merged = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SettingsData)[]) {
    if (row[key] !== undefined) (merged as Record<string, unknown>)[key] = row[key];
  }
  const parsed = settingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export async function loadSnapshot(userId: string): Promise<Snapshot> {
  const [user, settings, logs, days, qada] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.settings.findUnique({ where: { userId } }),
    db.prayerLog.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    db.dayEntry.findMany({ where: { userId } }),
    db.qadaEntry.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt.getTime(),
    },
    settings: toSettings(settings as unknown as Record<string, unknown> | null),
    logs: logs.map((l) => ({
      date: l.date,
      prayer: l.prayer,
      status: l.status,
      congregation: l.congregation,
      sunnahBefore: l.sunnahBefore,
      sunnahAfter: l.sunnahAfter,
      witr: l.witr,
      combined: l.combined,
      rakats: l.rakats,
      updatedAt: l.clientUpdatedAt.getTime(),
    })),
    days: days.map((d) => ({
      date: d.date,
      excused: d.excused,
      travel: d.travel,
      note: d.note,
      updatedAt: d.clientUpdatedAt.getTime(),
    })),
    qada: qada.map((q) => ({ id: q.id, prayer: q.prayer as Snapshot["qada"][number]["prayer"], createdAt: q.createdAt.getTime() })),
    serverTime: Date.now(),
  };
}

/** Applies queued client operations with last-write-wins on the client timestamp. */
export async function applyOps(client: Db, userId: string, ops: Op[]) {
  for (const op of ops) {
    const at = new Date(Math.min(op.at, Date.now() + 60_000));
    switch (op.kind) {
      case "log": {
        const where = { userId_date_prayer: { userId, date: op.date, prayer: op.prayer } };
        const existing = await client.prayerLog.findUnique({ where, select: { clientUpdatedAt: true } });
        if (existing && existing.clientUpdatedAt > at) break;
        if (op.data === null) {
          if (existing) await client.prayerLog.delete({ where });
          break;
        }
        const data = { ...op.data, clientUpdatedAt: at };
        await client.prayerLog.upsert({
          where,
          create: { userId, date: op.date, prayer: op.prayer, ...data },
          update: data,
        });
        break;
      }
      case "day": {
        const where = { userId_date: { userId, date: op.date } };
        const existing = await client.dayEntry.findUnique({ where, select: { clientUpdatedAt: true } });
        if (existing && existing.clientUpdatedAt > at) break;
        const data = { ...op.data, note: op.data.note?.trim() || null, clientUpdatedAt: at };
        await client.dayEntry.upsert({ where, create: { userId, date: op.date, ...data }, update: data });
        break;
      }
      case "qada-add": {
        await client.qadaEntry.upsert({
          where: { id: op.id },
          create: { id: op.id, userId, prayer: op.prayer, createdAt: at },
          update: {},
        });
        break;
      }
      case "qada-remove": {
        await client.qadaEntry.deleteMany({ where: { id: op.id, userId } });
        break;
      }
      case "settings": {
        const data = op.data as Prisma.SettingsUncheckedUpdateInput;
        await client.settings.upsert({
          where: { userId },
          create: { ...(data as Prisma.SettingsUncheckedCreateInput), userId, clientUpdatedAt: at },
          update: { ...data, clientUpdatedAt: at },
        });
        break;
      }
    }
  }
}
