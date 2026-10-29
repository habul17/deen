import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const base =
  "press inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[opacity,background-color] duration-200 disabled:opacity-45 select-none whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-btn-ink hover:opacity-90",
  secondary: "text-ink ring-1 ring-line ring-inset hover:bg-fill",
  ghost: "text-ink hover:bg-fill",
  danger: "text-danger ring-1 ring-current/30 ring-inset hover:bg-fill",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-[15px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
