import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        secondary: "border-transparent bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200",
        outline: "border-slate-300 text-slate-600 dark:border-white/20 dark:text-slate-300",
        critical: "border-transparent bg-red-500/15 text-red-600 dark:text-red-400",
        high: "border-transparent bg-orange-500/15 text-orange-600 dark:text-orange-400",
        medium: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
        low: "border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export function severityToVariant(severity: string): BadgeProps["variant"] {
  switch (severity) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return "secondary";
  }
}
