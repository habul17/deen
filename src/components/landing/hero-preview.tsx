"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Users } from "lucide-react";
import { cn } from "@/lib/cn";

type Row = { name: string; arabic: string; time: string; state: "done" | "now" | "upcoming"; jamaah?: boolean };

const ROWS: Row[] = [
  { name: "Fajr", arabic: "الفجر", time: "5:12", state: "done" },
  { name: "Dhuhr", arabic: "الظهر", time: "12:58", state: "done", jamaah: true },
  { name: "Asr", arabic: "العصر", time: "4:21", state: "now" },
  { name: "Maghrib", arabic: "المغرب", time: "6:47", state: "upcoming" },
  { name: "Isha", arabic: "العشاء", time: "8:09", state: "upcoming" },
];

// Points on the day's arc for each prayer (t = 0, .25, .5, .7, 1 along the curve).
const ARC = [
  [6, 50],
  [78, 26],
  [150, 18],
  [207.6, 23.1],
  [294, 50],
] as const;

/** A still life of the Today screen, with Asr being marked a moment after load. */
export function HeroPreview() {
  const reduce = useReducedMotion();
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMarked(true), reduce ? 0 : 1600);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[380px]"
      aria-hidden
    >
      <div className="absolute -inset-x-10 -top-10 -bottom-6 -z-10 rounded-[64px] bg-accent-soft/70 blur-3xl" />
      <div className="rounded-[44px] border border-line-strong bg-bg p-2.5" style={{ boxShadow: "0 40px 80px -40px rgb(25 27 25 / 0.35)" }}>
        <div className="overflow-hidden rounded-[36px] border border-line bg-bg px-4 pt-5 pb-4">
          <div className="flex items-center justify-between px-2 text-[12px] text-muted">
            <span>Thursday</span>
            <span lang="ar" dir="rtl" className="font-arabic">
              ٧ جمادى الأولى
            </span>
          </div>

          <div className="mt-3 rounded-[24px] border border-line bg-surface px-5 pt-5 pb-4">
            <div className="text-[11px] font-medium tracking-[0.12em] text-accent uppercase">{marked ? "Next prayer" : "Now"}</div>
            <motion.div key={String(marked)} initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.45 }}>
              <div className="mt-1 flex items-baseline gap-2.5 font-serif text-[40px] leading-[1.05] tracking-tight">
                {marked ? "Maghrib" : "Asr"}
                <span lang="ar" dir="rtl" className="font-arabic text-[17px] text-faint">
                  {marked ? "المغرب" : "العصر"}
                </span>
              </div>
              <div className="mt-1 text-[13px] text-muted">
                {marked ? (
                  <>
                    in <span className="tnum">1h 04m</span> · <span className="tnum">6:47</span>
                  </>
                ) : (
                  <>
                    <span className="tnum">2h 26m</span> left · until <span className="tnum">6:47</span>
                  </>
                )}
              </div>
            </motion.div>
            <svg viewBox="0 0 300 54" className="mt-4 w-full overflow-visible">
              <path d="M6 50 Q150 -14 294 50" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" />
              <path d="M6 50 Q106.8 5.2 207.6 23.1" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" />
              {ARC.map(([x, y], i) => (
                <circle
                  key={x}
                  cx={x}
                  cy={y}
                  r={i === 3 ? 5 : 3}
                  fill={i < 3 || (i === 3 && marked) ? "var(--accent)" : "var(--surface)"}
                  stroke={i < 4 ? "var(--accent)" : "var(--line-strong)"}
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </div>

          <ul className="mt-3 divide-y divide-line rounded-[24px] border border-line bg-surface">
            {ROWS.map((r) => {
              const state = r.state === "now" && marked ? "done" : r.state;
              return (
                <li key={r.name} className={cn("flex items-center gap-3 px-4 py-3", r.state === "now" && !marked && "bg-accent-soft/50")}>
                  <Tick state={state} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={cn("text-[15px] font-medium", state === "upcoming" && "text-muted")}>{r.name}</span>
                      <span lang="ar" dir="rtl" className="font-arabic text-[12px] text-faint">
                        {r.arabic}
                      </span>
                    </div>
                    {r.jamaah && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                        <Users className="size-3" strokeWidth={1.75} /> Jamāʿah
                      </div>
                    )}
                  </div>
                  <span className="tnum text-[13px] text-muted">{r.time}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function Tick({ state }: { state: Row["state"] }) {
  const done = state === "done";
  return (
    <span
      className={cn(
        "relative grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-300",
        done ? "border-accent bg-accent text-accent-ink" : state === "now" ? "border-accent" : "border-line-strong",
      )}
    >
      {done && (
        <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
          <Check className="size-3.5" strokeWidth={2.5} />
        </motion.span>
      )}
      {state === "now" && <span className="absolute inset-0 animate-ping rounded-full border border-accent opacity-40" />}
    </span>
  );
}
