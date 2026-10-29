import { cn } from "@/lib/cn";

/** A mihrab arch: the niche that points toward the qibla. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-6", className)} aria-hidden>
      <path
        d="M9 26V14.6c0-4.2 3-7.8 7-10.1 4 2.3 7 5.9 7 10.1V26"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 26h19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="display text-[24px] leading-none font-semibold">Deen</span>
    </span>
  );
}
