import "server-only";
import { db } from "./db";
import { dayKeyOf, safeTimeZone } from "./date";
import { PRAYER_META, JUMUAH, type PrayerKey } from "./prayer/constants";
import { computeDay } from "./prayer/times";
import { pushConfigured, sendPush, type PushPayload } from "./push";
import { DEFAULT_SETTINGS, settingsSchema } from "./sync";

// A reminder is still worth sending this long after its moment, which tolerates late or sparse cron ticks.
const ADHAN_GRACE_MS = 20 * 60_000;
const FARD_ORDER: PrayerKey[] = ["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"];

type Pending = { userId: string; date: string; prayer: PrayerKey; kind: "adhan" | "nudge"; payload: PushPayload };

/** Works out which reminders are due right now and sends each one at most once. */
export async function runNotifications(now = new Date()) {
  if (!pushConfigured()) return { sent: 0, skipped: "vapid-not-configured" };

  const users = await db.user.findMany({
    where: { pushSubscriptions: { some: {} }, settings: { is: { onboarded: true } } },
    select: { id: true, settings: true, pushSubscriptions: true },
  });

  let sent = 0;
  for (const user of users) {
    const parsed = settingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...user.settings });
    if (!parsed.success) continue;
    const s = parsed.data;
    const tz = safeTimeZone(s.timezone);
    const today = dayKeyOf(now, tz);
    const times = computeDay({ ...s, timezone: tz }, today);
    if (!times) continue;

    const [day, logs] = await Promise.all([
      db.dayEntry.findUnique({ where: { userId_date: { userId: user.id, date: today } } }),
      db.prayerLog.findMany({ where: { userId: user.id, date: today }, select: { prayer: true } }),
    ]);
    if (day?.excused) continue;
    const logged = new Set(logs.map((l) => l.prayer));
    const isFriday = new Date(times.DHUHR.start).toLocaleDateString("en-US", { weekday: "short", timeZone: tz }) === "Fri";
    const label = (p: PrayerKey) => (p === "DHUHR" && isFriday ? JUMUAH.name : PRAYER_META[p].name);

    const due: Pending[] = [];
    const t = now.getTime();
    const candidates: PrayerKey[] = [...FARD_ORDER];
    if (s.tahajjudEnabled && s.notifyTahajjud) candidates.unshift("TAHAJJUD");

    for (const p of candidates) {
      const isFard = p !== "TAHAJJUD";
      if (isFard && !s.notifyPrayers.includes(p)) continue;
      const w = times[p];
      const start = w.start.getTime();

      if ((s.notifyAdhan || !isFard) && t >= start && t < Math.min(start + ADHAN_GRACE_MS, w.end.getTime()) && !logged.has(p)) {
        due.push({
          userId: user.id,
          date: today,
          prayer: p,
          kind: "adhan",
          payload: isFard
            ? { title: `${label(p)} has begun`, body: "Tap when you've prayed — it takes one second.", tag: `adhan-${today}-${p}`, url: "/today", actions: [{ action: "mark", title: "Prayed" }] }
            : { title: "The last third of the night", body: "A quiet time for Tahajjud, if you can.", tag: `adhan-${today}-${p}`, url: "/today" },
        });
      }

      const nudgeAt = start + s.nudgeAfterMin * 60_000;
      if (isFard && s.notifyNudge && t >= nudgeAt && t < w.end.getTime() && !logged.has(p)) {
        const left = Math.max(0, Math.round((w.end.getTime() - t) / 60_000));
        due.push({
          userId: user.id,
          date: today,
          prayer: p,
          kind: "nudge",
          payload: {
            title: `Did you pray ${label(p)}?`,
            body: left > 0 ? `About ${left < 60 ? `${left} min` : `${Math.round(left / 60)} h`} left in its time.` : "Its time is ending.",
            tag: `nudge-${today}-${p}`,
            url: "/today",
            actions: [{ action: "mark", title: "Yes, prayed" }],
          },
        });
      }
    }

    for (const item of due) {
      // The unique index makes this the dedupe lock: only the first tick to insert sends.
      const claimed = await db.notificationLog
        .create({ data: { userId: item.userId, date: item.date, prayer: item.prayer, kind: item.kind } })
        .then(() => true)
        .catch(() => false);
      if (!claimed) continue;
      for (const sub of user.pushSubscriptions) {
        const ok = await sendPush(sub, { ...item.payload, url: `${item.payload.url}?mark=${item.prayer}&date=${item.date}` });
        if (!ok) await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        else sent++;
      }
    }
  }

  // Keep the dedupe table small.
  await db.notificationLog.deleteMany({ where: { sentAt: { lt: new Date(now.getTime() - 3 * 86_400_000) } } });
  return { sent, users: users.length };
}
