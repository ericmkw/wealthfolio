import * as React from "react";
import { cn } from "@/lib/utils";

const badgeStyles: Record<string, string> = {
  BUY: "bg-lime-500/15 text-lime-300 border-lime-500/20",
  SELL: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  DIVIDEND: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  INTEREST: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  FEE: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  TAX: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  SPLIT: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  subscription: "bg-lime-500/15 text-lime-300 border-lime-500/20",
  redemption: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  deposit: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  withdrawal: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  running: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  succeeded: "bg-lime-500/15 text-lime-300 border-lime-500/20",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  admin: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  investor: "bg-sky-500/15 text-sky-300 border-sky-500/20",
};

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
        badgeStyles[variant] ?? "border-zinc-700 bg-zinc-900 text-zinc-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
