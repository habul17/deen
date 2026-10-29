"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { BellOff, Check, ChevronRight, Download, LoaderCircle, LogOut, MapPin, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { authClient } from "@/lib/auth-client";
import { formatTime } from "@/lib/date";
import { FARD, HIGH_LAT_RULES, METHODS, PRAYER_META, type PrayerKey } from "@/lib/prayer/constants";
import { computeDay, type Adjustment } from "@/lib/prayer/times";
import type { Place } from "@/lib/location";
import { currentSubscription, disablePush, enablePush, pushSupport, type PushSupport } from "@/lib/push-client";
import { useApp } from "@/store/app-store";
import { useToast } from "@/store/toast-store";
import { useNow } from "@/hooks/use-now";
import { useDayTimes, useTimeZone, useTodayKey } from "@/hooks/use-prayer-day";
import { Group, Input, Row } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Segmented } from "@/components/ui/segmented";
import { Stepper } from "@/components/ui/stepper";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/shell/nav";
import { LocationPicker } from "./location-picker";
import { exportCsv, exportJson } from "./export";

export const placeToSettings = (p: Place) => ({
  latitude: p.latitude,
  longitude: p.longitude,
  locationName: p.name,
  countryCode: p.countryCode,
  timezone: p.timezone,
});

export function SettingsView() {
  const user = useApp((s) => s.user);
  const s = useApp((st) => st.settings);
  const update = useApp((st) => st.updateSettings);
  const [sheet, setSheet] = useState<null | "location" | "method" | "highlat" | "delete" | PrayerKey | "SUNRISE">(null);
  const close = () => setSheet(null);

  return (
    <div className="pt-4 md:pt-0">
      <header className="mb-6">
        <h1 className="font-serif text-[34px] leading-none tracking-tight md:text-[44px]">Settings</h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-8">
          {user && (
            <div className="flex items-center gap-4 rounded-[22px] border border-line bg-surface px-4 py-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <Avatar name={user.name} image={user.image} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[17px] font-medium">{user.name}</div>
                <div className="truncate text-[14px] text-muted">{user.email}</div>
              </div>
              <SyncStatus />
            </div>
          )}

          <Group title="Location" footer="Prayer times are calculated on your device from these coordinates.">
            <ButtonRow
              label={s.locationName ?? "Not set"}
              hint={s.latitude != null ? `${s.latitude.toFixed(3)}, ${s.longitude?.toFixed(3)} · ${s.timezone}` : "Needed for prayer times"}
              icon={<MapPin className="size-4 text-muted" strokeWidth={1.75} />}
              onClick={() => setSheet("location")}
            />
          </Group>

          <Group title="Calculation">
            <ButtonRow label="Method" value={METHODS.find((m) => m.id === s.method)?.label ?? s.method} onClick={() => setSheet("method")} />
            <Row label="Asr time" hint={s.madhab === "hanafi" ? "Later Asr (shadow twice the length)" : "Earlier Asr (shadow equal to length)"}>
              <div className="w-[170px]">
                <Segmented
                  label="Asr calculation"
                  size="sm"
                  value={s.madhab}
                  onChange={(madhab) => update({ madhab })}
                  options={[
                    { value: "shafi", label: "Standard" },
                    { value: "hanafi", label: "Ḥanafī" },
                  ]}
                />
              </div>
            </Row>
            <ButtonRow
              label="High latitudes"
              value={HIGH_LAT_RULES.find((r) => r.id === s.highLatRule)?.label ?? "Automatic"}
              onClick={() => setSheet("highlat")}
            />
          </Group>

          <PrayerTimesGroup onEdit={(p) => setSheet(p)} />

          <Group title="Night prayer" footer="Tahajjud is voluntary: it never counts as missed or toward qaḍāʾ, and has its own stats.">
            <Row label="Track Tahajjud" hint="Last third of the night until Fajr">
              <Switch label="Track Tahajjud" checked={s.tahajjudEnabled} onChange={(tahajjudEnabled) => update({ tahajjudEnabled })} />
            </Row>
          </Group>
        </div>

        <div className="space-y-8">
          <NotificationsGroup />
          <AppearanceGroup />

          <Group title="Your data" footer="Everything you log is private to your account. Export it any time.">
            <ButtonRow label="Export as CSV" hint="One row per prayer, for spreadsheets" icon={<Download className="size-4 text-muted" strokeWidth={1.75} />} onClick={exportCsv} />
            <ButtonRow label="Export as JSON" hint="Complete backup, including settings" icon={<Download className="size-4 text-muted" strokeWidth={1.75} />} onClick={exportJson} />
          </Group>

          <Group title="Account">
            <SignOutRow />
            <ButtonRow label={<span className="text-missed">Delete account</span>} icon={<Trash2 className="size-4 text-missed" strokeWidth={1.75} />} onClick={() => setSheet("delete")} />
          </Group>

          <p className="px-1 text-center text-[12px] leading-relaxed text-faint lg:text-left">
            <span lang="ar" dir="rtl" className="font-arabic text-[15px]">
              إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا
            </span>
            <br />
            “Indeed, prayer has been decreed upon the believers at fixed times.” · An-Nisāʾ 4:103
          </p>
        </div>
      </div>

      <Sheet open={sheet === "location"} onClose={close} title="Location" description="Search a city or use where you are now.">
        {sheet === "location" && (
          <LocationPicker
            onPick={(p) => {
              update(placeToSettings(p));
              close();
            }}
          />
        )}
      </Sheet>

      <ChoiceSheet
        open={sheet === "method"}
        onClose={close}
        title="Calculation method"
        description="Choose the authority your local mosque follows. It sets the sun angles for Fajr and Isha."
        options={METHODS.map((m) => ({ id: m.id, label: m.label }))}
        value={s.method}
        onChange={(method) => update({ method })}
      />
      <ChoiceSheet
        open={sheet === "highlat"}
        onClose={close}
        title="High latitudes"
        description="Far from the equator, twilight can last all night in summer. This rule keeps Fajr and Isha sensible."
        options={HIGH_LAT_RULES.map((r) => ({ id: r.id, label: r.label }))}
        value={s.highLatRule}
        onChange={(highLatRule) => update({ highLatRule })}
      />

      <AdjustSheet target={sheet && sheet in PRAYER_META ? (sheet as PrayerKey) : sheet === "SUNRISE" ? "SUNRISE" : null} onClose={close} />
      <DeleteSheet open={sheet === "delete"} onClose={close} />
    </div>
  );
}

function ButtonRow({
  label,
  hint,
  value,
  icon,
  onClick,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/60">
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px]">{label}</span>
        {hint && <span className="mt-0.5 block truncate text-[13px] text-muted">{hint}</span>}
      </span>
      {value && <span className="max-w-[55%] truncate text-right text-[14px] text-muted">{value}</span>}
      <ChevronRight className="size-4 shrink-0 text-faint" strokeWidth={1.75} />
    </button>
  );
}

function SyncStatus() {
  const pending = useApp((s) => s.outbox.length);
  const state = useApp((s) => s.syncState);
  const label = state === "offline" ? "Offline" : pending > 0 || state === "syncing" ? "Syncing" : "Synced";
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-muted" aria-live="polite">
      <span className={cn("size-1.5 rounded-full", label === "Synced" ? "bg-accent" : label === "Offline" ? "bg-late" : "animate-pulse bg-muted")} />
      {label}
    </span>
  );
}

function PrayerTimesGroup({ onEdit }: { onEdit: (p: PrayerKey | "SUNRISE") => void }) {
  const now = useNow(60_000);
  const today = useTodayKey(now);
  const { times } = useDayTimes(today);
  const s = useApp((st) => st.settings);
  const tz = useTimeZone();
  if (!times) return null;

  const rows: (PrayerKey | "SUNRISE")[] = [...(s.tahajjudEnabled ? (["TAHAJJUD"] as const) : []), "FAJR", "SUNRISE", "DHUHR", "ASR", "MAGHRIB", "ISHA"];
  const describe = (a?: Adjustment) => (a?.fixed ? "Fixed" : a?.offset ? `${a.offset > 0 ? "+" : "−"}${Math.abs(a.offset)} min` : null);

  return (
    <Group title="Prayer times" footer="Adjust any time to match your local mosque, or set a fixed time.">
      {rows.map((p) => {
        const at = p === "SUNRISE" ? times.sunrise : times[p].start;
        const tag = describe(s.adjustments[p]);
        return (
          <ButtonRow
            key={p}
            label={p === "SUNRISE" ? "Sunrise" : PRAYER_META[p].name}
            value={
              <span className="inline-flex items-center gap-2">
                {tag && <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">{tag}</span>}
                <span className="tnum text-ink-2">{formatTime(at, tz, s.timeFormat)}</span>
              </span>
            }
            onClick={() => onEdit(p)}
          />
        );
      })}
    </Group>
  );
}

function AdjustSheet({ target, onClose }: { target: PrayerKey | "SUNRISE" | null; onClose: () => void }) {
  return (
    <Sheet
      open={target !== null}
      onClose={onClose}
      title={target === "SUNRISE" ? "Sunrise" : target ? PRAYER_META[target].name : ""}
      description="Fine-tune the calculated time, or pin it to a fixed time every day."
    >
      {target && <AdjustBody key={target} target={target} onClose={onClose} />}
    </Sheet>
  );
}

function AdjustBody({ target, onClose }: { target: PrayerKey | "SUNRISE"; onClose: () => void }) {
  const s = useApp((st) => st.settings);
  const update = useApp((st) => st.updateSettings);
  const tz = useTimeZone();
  const now = useNow(60_000);
  const today = useTodayKey(now);
  const current = s.adjustments[target] ?? {};
  const canFix = target !== "SUNRISE";
  const [mode, setMode] = useState<"offset" | "fixed">(current.fixed && canFix ? "fixed" : "offset");
  const [offset, setOffset] = useState(current.offset ?? 0);
  const [fixed, setFixed] = useState(current.fixed ?? "");

  const base = useMemo(() => {
    const rest = { ...s.adjustments };
    delete rest[target];
    const t = computeDay({ ...s, timezone: tz, adjustments: rest }, today);
    if (!t) return null;
    return target === "SUNRISE" ? t.sunrise : t[target].start;
  }, [s, tz, today, target]);

  const preview = base ? new Date(base.getTime() + offset * 60_000) : null;

  const save = (next: Adjustment | null) => {
    const adjustments = { ...s.adjustments };
    if (next) adjustments[target] = next;
    else delete adjustments[target];
    update({ adjustments });
    onClose();
  };

  return (
    <div className="space-y-5">
      {canFix && (
        <Segmented
          label="Adjustment type"
          value={mode}
          onChange={setMode}
          options={[
            { value: "offset", label: "Calculated" },
            { value: "fixed", label: "Fixed time" },
          ]}
        />
      )}

      {mode === "offset" ? (
        <div className="rounded-2xl border border-line">
          <Row label="Calculated" hint={target === "TAHAJJUD" ? "Start of the last third of the night" : undefined}>
            <span className="tnum text-[15px] text-muted">{base ? formatTime(base, tz, s.timeFormat) : "—"}</span>
          </Row>
          <div className="border-t border-line">
            <Row label="Adjust by">
              <Stepper
                label="Minutes"
                value={offset}
                min={-60}
                max={60}
                onChange={setOffset}
                format={(v) => (v === 0 ? "0 min" : `${v > 0 ? "+" : "−"}${Math.abs(v)} min`)}
              />
            </Row>
          </div>
          <div className="border-t border-line">
            <Row label="New time">
              <span className="tnum text-[17px] font-medium">{preview ? formatTime(preview, tz, s.timeFormat) : "—"}</span>
            </Row>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-line p-4">
          <label htmlFor="fixed-time" className="text-[14px] font-medium">
            Every day at
          </label>
          <Input id="fixed-time" type="time" value={fixed} onChange={(e) => setFixed(e.target.value)} className="tnum mt-2 text-[17px]" />
          <p className="mt-2 text-[13px] text-muted">Useful when your mosque keeps a set jamāʿah time. The window still ends at the next prayer.</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={() => save(null)}>
          Reset
        </Button>
        <Button
          size="lg"
          className="flex-[2]"
          disabled={mode === "fixed" && !/^\d{2}:\d{2}$/.test(fixed)}
          onClick={() => save(mode === "fixed" ? { fixed } : offset ? { offset } : null)}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function ChoiceSheet({
  open,
  onClose,
  title,
  description,
  options,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title} description={description}>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line" role="listbox" aria-label={title}>
        {options.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              role="option"
              aria-selected={o.id === value}
              onClick={() => {
                onChange(o.id);
                onClose();
              }}
              className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3 text-left text-[15px] transition-colors hover:bg-surface-2"
            >
              {o.label}
              {o.id === value && <Check className="size-4 text-accent" strokeWidth={2.25} />}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

function NotificationsGroup() {
  const s = useApp((st) => st.settings);
  const update = useApp((st) => st.updateSettings);
  const toast = useToast((st) => st.show);
  const [support] = useState<PushSupport>(pushSupport);
  const [enabled, setEnabled] = useState(false);
  const [blocked, setBlocked] = useState(() => support === "supported" && Notification.permission === "denied");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (support === "supported") {
      currentSubscription().then((sub) => setEnabled(Boolean(sub) && Notification.permission === "granted"));
    }
  }, [support]);

  const toggle = async (on: boolean) => {
    setBusy(true);
    if (on) {
      const r = await enablePush();
      setEnabled(r === "granted");
      setBlocked(r === "denied" && Notification.permission === "denied");
      if (r === "error") toast({ message: "Couldn't turn on notifications. Try again." });
    } else {
      await disablePush();
      setEnabled(false);
    }
    setBusy(false);
  };

  const footer =
    support === "needs-install"
      ? "On iPhone and iPad, add Deen to your Home Screen first (Share → Add to Home Screen), then open it from there."
      : support === "unsupported"
        ? "This browser doesn't support notifications."
        : support === "unconfigured"
          ? "Notifications aren't configured on this server yet."
          : blocked
            ? "Notifications are blocked. Allow them for this site in your browser settings."
            : "Reminders are sent to this device. Turn them on for each device you use.";

  const ready = support === "supported" && enabled;

  return (
    <Group title="Notifications" footer={footer}>
      <Row label="Allow on this device" hint={ready ? "On" : blocked ? "Blocked" : "Off"}>
        {busy ? (
          <LoaderCircle className="size-5 animate-spin text-muted" />
        ) : support === "supported" && !blocked ? (
          <Switch label="Allow notifications on this device" checked={enabled} onChange={toggle} />
        ) : (
          <BellOff className="size-5 text-faint" strokeWidth={1.75} />
        )}
      </Row>
      {ready && (
        <>
          <Row label="At prayer time" hint="When each prayer begins">
            <Switch label="At prayer time" checked={s.notifyAdhan} onChange={(notifyAdhan) => update({ notifyAdhan })} />
          </Row>
          <Row label="Gentle nudge" hint={s.notifyNudge ? `If not marked after ${s.nudgeAfterMin} min` : "If a prayer isn't marked"}>
            <Switch label="Gentle nudge" checked={s.notifyNudge} onChange={(notifyNudge) => update({ notifyNudge })} />
          </Row>
          {s.notifyNudge && (
            <Row label="Nudge after">
              <Stepper label="Nudge after minutes" value={s.nudgeAfterMin} min={5} max={180} step={5} onChange={(nudgeAfterMin) => update({ nudgeAfterMin })} format={(v) => `${v} min`} />
            </Row>
          )}
          {s.tahajjudEnabled && (
            <Row label="Tahajjud" hint="When the last third of the night begins">
              <Switch label="Tahajjud reminder" checked={s.notifyTahajjud} onChange={(notifyTahajjud) => update({ notifyTahajjud })} />
            </Row>
          )}
          <div className="px-4 py-3.5">
            <div className="mb-2.5 text-[15px]">Prayers</div>
            <div className="flex flex-wrap gap-2">
              {FARD.map((p) => {
                const on = s.notifyPrayers.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ notifyPrayers: on ? s.notifyPrayers.filter((x) => x !== p) : [...s.notifyPrayers, p] })}
                    className={cn(
                      "press h-9 rounded-full px-3.5 text-[13px] font-medium transition-colors",
                      on ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted hover:text-ink",
                    )}
                  >
                    {PRAYER_META[p].name}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </Group>
  );
}

function AppearanceGroup() {
  const { theme, setTheme } = useTheme();
  const timeFormat = useApp((s) => s.settings.timeFormat);
  const update = useApp((s) => s.updateSettings);

  return (
    <Group title="Appearance">
      <Row label="Theme">
        <div className="w-[200px]">
          <Segmented
            label="Theme"
            size="sm"
            value={(theme ?? "system") as "system" | "light" | "dark"}
            onChange={setTheme}
            options={[
              { value: "system", label: "Auto" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </div>
      </Row>
      <Row label="Clock">
        <div className="w-[200px]">
          <Segmented
            label="Clock format"
            size="sm"
            value={timeFormat}
            onChange={(v) => update({ timeFormat: v })}
            options={[
              { value: "auto", label: "Auto" },
              { value: "12h", label: "12h" },
              { value: "24h", label: "24h" },
            ]}
          />
        </div>
      </Row>
    </Group>
  );
}

async function signOutEverywhere() {
  await disablePush().catch(() => {});
  await authClient.signOut().catch(() => {});
  await useApp.getState().clearLocal();
  window.location.replace("/");
}

function SignOutRow() {
  const [busy, setBusy] = useState(false);
  return (
    <ButtonRow
      label="Sign out"
      icon={busy ? <LoaderCircle className="size-4 animate-spin text-muted" /> : <LogOut className="size-4 text-muted" strokeWidth={1.75} />}
      onClick={async () => {
        setBusy(true);
        await signOutEverywhere();
      }}
    />
  );
}

function DeleteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    await disablePush().catch(() => {});
    const res = await fetch("/api/account", { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setBusy(false);
      setError("Couldn't delete your account. Check your connection and try again.");
      return;
    }
    await authClient.signOut().catch(() => {});
    await useApp.getState().clearLocal();
    window.location.replace("/");
  };

  return (
    <Sheet open={open} onClose={onClose} title="Delete account" description="This permanently erases your account and every prayer, note and setting. It can't be undone.">
      <div className="space-y-4">
        <div>
          <label htmlFor="confirm-delete" className="mb-1.5 block text-[13px] text-muted">
            Type <span className="font-medium text-ink">delete</span> to confirm
          </label>
          <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" autoCapitalize="none" />
        </div>
        {error && <p className="text-[13px] text-missed">{error}</p>}
        <Button variant="danger" size="lg" className="w-full" disabled={confirm.trim().toLowerCase() !== "delete" || busy} onClick={remove}>
          {busy && <LoaderCircle className="size-4 animate-spin" />}
          Delete everything
        </Button>
      </div>
    </Sheet>
  );
}
