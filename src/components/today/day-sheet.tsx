"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { formatDayLong } from "@/lib/date";
import { useApp } from "@/store/app-store";
import { useDay } from "@/hooks/use-prayer-day";

export function DaySheet({ open, onClose, date }: { open: boolean; onClose: () => void; date: string }) {
  return (
    <Sheet open={open} onClose={onClose} title="This day" description={formatDayLong(date)}>
      {open && <DayBody date={date} onClose={onClose} />}
    </Sheet>
  );
}

function DayBody({ date, onClose }: { date: string; onClose: () => void }) {
  const day = useDay(date);
  const setDay = useApp((s) => s.setDay);
  const [note, setNote] = useState(day.note ?? "");

  return (
    <div className="space-y-6">
      <div className="divide-y divide-line rounded-2xl border border-line">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div>
            <div className="text-[15px]">Travelling</div>
            <div className="text-[13px] leading-snug text-muted">Dhuhr, Asr and Isha are shortened to two rakʿāt; combining is allowed.</div>
          </div>
          <Switch label="Travelling" checked={day.travel} onChange={(travel) => setDay(date, { travel })} />
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div>
            <div className="text-[15px]">Excused</div>
            <div className="text-[13px] leading-snug text-muted">Haiḍ or nifās. No prayers are expected, nothing counts as missed, and streaks are kept.</div>
          </div>
          <Switch label="Excused" checked={day.excused} onChange={(excused) => setDay(date, { excused })} />
        </div>
      </div>

      <div>
        <label htmlFor="day-note" className="mb-2 block px-1 text-[12px] font-medium tracking-[0.08em] text-muted uppercase">
          Private note
        </label>
        <textarea
          id="day-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="A reflection, a duʿāʾ, something to remember…"
          className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
        <p className="mt-1.5 px-1 text-[12px] text-faint">Only you can see this.</p>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          if ((day.note ?? "") !== note.trim()) setDay(date, { note: note.trim() || null });
          onClose();
        }}
      >
        Done
      </Button>
    </div>
  );
}
