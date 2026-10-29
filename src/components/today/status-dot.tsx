"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Status } from "@/lib/prayer/constants";
import { cn } from "@/lib/cn";

gsap.registerPlugin(useGSAP);

export const STATUS_COLOR: Record<Status, string> = {
  ON_TIME: "var(--accent)",
  LATE: "var(--late)",
  QADA: "var(--qada)",
  MISSED: "var(--missed)",
};

type Props = { status?: Status; state: "idle" | "current" | "upcoming" | "excused"; size?: number };

/** The tick that fills when a prayer is marked; animated with GSAP on change only. */
export function StatusDot({ status, state, size = 30 }: Props) {
  const root = useRef<SVGSVGElement>(null);
  const prev = useRef<Status | undefined | null>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const fill = el.querySelector(".fill");
      const mark = el.querySelectorAll(".mark");
      const burst = el.querySelector(".burst");
      const first = prev.current === null;
      const changed = prev.current !== status;
      prev.current = status;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!status) {
        gsap.set(fill, { scale: 0, transformOrigin: "50% 50%" });
        gsap.set(mark, { strokeDashoffset: 1 });
        return;
      }
      if (first || !changed || reduce) {
        gsap.set(fill, { scale: 1, transformOrigin: "50% 50%" });
        gsap.set(mark, { strokeDashoffset: 0 });
        return;
      }
      gsap
        .timeline()
        .fromTo(fill, { scale: 0.4, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.42, ease: "back.out(2.4)" })
        .fromTo(mark, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.34, ease: "power2.out", stagger: 0.06 }, "-=0.24")
        .fromTo(
          burst,
          { scale: 1, opacity: 0.55, transformOrigin: "50% 50%" },
          { scale: 1.9, opacity: 0, duration: 0.6, ease: "power2.out" },
          0,
        );
    },
    { scope: root, dependencies: [status] },
  );

  const color = status ? STATUS_COLOR[status] : "var(--accent)";

  return (
    <svg ref={root} width={size} height={size} viewBox="0 0 28 28" aria-hidden className="shrink-0 overflow-visible">
      <circle
        cx="14"
        cy="14"
        r="12.25"
        fill="none"
        strokeWidth="1.5"
        stroke={state === "current" && !status ? "var(--accent)" : "var(--line-strong)"}
        strokeDasharray={state === "upcoming" ? "2.5 3.2" : undefined}
        className={cn(state === "current" && !status && "motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]")}
      />
      <circle className="burst" cx="14" cy="14" r="13" fill="none" stroke={color} strokeWidth="1.5" opacity="0" />
      <circle className="fill" cx="14" cy="14" r="13" fill={color} />
      {status === "MISSED" ? (
        <>
          <path className="mark" d="M10.4 10.4l7.2 7.2" pathLength={1} strokeDasharray={1} stroke="var(--surface)" strokeWidth="2" strokeLinecap="round" />
          <path className="mark" d="M17.6 10.4l-7.2 7.2" pathLength={1} strokeDasharray={1} stroke="var(--surface)" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <path
          className="mark"
          d="M9.2 14.4l3.3 3.3 6.4-7"
          pathLength={1}
          strokeDasharray={1}
          fill="none"
          stroke="var(--surface)"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
