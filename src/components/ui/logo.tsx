import { cn } from "@/lib/cn";

/** A mihrab arch: the niche that points toward the qibla. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-7", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M10 24.5V15.2c0-3.4 2.6-6.3 6-8.2 3.4 1.9 6 4.8 6 8.2v9.3"
        stroke="var(--accent-ink)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 24.5h16" stroke="var(--accent-ink)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-serif text-[26px] leading-none tracking-tight">Deen</span>
    </span>
  );
}
