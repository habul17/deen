"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Bell, Check, ChevronDown, LoaderCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { dayKeyOf, deviceTimeZone, formatTime, safeTimeZone } from "@/lib/date";
import { FARD, METHODS, PRAYER_META, suggestCalculation } from "@/lib/prayer/constants";
import { computeDay } from "@/lib/prayer/times";
import type { Place } from "@/lib/location";
import { enablePush, pushSupport } from "@/lib/push-client";
import type { SettingsData } from "@/lib/sync";
import { useApp } from "@/store/app-store";
import { useBootstrap } from "@/components/shell/app-shell";
import { LocationPicker } from "@/components/settings/location-picker";
import { placeToSettings } from "@/components/settings/settings-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";

const STEPS = ["welcome", "location", "times", "reminders"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingView() {
  useBootstrap();
  const router = useRouter();
  const ready = useApp((s) => s.ready);
  const user = useApp((s) => s.user);
  const saved = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const [step, setStep] = useState<Step>("welcome");
  const [dir, setDir] = useState(1);
  const [draft, setDraft] = useState<Partial<SettingsData>>({});

  useEffect(() => {
    if (ready && user && saved.onboarded) router.replace("/today");
  }, [ready, user, saved.onboarded, router]);

  const settings = { ...saved, ...draft };
  const go = (next: Step) => {
    setDir(STEPS.indexOf(next) > STEPS.indexOf(step) ? 1 : -1);
    setStep(next);
  };

  const finish = (extra: Partial<SettingsData> = {}) => {
    update({ ...draft, ...extra, timezone: draft.timezone ?? (saved.timezone !== "UTC" ? saved.timezone : deviceTimeZone()), onboarded: true });
    router.replace("/today");
  };

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <LoaderCircle className="size-5 animate-spin text-faint" />
      </div>
    );
  }

  const index = STEPS.indexOf(step);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col px-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),24px)]">
      <div className="flex h-12 items-center justify-between">
        {index > 0 ? (
          <button onClick={() => go(STEPS[index - 1])} aria-label="Back" className="press -ml-2 grid size-10 place-items-center rounded-full text-ink-2 hover:bg-surface-2">
            <ArrowLeft className="size-5" strokeWidth={1.75} />
          </button>
        ) : (
          <Logo />
        )}
        <div className="flex gap-1.5" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <span key={s} className={cn("h-1 rounded-full transition-all duration-500", i <= index ? "w-6 bg-accent" : "w-3 bg-line-strong")} />
          ))}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col pt-8">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 24 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -24 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {step === "welcome" && <Welcome name={user?.name ?? ""} onNext={() => go("location")} />}
            {step === "location" && (
              <LocationStep
                current={settings.locationName}
                onPick={(p: Place) => {
                  const suggestion = suggestCalculation(p.countryCode);
                  setDraft((d) => ({ ...d, ...placeToSettings(p), ...suggestion }));
                  go("times");
                }}
                onKeep={settings.latitude != null ? () => go("times") : undefined}
              />
            )}
            {step === "times" && (
              <TimesStep settings={settings} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} onNext={() => go("reminders")} />
            )}
            {step === "reminders" && <RemindersStep onDone={finish} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Title({ eyebrow, children, sub }: { eyebrow?: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <div className="mb-2 text-[12px] font-medium tracking-[0.12em] text-accent uppercase">{eyebrow}</div>}
      <h1 className="font-serif text-[40px] leading-[1.05] tracking-tight">{children}</h1>
      {sub && <p className="mt-3 text-[15px] leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

function Welcome({ name, onNext }: { name: string; onNext: () => void }) {
  const first = name.trim().split(/\s+/)[0];
  return (
    <>
      <div className="flex-1">
        <p lang="ar" dir="rtl" className="font-arabic text-[28px] leading-relaxed text-accent">
          السَّلَامُ عَلَيْكُمْ
        </p>
        <Title sub="Deen is a quiet place to keep your five daily prayers — and the night prayer — with intention. It takes a minute to set up.">
          Welcome{first ? `, ${first}` : ""}.
        </Title>
        <ul className="space-y-4 text-[15px] text-ink-2">
          {[
            "Accurate times for where you are, adjustable to your mosque",
            "One tap to mark a prayer; hold for the details",
            "Private by design — only you see your history",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Check className="size-3" strokeWidth={2.5} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <Button size="lg" className="mt-10 w-full" onClick={onNext}>
        Begin
      </Button>
    </>
  );
}

function LocationStep({ current, onPick, onKeep }: { current: string | null; onPick: (p: Place) => void; onKeep?: () => void }) {
  return (
    <>
      <Title eyebrow="Step 1 of 3" sub="Prayer times follow the sun, so they're calculated for your location. It stays on your account and is never shared.">
        Where do you pray?
      </Title>
      <LocationPicker onPick={onPick} />
      {onKeep && current && (
        <button onClick={onKeep} className="press mt-4 flex items-center gap-2 self-start rounded-full px-1 text-[14px] text-muted hover:text-ink">
          <MapPin className="size-4" strokeWidth={1.75} />
          Keep {current}
        </button>
      )}
    </>
  );
}

function TimesStep({ settings, onChange, onNext }: { settings: SettingsData; onChange: (p: Partial<SettingsData>) => void; onNext: () => void }) {
  const [showMethods, setShowMethods] = useState(false);
  const tz = safeTimeZone(settings.timezone);
  const times = useMemo(() => computeDay({ ...settings, timezone: tz }, dayKeyOf(new Date(), tz)), [settings, tz]);
  const method = METHODS.find((m) => m.id === settings.method);

  return (
    <>
      <Title eyebrow="Step 2 of 3" sub={`We picked what's common in ${settings.locationName?.split(",").at(-1)?.trim() || "your area"}. Change it to match your mosque.`}>
        Today&apos;s times
      </Title>

      {times && (
        <ul className="mb-6 grid grid-cols-5 gap-1 rounded-2xl border border-line bg-surface p-3 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          {FARD.map((p) => (
            <li key={p}>
              <div className="text-[12px] text-muted">{PRAYER_META[p].name}</div>
              <motion.div key={times[p].start.getTime()} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="tnum mt-1 text-[14px] font-medium">
                {formatTime(times[p].start, tz, settings.timeFormat).replace(/\s?[AP]M$/i, "")}
              </motion.div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-5">
        <div>
          <div className="mb-2 px-1 text-[12px] font-medium tracking-[0.08em] text-muted uppercase">Method</div>
          <button
            onClick={() => setShowMethods((v) => !v)}
            aria-expanded={showMethods}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left text-[15px]"
          >
            <span className="truncate">{method?.label ?? settings.method}</span>
            <ChevronDown className={cn("size-4 shrink-0 text-faint transition-transform", showMethods && "rotate-180")} strokeWidth={1.75} />
          </button>
          <AnimatePresence initial={false}>
            {showMethods && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface"
              >
                {METHODS.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => {
                        onChange({ method: m.id });
                        setShowMethods(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-[14px] hover:bg-surface-2"
                    >
                      {m.label}
                      {m.id === settings.method && <Check className="size-4 text-accent" strokeWidth={2.25} />}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="mb-2 px-1 text-[12px] font-medium tracking-[0.08em] text-muted uppercase">Asr</div>
          <Segmented
            label="Asr calculation"
            value={settings.madhab}
            onChange={(madhab) => onChange({ madhab })}
            options={[
              { value: "shafi", label: "Standard" },
              { value: "hanafi", label: "Ḥanafī" },
            ]}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-3.5">
          <div>
            <div className="text-[15px]">Track Tahajjud</div>
            <div className="text-[13px] text-muted">Optional night prayer, with its own stats</div>
          </div>
          <Switch label="Track Tahajjud" checked={settings.tahajjudEnabled} onChange={(tahajjudEnabled) => onChange({ tahajjudEnabled })} />
        </div>
      </div>

      <div className="flex-1" />
      <p className="mt-6 text-center text-[13px] text-muted">You can fine-tune any single prayer later in Settings.</p>
      <Button size="lg" className="mt-4 w-full" onClick={onNext}>
        Continue
      </Button>
    </>
  );
}

function RemindersStep({ onDone }: { onDone: (extra?: Partial<SettingsData>) => void }) {
  const [busy, setBusy] = useState(false);
  const [support] = useState(() => pushSupport());
  const [failed, setFailed] = useState<string | null>(null);

  const enable = async () => {
    setBusy(true);
    const r = await enablePush();
    setBusy(false);
    if (r === "granted") return onDone();
    setFailed(r === "denied" ? "Notifications were declined — you can turn them on later in Settings." : "Couldn't turn on notifications right now.");
  };

  return (
    <>
      <Title eyebrow="Step 3 of 3" sub="A quiet reminder when each prayer begins, and a gentle nudge if one slips by unmarked.">
        Never miss a prayer
      </Title>

      <div className="relative mx-auto mb-8 w-full max-w-[320px] rounded-[22px] border border-line bg-surface p-4" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent text-accent-ink">
            <Bell className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[14px] font-medium">Asr</span>
              <span className="text-[12px] text-faint">now</span>
            </div>
            <p className="text-[13px] leading-snug text-muted">It&apos;s time for Asr. Tap to mark it once you&apos;ve prayed.</p>
          </div>
        </div>
      </div>

      {support === "needs-install" && (
        <p className="mb-4 rounded-2xl bg-surface-2 px-4 py-3 text-[14px] text-ink-2">
          On iPhone, add Deen to your Home Screen first (Share → Add to Home Screen), then turn reminders on in Settings.
        </p>
      )}
      {failed && <p className="mb-4 rounded-2xl bg-surface-2 px-4 py-3 text-[14px] text-ink-2">{failed}</p>}

      <div className="flex-1" />
      {support === "supported" && !failed && (
        <Button size="lg" className="w-full" onClick={enable} disabled={busy}>
          {busy && <LoaderCircle className="size-4 animate-spin" />}
          Turn on reminders
        </Button>
      )}
      <Button variant="ghost" size="lg" className="mt-2 w-full" onClick={() => onDone()}>
        {failed || support !== "supported" ? "Go to today" : "Not now"}
      </Button>
    </>
  );
}
