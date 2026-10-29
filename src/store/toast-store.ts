"use client";

import { create } from "zustand";

export type Toast = { id: number; message: string; action?: { label: string; run: () => void } };

type ToastState = { toast: Toast | null; show: (t: Omit<Toast, "id">) => void; dismiss: () => void };

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>((set) => ({
  toast: null,
  show(t) {
    clearTimeout(timer);
    set({ toast: { ...t, id: Date.now() } });
    timer = setTimeout(() => set({ toast: null }), 4200);
  },
  dismiss() {
    clearTimeout(timer);
    set({ toast: null });
  },
}));
