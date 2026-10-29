"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { CONGREGATION_LABEL, PRAYER_META, STATUS_LABEL, type CongregationKey, type PrayerKey, type Status } from "@/lib/prayer/constants";
import { formatDayLong } from "@/lib/date";
import type { LogData } from "@/lib/sync";
import { emptyLog, useApp } from "@/store/app-store";

type Props = {
  open: boolean;
  onClose: () => void;
  date: string;
  prayer: PrayerKey;
  label: string;
  timeLabel: string;
  existing?: LogData;
  travel: boolean;
};

export function PrayerSheet(props: Props) {
  // Remount the body per open so the draft always starts from the saved record.
  return (
    <Sheet
      open={props.open}
      onClose={props.onClose}
      title={props.label}
      description={
        <span>
          {formatDayLong(props.date)} · {props.timeLabel}
        </span>
      }
    >
      {props.open && <SheetBody {...props} />}
    </Sheet>
  );
}

function SheetBody({ onClose, date, prayer, existing, travel }: Props) {
  const setLog = useApp((s) => s.setLog);
  const [draft, setDraft] = useState<LogData>(() => existing ?? { ...emptyLog(), rakats: prayer === "TAHAJJUD" ? 2 : null });
  const [touched, setTouched] = useState(Boolean(existing));
  const meta = PRAYER_META[prayer];
  const isTahajjud = prayer === "TAHAJJUD";
  const prayed = draft.status !== "MISSED";
  const patch = (p: Partial<LogData>) => {
    setDraft((d) => ({ ...d, ...p }));
    setTouched(true);
  };

  const statuses: Status[] = isTahajjud ? ["ON_TIME"] : ["ON_TIME", "LATE", "QADA", "MISSED"];

  return (
    <div className="space-y-6">
      {!isTahajjud && (
        <Field label="How was it prayed?">
          <Segmented
            label="Status"
            value={touched ? draft.status : null}
            onChange={(status) => patch({ status })}
            options={statuses.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          />
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
            {draft.status === "QADA"
              ? "Missed in its time and made up afterwards."
              : draft.status === "MISSED"
                ? "Adds one to your qaḍāʾ count until you make it up."
                : draft.status === "LATE"
                  ? "Prayed within its time, but near the end."
                  : "Prayed within its time."}
          </p>
        </Field>
      )}

      {isTahajjud && (
        <Field label="Rakʿāt">
          <div className="flex items-center justify-between border-y border-line py-2">
            <span className="text-[15px]">Prayed tonight</span>
            <Stepper label="rakʿāt" value={draft.rakats ?? 2} min={2} max={20} step={2} onChange={(rakats) => patch({ rakats })} />
          </div>
        </Field>
      )}

      {prayed && !isTahajjud && (
        <Field label="Where">
          <Segmented<CongregationKey>
            label="Congregation"
            value={draft.congregation}
            onChange={(congregation) => patch({ congregation })}
            options={(["ALONE", "JAMAAH", "MASJID"] as const).map((c) => ({ value: c, label: CONGREGATION_LABEL[c] }))}
          />
        </Field>
      )}

      {prayed && (meta.sunnahBefore || meta.sunnahAfter || prayer === "ISHA" || (travel && meta.shortenable)) && (
        <Field label="Also prayed">
          <div className="divide-y divide-line border-y border-line">
            {meta.sunnahBefore && (
              <ToggleRow label="Sunnah before" hint={meta.sunnahBefore} checked={draft.sunnahBefore} onChange={(v) => patch({ sunnahBefore: v })} />
            )}
            {meta.sunnahAfter && !(travel && meta.shortenable) && (
              <ToggleRow label="Sunnah after" hint={meta.sunnahAfter} checked={draft.sunnahAfter} onChange={(v) => patch({ sunnahAfter: v })} />
            )}
            {prayer === "ISHA" && <ToggleRow label="Witr" hint="Closing the night prayer" checked={draft.witr} onChange={(v) => patch({ witr: v })} />}
            {travel && (prayer === "DHUHR" || prayer === "ASR" || prayer === "MAGHRIB" || prayer === "ISHA") && (
              <ToggleRow
                label="Combined (jamʿ)"
                hint={prayer === "DHUHR" || prayer === "ASR" ? "Dhuhr and Asr together" : "Maghrib and Isha together"}
                checked={draft.combined}
                onChange={(v) => patch({ combined: v })}
              />
            )}
          </div>
        </Field>
      )}

      <div className="flex gap-3 pt-1">
        {existing && (
          <Button
            variant="ghost"
            className="text-danger"
            onClick={() => {
              setLog(date, prayer, null);
              onClose();
            }}
          >
            Clear
          </Button>
        )}
        <Button
          className="flex-1"
          size="lg"
          disabled={!touched}
          onClick={() => {
            setLog(date, prayer, prayed ? draft : { ...draft, congregation: null, sunnahBefore: false, sunnahAfter: false, witr: false, combined: false });
            onClose();
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[13px] text-ink-soft">{label}</div>
      {children}
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-[15px]">{label}</div>
        <div className="text-[13px] text-ink-soft">{hint}</div>
      </div>
      <Switch label={label} checked={checked} onChange={onChange} />
    </div>
  );
}
