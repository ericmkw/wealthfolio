import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-[var(--wf-border)] bg-[var(--wf-card)] px-3 py-2 text-sm text-[var(--wf-fg)] outline-none placeholder:text-[var(--wf-muted)] focus:border-[var(--wf-accent)]",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
