"use client";

import { create } from "zustand";
import { del, get, set } from "idb-keyval";
import type { FardKey, PrayerKey } from "@/lib/prayer/constants";
import {
  DEFAULT_SETTINGS,
  type DayData,
  type DayRecord,
  type LogData,
  type LogRecord,
  type Op,
  type QadaRecord,
  type SettingsData,
  type Snapshot,
} from "@/lib/sync";

const LAST_USER_KEY = "deen:last-user";
const storeKey = (userId: string) => `deen:data:${userId}`;

export const logKey = (date: string, prayer: PrayerKey) => `${date}|${prayer}`;

type Persisted = {
  user: Snapshot["user"];
  settings: SettingsData;
  logs: Record<string, LogRecord>;
  days: Record<string, DayRecord>;
  qada: QadaRecord[];
  outbox: Op[];
};

export type SyncState = "idle" | "syncing" | "offline" | "error";

type State = Omit<Persisted, "user"> & {
  user: Snapshot["user"] | null;
  ready: boolean;
  syncState: SyncState;
  lastSyncedAt: number | null;

  init: () => Promise<void>;
  refresh: () => Promise<void>;
  flush: () => Promise<void>;
  setLog: (date: string, prayer: PrayerKey, data: LogData | null) => void;
  setDay: (date: string, patch: Partial<DayData>) => void;
  addQada: (prayer: FardKey) => void;
  undoQada: (prayer: FardKey) => void;
  updateSettings: (patch: Partial<SettingsData>) => void;
  clearLocal: () => Promise<void>;
};

const EMPTY_DAY: DayData = { excused: false, travel: false, note: null };

function applyLocal(state: Pick<State, "logs" | "days" | "qada" | "settings">, op: Op) {
  switch (op.kind) {
    case "log": {
      const logs = { ...state.logs };
      const key = logKey(op.date, op.prayer);
      if (op.data) logs[key] = { ...op.data, date: op.date, prayer: op.prayer, updatedAt: op.at };
      else delete logs[key];
      return { logs };
    }
    case "day": {
      return { days: { ...state.days, [op.date]: { ...op.data, date: op.date, updatedAt: op.at } } };
    }
    case "qada-add":
      return state.qada.some((q) => q.id === op.id)
        ? {}
        : { qada: [...state.qada, { id: op.id, prayer: op.prayer, createdAt: op.at }] };
    case "qada-remove":
      return { qada: state.qada.filter((q) => q.id !== op.id) };
    case "settings":
      return { settings: { ...state.settings, ...op.data } };
  }
}

/** Collapse repeated edits to the same record so a long offline session syncs as a small batch. */
function coalesce(ops: Op[]): Op[] {
  const out: Op[] = [];
  const lastIndex = new Map<string, number>();
  for (const op of ops) {
    const key =
      op.kind === "log" ? `log:${op.date}|${op.prayer}` : op.kind === "day" ? `day:${op.date}` : op.kind === "settings" ? "settings" : null;
    if (key && lastIndex.has(key)) {
      const i = lastIndex.get(key)!;
      const prev = out[i];
      out[i] =
        op.kind === "settings" && prev.kind === "settings" ? { ...op, data: { ...prev.data, ...op.data } } : op;
    } else {
      if (key) lastIndex.set(key, out.length);
      out.push(op);
    }
  }
  return out;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let retryDelay = 2_000;
let flushing: Promise<void> | null = null;

function readLastUser() {
  try {
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}

function writeLastUser(id: string | null) {
  try {
    if (id) localStorage.setItem(LAST_USER_KEY, id);
    else localStorage.removeItem(LAST_USER_KEY);
  } catch {}
}

async function handleUnauthorized() {
  writeLastUser(null);
  await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
  window.location.replace("/sign-in?expired=1");
}

export const useApp = create<State>((setState, getState) => {
  const persist = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const s = getState();
      if (!s.user) return;
      const data: Persisted = { user: s.user, settings: s.settings, logs: s.logs, days: s.days, qada: s.qada, outbox: s.outbox };
      set(storeKey(s.user.id), data).catch(() => {});
    }, 150);
  };

  const scheduleFlush = (delay = 400) => {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(() => void getState().flush(), delay);
  };

  const enqueue = (op: Op) => {
    setState((s) => ({ ...applyLocal(s, op), outbox: [...s.outbox, op] }));
    persist();
    scheduleFlush();
  };

  return {
    user: null,
    settings: DEFAULT_SETTINGS,
    logs: {},
    days: {},
    qada: [],
    outbox: [],
    ready: false,
    syncState: "idle",
    lastSyncedAt: null,

    async init() {
      const last = readLastUser();
      if (last) {
        const cached = await get<Persisted>(storeKey(last)).catch(() => undefined);
        if (cached) setState({ ...cached, ready: true });
      }
      await getState().refresh();
    },

    async refresh() {
      let res: Response;
      try {
        res = await fetch("/api/sync", { cache: "no-store" });
      } catch {
        setState({ syncState: "offline", ready: true });
        return;
      }
      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) {
        setState({ syncState: "error", ready: true });
        return;
      }
      const snap = (await res.json()) as Snapshot;
      const current = getState();
      const outbox = current.user?.id === snap.user.id ? current.outbox : [];

      let next: Pick<State, "logs" | "days" | "qada" | "settings"> = {
        settings: snap.settings,
        logs: Object.fromEntries(snap.logs.map((l) => [logKey(l.date, l.prayer), l])),
        days: Object.fromEntries(snap.days.map((d) => [d.date, d])),
        qada: snap.qada,
      };
      // Pending local edits win over what the server had.
      for (const op of outbox) next = { ...next, ...applyLocal(next, op) };

      writeLastUser(snap.user.id);
      setState({ ...next, user: snap.user, outbox, ready: true, lastSyncedAt: Date.now(), syncState: "idle" });
      persist();
      if (outbox.length) scheduleFlush(0);
    },

    flush() {
      if (flushing) return flushing;
      flushing = (async () => {
        try {
          while (getState().outbox.length) {
            const batch = getState().outbox;
            setState({ syncState: "syncing" });
            let res: Response;
            try {
              res = await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ops: coalesce(batch).slice(0, 500) }),
              });
            } catch {
              setState({ syncState: "offline" });
              scheduleFlush((retryDelay = Math.min(retryDelay * 2, 60_000)));
              return;
            }
            if (res.status === 401) return handleUnauthorized();
            if (!res.ok) {
              setState({ syncState: "error" });
              // A malformed op would block the queue forever; drop the batch after a client error.
              if (res.status === 400) setState((s) => ({ outbox: s.outbox.slice(batch.length) }));
              else scheduleFlush((retryDelay = Math.min(retryDelay * 2, 60_000)));
              persist();
              return;
            }
            retryDelay = 2_000;
            setState((s) => ({ outbox: s.outbox.slice(batch.length), lastSyncedAt: Date.now() }));
            persist();
          }
          setState({ syncState: "idle" });
        } finally {
          flushing = null;
        }
      })();
      return flushing;
    },

    setLog(date, prayer, data) {
      enqueue({ kind: "log", date, prayer, data, at: Date.now() });
    },

    setDay(date, patch) {
      const existing = getState().days[date];
      const base: DayData = existing ? { excused: existing.excused, travel: existing.travel, note: existing.note } : EMPTY_DAY;
      enqueue({ kind: "day", date, data: { ...base, ...patch }, at: Date.now() });
    },

    addQada(prayer) {
      enqueue({ kind: "qada-add", id: uid(), prayer, at: Date.now() });
    },

    undoQada(prayer) {
      const latest = [...getState().qada].reverse().find((q) => q.prayer === prayer);
      if (latest) enqueue({ kind: "qada-remove", id: latest.id, at: Date.now() });
    },

    updateSettings(patch) {
      enqueue({ kind: "settings", data: patch, at: Date.now() });
    },

    async clearLocal() {
      const id = getState().user?.id ?? readLastUser();
      if (id) await del(storeKey(id)).catch(() => {});
      writeLastUser(null);
      setState({ user: null, settings: DEFAULT_SETTINGS, logs: {}, days: {}, qada: [], outbox: [], ready: false });
    },
  };
});

export function emptyLog(): LogData {
  return { status: "ON_TIME", congregation: null, sunnahBefore: false, sunnahAfter: false, witr: false, combined: false, rakats: null };
}
