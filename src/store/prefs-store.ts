"use client";

import { create } from "zustand";

/** Preferences that belong to this device rather than the account. */
type Prefs = { arabicNames: boolean; holdHintSeen: boolean };

type PrefsState = Prefs & { loaded: boolean; load: () => void; set: (p: Partial<Prefs>) => void };

const KEY = "deen:prefs";
const DEFAULTS: Prefs = { arabicNames: false, holdHintSeen: false };

export const usePrefs = create<PrefsState>((setState, getState) => ({
  ...DEFAULTS,
  loaded: false,
  load() {
    if (getState().loaded) return;
    let saved: Partial<Prefs> = {};
    try {
      saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") ?? {};
    } catch {}
    setState({ ...DEFAULTS, ...saved, loaded: true });
  },
  set(p) {
    setState(p);
    const { arabicNames, holdHintSeen } = getState();
    try {
      localStorage.setItem(KEY, JSON.stringify({ arabicNames, holdHintSeen }));
    } catch {}
  },
}));
