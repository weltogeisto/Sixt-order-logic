import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs font-medium tracking-wide",
  {
    variants: {
      tone: {
        default: "bg-raised text-muted",
        accent: "bg-accent text-accent-fg",
        warn: "bg-warn/15 text-warn",
        ok: "bg-ok/15 text-ok",
        danger: "bg-danger/15 text-danger",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
