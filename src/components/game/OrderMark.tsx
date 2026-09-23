import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Order } from "@/game/types";

/**
 * Six concentric rings, one per order of logic. The rings up to `order` are
 * lit; the ring at `order` carries the weight. `animate` draws them in, from
 * the first order outward.
 */
export function OrderMark({
  order,
  size = 28,
  animate = false,
  className,
}: {
  order: Order;
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const rings = [1, 2, 3, 4, 5, 6] as const;
  const c = size / 2;
  const heavy = size >= 48 ? 2 : 1.6;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0 text-accent", className)}
      aria-hidden
    >
      {rings.map((r) => {
        const radius = 3 + r * ((c - 4) / 6);
        const active = r <= order;
        const len = 2 * Math.PI * radius;
        return (
          <circle
            key={r}
            cx={c}
            cy={c}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={r === order ? heavy : 0.8}
            opacity={active ? (r === order ? 1 : 0.3 + r * 0.08) : 0.12}
            transform={`rotate(-90 ${c} ${c})`}
            strokeDasharray={animate ? len : undefined}
            className={animate ? "animate-draw" : undefined}
            style={
              animate
                ? ({ "--len": len, animationDelay: `${r * 110}ms` } as CSSProperties)
                : undefined
            }
          />
        );
      })}
    </svg>
  );
}
