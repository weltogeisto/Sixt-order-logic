import { cn } from "@/lib/utils";

/**
 * A footnote reference, set like a report's: a serif superscript numeral.
 * `inverse` is for use on the accent fill (pressed cite chips).
 */
export function Footnote({
  n,
  inverse = false,
  className,
}: {
  n: number;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <sup
      className={cn(
        "font-display text-[0.8em] leading-none font-semibold tabular-nums animate-in fade-in-0 zoom-in-75 duration-200",
        inverse ? "text-accent-fg" : "text-accent",
        className,
      )}
    >
      {n}
    </sup>
  );
}
