"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[30px] w-[50px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-200",
        checked ? "bg-accent" : "bg-line-strong",
        disabled && "opacity-50",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 36 }}
        className={cn("block size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.2)]", checked && "ml-auto")}
      />
    </button>
  );
}
