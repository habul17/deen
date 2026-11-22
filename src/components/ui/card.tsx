import { cn } from "@/lib/cn";

/** A soft panel that groups one idea, so a screen reads as a few calm blocks instead of one long list. */
export function Card({
  title,
  action,
  hint,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & { title?: React.ReactNode; action?: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <section className={cn("rounded-3xl bg-fill p-5", className)} {...props}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-[1rem] font-semibold">{title}</h2>}
            {hint && <p className="mt-0.5 text-[0.75rem] text-ink-soft">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** One number with a short label above it and optional detail below. */
export function Tile({ label, value, sub, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="truncate text-[0.75rem] text-ink-soft">{label}</dt>
      <dd className="tnum mt-1 text-[1.5rem] leading-none font-semibold">{value}</dd>
      {sub && <dd className="mt-1.5 truncate text-[0.75rem] text-ink-soft">{sub}</dd>}
    </div>
  );
}

/** A grid of tiles split by hairlines, all inside one card. */
export function TileGrid({ cols = 2, className, children }: { cols?: 2 | 3; className?: string; children: React.ReactNode }) {
  return (
    <dl className={cn("grid gap-x-4 gap-y-5", cols === 3 ? "grid-cols-3" : "grid-cols-2", className)}>{children}</dl>
  );
}
