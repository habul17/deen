"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FARD, type Status } from "@/lib/prayer/constants";
import type { DayTimes } from "@/lib/prayer/times";
import { STATUS_COLOR } from "./status-dot";

gsap.registerPlugin(useGSAP);

const CX = 160;
const CY = 112;
const RX = 144;
const RY = 90;
const point = (f: number) => {
  const a = Math.PI * Math.min(1, Math.max(0, f));
  return { x: CX - RX * Math.cos(a), y: CY - RY * Math.sin(a) };
};
const ARC = `M ${CX - RX} ${CY} A ${RX} ${RY} 0 0 1 ${CX + RX} ${CY}`;

/** The day drawn as the sun's path from Fajr to Isha, with each prayer placed where it falls. */
export function DayArc({ times, now, statuses }: { times: DayTimes; now: Date; statuses: Partial<Record<string, Status>> }) {
  const root = useRef<SVGSVGElement>(null);
  const progress = useRef({ f: 0 });
  const mounted = useRef(false);

  const start = times.FAJR.start.getTime();
  const span = times.ISHA.start.getTime() - start;
  const frac = (d: Date) => (d.getTime() - start) / span;
  const nowF = Math.min(1, Math.max(0, frac(now)));

  useGSAP(
    () => {
      const el = root.current!;
      const path = el.querySelector<SVGPathElement>(".progress")!;
      const marker = el.querySelector<SVGGElement>(".marker")!;
      const render = () => {
        const f = progress.current.f;
        path.style.strokeDashoffset = String(1 - f);
        const p = point(f);
        marker.setAttribute("transform", `translate(${p.x} ${p.y})`);
      };
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!mounted.current) {
        mounted.current = true;
        if (reduce) {
          progress.current.f = nowF;
          render();
          return;
        }
        gsap.fromTo(el.querySelectorAll(".dot"), { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.5, stagger: 0.07, ease: "back.out(2)", delay: 0.15 });
        gsap.fromTo(progress.current, { f: 0 }, { f: nowF, duration: 1.4, ease: "power3.out", onUpdate: render });
      } else {
        gsap.to(progress.current, { f: nowF, duration: reduce ? 0 : 0.8, ease: "power2.out", onUpdate: render });
      }
    },
    { scope: root, dependencies: [nowF] },
  );

  return (
    <svg ref={root} viewBox="0 0 320 124" className="w-full" role="img" aria-label="Today's prayers along the path of the sun">
      <line x1="4" x2="316" y1={CY} y2={CY} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 4" />
      <path d={ARC} fill="none" stroke="var(--line)" strokeWidth="1.5" strokeLinecap="round" />
      <path
        className="progress"
        d={ARC}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset="1"
      />
      {FARD.map((p) => {
        const { x, y } = point(frac(times[p].start));
        const s = statuses[p];
        return (
          <g key={p} className="dot" style={{ transformBox: "fill-box" }}>
            <circle cx={x} cy={y} r="5.5" fill={s ? STATUS_COLOR[s] : "var(--surface)"} stroke={s ? "none" : "var(--line-strong)"} strokeWidth="1.5" />
          </g>
        );
      })}
      <g className="marker" transform={`translate(${point(0).x} ${point(0).y})`}>
        <circle r="11" fill="var(--accent)" opacity="0.14" />
        <circle r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
      </g>
    </svg>
  );
}
