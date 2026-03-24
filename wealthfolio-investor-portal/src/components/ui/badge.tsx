import * as React from "react";
import { cn } from "@/lib/utils";

const badgeStyles: Record<string, string> = {
  BUY: "border-lime-200 bg-lime-100 text-green-700 dark:border-lime-500/20 dark:bg-lime-500/15 dark:text-lime-300",
  SELL: "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300",
  DIVIDEND:
    "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300",
  INTEREST:
    "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300",
  FEE: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300",
  TAX: "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-500/20 dark:bg-orange-500/15 dark:text-orange-300",
  SPLIT:
    "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300",
  subscription:
    "border-lime-200 bg-lime-100 text-lime-800 dark:border-lime-500/20 dark:bg-lime-500/15 dark:text-lime-300",
  redemption:
    "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300",
  deposit:
    "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300",
  withdrawal:
    "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-500/20 dark:bg-orange-500/15 dark:text-orange-300",
  running:
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300",
  succeeded:
    "border-lime-200 bg-lime-100 text-lime-800 dark:border-lime-500/20 dark:bg-lime-500/15 dark:text-lime-300",
  failed:
    "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300",
  admin:
    "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300",
  investor:
    "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-300",
};

export function getBadgeClassName(variant: string) {
  return badgeStyles[variant] ?? "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
}

export function Badge({
  children,
  className,
  variant,
}: {
  children: React.ReactNode;
  className?: string;
  variant: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide",
        getBadgeClassName(variant),
        className,
      )}
    >
      {children}
    </span>
  );
}
