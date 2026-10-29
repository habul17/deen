import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl bg-fill px-4 text-[15px] text-ink transition-shadow outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-ink",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-[13px] text-ink-soft", className)} {...props} />;
}

/** A titled run of hairline rows. */
export function Group({ title, footer, children }: { title?: string; footer?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      {title && <h3 className="pb-1 text-[13px] text-ink-soft">{title}</h3>}
      <div className="divide-y divide-line border-y border-line">{children}</div>
      {footer && <p className="pt-2.5 text-[13px] leading-relaxed text-ink-soft">{footer}</p>}
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
    <div className={cn("flex min-h-[54px] items-center justify-between gap-4 py-3", className)}>
      <div className="min-w-0">
        <div className="text-[15px]">{label}</div>
        {hint && <div className="mt-0.5 text-[13px] text-ink-soft">{hint}</div>}
      </div>
      {children && <div className="flex shrink-0 items-center">{children}</div>}
    </div>
  );
}
