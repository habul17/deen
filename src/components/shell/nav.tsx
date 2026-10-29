"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/today", label: "Today" },
  { href: "/history", label: "History" },
  { href: "/stats", label: "Stats" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className={cn("tabs-fade fixed inset-x-0 bottom-0 z-40", pathname.startsWith("/today") && "zone-l")}>
      <ul className="mx-auto flex max-w-[440px] justify-center gap-10 pt-6 pb-[max(env(safe-area-inset-bottom),1.375rem)] text-[0.8125rem]">
        {TABS.map(({ href, label }) => {
          const on = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn("block px-1 py-1.5 transition-colors", on ? "font-semibold text-ink" : "text-ink-soft hover:text-ink")}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
      className="grid shrink-0 place-items-center rounded-full bg-fill text-[13px] font-semibold text-ink"
      style={{ width: size, height: size }}
    >
      {initials || "·"}
    </span>
  );
}
