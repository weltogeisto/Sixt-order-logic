import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-sans text-sm font-medium transition-[opacity,transform,background-color,box-shadow,color] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-fg shadow-[0_1px_0_0_rgba(255,255,255,0.35)_inset] hover:bg-accent/90 disabled:bg-raised disabled:text-subtle disabled:opacity-100 disabled:shadow-[var(--shadow-border)]",
        secondary:
          "bg-raised text-fg shadow-[var(--shadow-border)] hover:bg-overlay hover:shadow-[var(--shadow-border-hover)]",
        outline: "bg-transparent text-fg shadow-[var(--shadow-border)] hover:bg-raised",
        ghost: "bg-transparent text-muted hover:text-fg hover:bg-raised",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
