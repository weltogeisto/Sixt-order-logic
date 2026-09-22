import { cn } from "@/lib/utils";
import type { Order } from "@/game/types";

export function OrderMark({
  order,
  size = 28,
  className,
}: {
  order: Order;
  size?: number;
  className?: string;
}) {
  const rings = [1, 2, 3, 4, 5, 6] as const;
  const c = size / 2;
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
        return (
          <circle
            key={r}
            cx={c}
            cy={c}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={r === order ? 1.6 : 0.8}
            opacity={active ? (r === order ? 1 : 0.35 + r * 0.08) : 0.12}
          />
        );
      })}
    </svg>
  );
}
