"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Minus, Plus, Undo2 } from "lucide-react";
import { FARD, PRAYER_META, type FardKey } from "@/lib/prayer/constants";
import { qadaOwed, type Ledger } from "@/lib/prayer/stats";
import { useApp } from "@/store/app-store";
import { useToast } from "@/store/toast-store";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const fmt = (n: number) => new Intl.NumberFormat().format(n);

/** Prayers owed and the steady work of making them up. */
export function QadaPanel({ ledger }: { ledger: Ledger }) {
  const qada = useApp((s) => s.qada);
  const baseline = useApp((s) => s.settings.qadaBaseline);
  const addQada = useApp((s) => s.addQada);
  const undoQada = useApp((s) => s.undoQada);
  const toast = useToast((s) => s.show);
  const [editing, setEditing] = useState(false);

  const rows = qadaOwed(ledger, qada, baseline);
  const owed = rows.reduce((n, r) => n + r.owed, 0);
  const total = rows.reduce((n, r) => n + r.total, 0);
  const madeUp = rows.reduce((n, r) => n + r.madeUp, 0);
  const progress = total > 0 ? madeUp / total : 0;

  const makeUp = (p: FardKey) => {
    addQada(p);
    if ("vibrate" in navigator) navigator.vibrate?.(8);
    toast({ message: `${PRAYER_META[p].name} made up`, action: { label: "Undo", run: () => undoQada(p) } });
  };

  return (
    <Card
      className="mt-4"
      title={
        <>
          Qaḍāʾ <span className="font-arabic text-[0.875rem] font-normal text-ink-soft">قضاء</span>
        </>
      }
      hint="From your backlog and anything marked missed"
      action={
        <button
          onClick={() => setEditing(true)}
          className="-mr-1 shrink-0 rounded-full px-2.5 py-1 text-[0.75rem] font-semibold text-ink-soft transition-colors hover:bg-fill hover:text-ink"
        >
          {total > 0 ? "Edit backlog" : "Set backlog"}
        </button>
      }
    >
      {total === 0 ? (
        <p className="text-[0.875rem] leading-relaxed text-ink-soft">
          Nothing owed. If you have years of prayers to make up, set your backlog and chip away at it one prayer at a time.
        </p>
      ) : (
        <>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="display tnum text-[2.75rem] leading-[0.9] font-semibold">{fmt(owed)}</div>
              <div className="mt-1.5 text-[0.75rem] text-ink-soft">{owed === 1 ? "prayer" : "prayers"} remaining</div>
            </div>
            <div className="text-right text-[0.75rem] text-ink-soft">
              <span className="font-semibold text-ink">{fmt(madeUp)}</span> of {fmt(total)} made up
            </div>
          </div>
          <div
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-fill-strong"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Qadaa progress"
          >
            <motion.div
              className="h-full rounded-full bg-ink"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <ul className="mt-5 divide-y divide-line border-t border-line">
            {rows.map((r) => (
              <li key={r.prayer} className="flex items-center gap-2 py-2">
                <span className="w-[4.5rem] text-[0.875rem] font-medium">{PRAYER_META[r.prayer].name}</span>
                <span className="flex-1 text-[0.8125rem] text-ink-soft">
                  <motion.span
                    key={r.owed}
                    initial={{ opacity: 0.4, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block font-medium text-ink tnum"
                  >
                    {fmt(r.owed)}
                  </motion.span>{" "}
                  left
                </span>
                <button
                  onClick={() => undoQada(r.prayer)}
                  disabled={r.madeUp === 0}
                  aria-label={`Undo last made-up ${PRAYER_META[r.prayer].name}`}
                  className="press grid size-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-fill hover:text-ink disabled:invisible"
                >
                  <Undo2 className="size-3.5" strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => makeUp(r.prayer)}
                  disabled={r.owed === 0}
                  aria-label={`Mark one ${PRAYER_META[r.prayer].name} made up`}
                  className="press inline-flex h-8 items-center gap-1 rounded-full bg-fill px-3 text-[0.75rem] font-semibold transition-colors hover:bg-fill-strong disabled:opacity-40"
                >
                  <Check className="size-3.5" strokeWidth={2.25} />
                  Made up
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <BacklogSheet open={editing} onClose={() => setEditing(false)} />
    </Card>
  );
}

function BacklogSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Qaḍāʾ backlog"
      description="Prayers owed from before you started tracking. Missed prayers you log here are added on top automatically."
    >
      {open && <BacklogBody onClose={onClose} />}
    </Sheet>
  );
}

function BacklogBody({ onClose }: { onClose: () => void }) {
  const baseline = useApp((s) => s.settings.qadaBaseline);
  const update = useApp((s) => s.updateSettings);
  const [draft, setDraft] = useState<Record<FardKey, number>>(
    () => Object.fromEntries(FARD.map((p) => [p, baseline[p] ?? 0])) as Record<FardKey, number>,
  );
  const [years, setYears] = useState("");

  const applyYears = () => {
    const y = Number(years);
    if (!Number.isFinite(y) || y <= 0) return;
    // A lunar year has about 354 days.
    const n = Math.round(y * 354);
    setDraft(Object.fromEntries(FARD.map((p) => [p, n])) as Record<FardKey, number>);
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="qada-years" className="text-[0.875rem] font-semibold">
          Estimate from years
        </label>
        <p className="mt-0.5 text-[0.8125rem] text-ink-soft">Roughly how many years of prayers were missed?</p>
        <div className="mt-3 flex gap-2">
          <input
            id="qada-years"
            inputMode="decimal"
            value={years}
            onChange={(e) => setYears(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="e.g. 3"
            className="h-11 w-full rounded-full bg-fill px-4 text-[0.9375rem] outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-ink"
          />
          <Button variant="secondary" onClick={applyYears} disabled={!years}>
            Apply
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-line border-y border-line">
        {FARD.map((p) => (
          <li key={p} className="flex items-center justify-between gap-3 py-2">
            <span className="text-[0.9375rem]">{PRAYER_META[p].name}</span>
            <div className="flex items-center gap-1">
              <input
                aria-label={`${PRAYER_META[p].name} owed`}
                inputMode="numeric"
                value={draft[p]}
                onChange={(e) => setDraft((d) => ({ ...d, [p]: Math.min(1_000_000, Number(e.target.value.replace(/\D/g, "")) || 0) }))}
                className="tnum h-9 w-20 rounded-lg border border-transparent bg-transparent text-right text-[0.9375rem] font-medium outline-none focus:bg-fill"
              />
              {[-1, 1].map((step) => (
                <button
                  key={step}
                  type="button"
                  aria-label={`${step < 0 ? "Decrease" : "Increase"} ${PRAYER_META[p].name}`}
                  disabled={step < 0 && draft[p] === 0}
                  onClick={() => setDraft((d) => ({ ...d, [p]: Math.max(0, d[p] + step) }))}
                  className="press grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-fill hover:text-ink disabled:opacity-30"
                >
                  {step < 0 ? <Minus className="size-4" strokeWidth={1.75} /> : <Plus className="size-4" strokeWidth={1.75} />}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          update({ qadaBaseline: Object.fromEntries(FARD.map((p) => [p, draft[p]])) });
          onClose();
        }}
      >
        Save backlog
      </Button>
    </div>
  );
}
