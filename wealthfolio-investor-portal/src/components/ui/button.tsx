import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--wf-accent)] px-4 py-2 text-[var(--wf-accent-fg)] hover:opacity-90",
        secondary: "bg-[var(--wf-soft)] px-4 py-2 text-[var(--wf-fg)] hover:opacity-90",
        outline: "border border-[var(--wf-border)] px-4 py-2 text-[var(--wf-fg)] hover:bg-[var(--wf-soft)]",
        ghost: "px-4 py-2 text-[var(--wf-muted)] hover:bg-[var(--wf-soft)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />
  ),
);

Button.displayName = "Button";
