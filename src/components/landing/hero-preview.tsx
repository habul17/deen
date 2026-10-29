"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

const ROWS = [
  { name: "Fajr", time: "5:12", done: true },
  { name: "Dhuhr", time: "12:58", done: true },
  { name: "Asr", time: "4:21", now: true },
  { name: "Maghrib", time: "6:47" },
  { name: "Isha", time: "8:09" },
];

// The phone always shows late afternoon, whatever the sky behind the page is doing.
const TOP = { "--ink": "#eef0fa", "--ink-soft": "rgb(238 240 250 / 0.74)", "--line": "rgb(238 240 250 / 0.18)" } as React.CSSProperties;
const LIST = { "--ink": "#0e1426", "--ink-soft": "rgb(14 20 38 / 0.62)", "--line": "rgb(14 20 38 / 0.12)", "--btn-ink": "#f4f6fb" } as React.CSSProperties;

/** A still life of the Today screen, with Asr being marked a moment after load. */
export function HeroPreview() {
  const reduce = useReducedMotion();
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMarked(true), reduce ? 0 : 1800);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[330px]"
      aria-hidden
    >
      <div className="rounded-[46px] bg-[#0b0e22] p-2 shadow-[0_50px_90px_-40px_rgb(0_0_0/0.6)] ring-1 ring-white/10">
        <div
          className="relative flex aspect-[9/18.5] flex-col overflow-hidden rounded-[38px] px-6 pt-9 pb-6"
          style={{ background: "linear-gradient(180deg, #5a5f9a 0%, #e09a78 58%, #f6c48f 100%)" }}
        >
          <span
            className="absolute top-[41%] left-[70%] size-9 -translate-1/2 rounded-full"
            style={{
              background: "radial-gradient(circle, #fff8e6 0 45%, #ffe3a6 70%, rgb(255 227 166 / 0) 72%)",
              boxShadow: "0 0 50px 14px rgb(255 226 170 / 0.35)",
            }}
          />

          <div style={TOP} className="relative text-ink">
            <div className="text-[0.75rem] text-ink-soft">Thursday, 29 October</div>
            <div className="display mt-7 text-[3.25rem] leading-[0.95] font-semibold tracking-[-0.04em]">Asr</div>
            <div className="mt-1.5 text-[0.9375rem] text-ink-soft">
              ends in <b className="font-semibold text-ink">2h 26m</b>
            </div>
          </div>

          <ol style={LIST} className="relative mt-auto divide-y divide-line text-ink">
            {ROWS.map((r) => {
              const done = r.done || (r.now && marked);
              return (
                <li
                  key={r.name}
                  className={cn(
                    "grid grid-cols-[1fr_auto_1.25rem] items-center gap-2.5",
                    r.now ? "py-2.5 text-[1rem] font-semibold" : "py-2 text-[0.8125rem]",
                    !r.done && !r.now && "text-ink-soft",
                  )}
                >
                  <span>{r.name}</span>
                  <span className={cn("tnum", r.now ? "text-[0.8125rem]" : "text-[0.75rem] text-ink-soft")}>{r.time}</span>
                  <span
                    className={cn(
                      "grid place-items-center justify-self-end rounded-full",
                      r.now ? "size-5" : "size-[1.125rem]",
                      done ? cn("bg-ink text-btn-ink", r.now && "animate-pop") : r.now ? "shadow-[inset_0_0_0_1.5px_var(--ink)]" : "shadow-[inset_0_0_0_1.25px_var(--ink-soft)]",
                    )}
                  >
                    {done && (
                      <svg viewBox="0 0 16 16" className="size-2.5" fill="none">
                        <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>

          <div style={LIST} className="relative mt-4 flex justify-around text-[0.6875rem] text-ink-soft">
            <span className="font-semibold text-ink">Today</span>
            <span>History</span>
            <span>Stats</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
