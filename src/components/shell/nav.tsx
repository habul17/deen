"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { CalendarDays, ChartNoAxesColumn, Settings2, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/logo";
import { useApp } from "@/store/app-store";

const TABS = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/history", label: "History", icon: CalendarDays },
  { href: "/stats", label: "Stats", icon: ChartNoAxesColumn },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function Nav() {
  const pathname = usePathname();
  const user = useApp((s) => s.user);
  const active = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Phones: bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color-mix(in_oklab,var(--bg)_86%,transparent)] backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),8px)]">
          {TABS.map(({ href, label, icon: Icon }) => {
            const on = active(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "press relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium tracking-wide transition-colors",
                    on ? "text-ink" : "text-faint hover:text-muted",
                  )}
                >
                  <span className="relative grid h-8 w-14 place-items-center">
                    {on && (
                      <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-accent-soft" />
                    )}
                    <Icon className={cn("relative size-[21px]", on && "text-accent")} strokeWidth={on ? 2 : 1.6} />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Tablets & desktop: side rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line bg-bg px-5 py-8 md:flex">
        <Link href="/today" className="px-2">
          <Logo />
        </Link>
        <ul className="mt-10 space-y-1">
          {TABS.map(({ href, label, icon: Icon }) => {
            const on = active(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "relative flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors",
                    on ? "text-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  {on && <motion.span layoutId="rail-pill" className="absolute inset-0 rounded-xl bg-surface-2" />}
                  <Icon className={cn("relative size-[19px]", on && "text-accent")} strokeWidth={on ? 2 : 1.6} />
                  <span className="relative">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {user && (
          <div className="mt-auto flex items-center gap-3 px-2">
            <Avatar name={user.name} image={user.image} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="truncate text-xs text-muted">{user.email}</div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export function Avatar({ name, image, size = 36 }: { name: string; image: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
  ) : (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent"
      style={{ width: size, height: size }}
    >
      {initials || "·"}
    </span>
  );
}
