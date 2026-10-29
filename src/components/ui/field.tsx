import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-ink transition-colors outline-none placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium text-ink-2", className)} {...props} />;
}

/** Grouped list in the style of native settings screens. */
export function Group({ title, footer, children }: { title?: string; footer?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      {title && <h3 className="px-1 text-[12px] font-medium tracking-[0.08em] text-muted uppercase">{title}</h3>}
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">{children}</div>
      {footer && <p className="px-1 text-[13px] leading-relaxed text-muted">{footer}</p>}
    </section>
  );
}

export function Row({
  label,
  hint,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[56px] items-center justify-between gap-4 px-4 py-3", className)}>
      <div className="min-w-0">
        <div className="text-[15px]">{label}</div>
        {hint && <div className="mt-0.5 text-[13px] text-muted">{hint}</div>}
      </div>
      {children && <div className="flex shrink-0 items-center">{children}</div>}
    </div>
  );
}
