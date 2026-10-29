"use client";

import { Minus, Plus } from "lucide-react";

export function Stepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  format = (v: number) => String(v),
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  label: string;
}) {
  const btn =
    "press grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 disabled:opacity-30";
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label={`Decrease ${label}`}>
        <Minus className="size-4" strokeWidth={1.75} />
      </button>
      <output className="tnum min-w-[4.5ch] text-center text-[15px] font-medium" aria-live="polite">
        {format(value)}
      </output>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label={`Increase ${label}`}>
        <Plus className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
