import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { SITE_LINKS, SITES } from "@/game/data";
import { liveSites } from "@/game/guide";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";
import type { SiteId } from "@/game/types";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The incident surface. Six sites around the record, set on the six order
 * rings. Lines and nodes share one pixel space (measured), so they stay
 * joined at any width. A bright node has work for the selected scanner; a
 * dim one refuses. The numeral is the deepest order filed there.
 */
export function SiteMap() {
  const state = useGame((s) => s.state);
  const selectSite = useGame((s) => s.selectSite);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Only animate filings made while this map is mounted, not the ones in the save.
  const firstFinding = useRef<string | null | undefined>(undefined);

  useIsoLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!state) return null;
  const last = state.findings.at(-1) ?? null;
  if (firstFinding.current === undefined) firstFinding.current = last?.id ?? null;
  const fresh = last && last.id !== firstFinding.current ? last : null;
  const lastCross = state.crossNotes.at(-1);

  const live = new Set(liveSites(state));
  const pos = Object.fromEntries(
    SITES.map((s) => [s.id, { x: (s.x / 100) * size.w, y: (s.y / 100) * size.h }]),
  ) as Record<SiteId, { x: number; y: number }>;
  const cx = size.w / 2;
  const cy = size.h / 2;
  const rMax = Math.min(size.w, size.h) * 0.46;

  const filings = (id: SiteId) => state.findings.filter((f) => f.siteId === id);

  return (
    <div ref={box} className="relative h-80 w-full select-none sm:h-96 lg:aspect-[5/4] lg:h-auto">
      {size.w > 0 ? (
        <svg
          width={size.w}
          height={size.h}
          className="absolute inset-0 text-border"
          role="img"
          aria-label="Incident surface: six sites around the record"
        >
          {[1, 2, 3, 4, 5, 6].map((r) => (
            <circle
              key={r}
              cx={cx}
              cy={cy}
              r={(rMax * r) / 6}
              fill="none"
              stroke="currentColor"
              strokeWidth={r === 6 ? 1 : 0.75}
              strokeDasharray={r === 6 ? undefined : "2 5"}
              opacity={0.25 + r * 0.08}
            />
          ))}
          {SITE_LINKS.map(([a, b]) => {
            const hot = a === state.selectedSite || b === state.selectedSite;
            return (
              <line
                key={`${a}-${b}`}
                x1={pos[a].x}
                y1={pos[a].y}
                x2={pos[b].x}
                y2={pos[b].y}
                stroke="currentColor"
                strokeWidth={hot ? 1.25 : 0.9}
                className={cn(
                  "transition-[color,opacity] duration-300",
                  hot ? "text-accent/40" : "text-border",
                )}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={22} className="fill-bg" stroke="currentColor" />
          <text
            x={cx}
            y={cy + 3}
            textAnchor="middle"
            className="fill-subtle font-mono"
            fontSize="8.5"
            letterSpacing="1.6"
          >
            RECORD
          </text>
        </svg>
      ) : null}

      {size.w > 0
        ? SITES.map((site) => {
            const selected = state.selectedSite === site.id;
            const sealed = state.quarantined.includes(site.id);
            const list = filings(site.id);
            const order = list.reduce((m, f) => Math.max(m, f.order), 0);
            const captured = state.world.familyCapture[site.id];
            const isLive = live.has(site.id);
            const status = sealed
              ? "sealed"
              : isLive
                ? "has work for the selected scanner"
                : "nothing for the selected scanner";
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => selectSite(site.id)}
                aria-pressed={selected}
                data-tour={`site-${site.id}`}
                aria-label={`${site.name}. ${list.length} ${list.length === 1 ? "filing" : "filings"}${order ? `, deepest order ${order}` : ""}. ${status}${captured ? ". Family capture" : ""}.`}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 outline-none"
                style={{ left: pos[site.id].x, top: pos[site.id].y }}
              >
                <span className="relative grid size-12 place-items-center">
                  {isLive && !selected ? (
                    <span
                      aria-hidden
                      className="absolute inset-0 animate-ping-soft rounded-full bg-accent/25"
                    />
                  ) : null}
                  {fresh && fresh.siteId === site.id ? (
                    <span
                      key={fresh.id}
                      aria-hidden
                      className="absolute inset-0 animate-sweep rounded-full border border-accent"
                    />
                  ) : null}
                  {lastCross && lastCross.siteId === site.id && lastCross.hour === state.hour ? (
                    <span
                      key={lastCross.id}
                      aria-hidden
                      className="absolute -inset-1 animate-sweep rounded-full border border-warn"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative grid size-12 place-items-center rounded-full transition-[background-color,box-shadow,opacity,transform] duration-200 ease-out",
                      "group-hover:scale-105 group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-ring",
                      selected
                        ? "bg-accent text-accent-fg shadow-[var(--shadow-glow)]"
                        : isLive
                          ? "bg-raised text-fg shadow-[0_0_0_1px_var(--color-accent)]"
                          : "bg-surface text-subtle shadow-[var(--shadow-border-hover)]",
                      !isLive && !selected && "opacity-75",
                    )}
                  >
                    {sealed ? (
                      <Lock className="size-4" aria-hidden />
                    ) : (
                      <span className="font-display text-lg leading-none tabular-nums">
                        {order || (isLive ? "·" : "–")}
                      </span>
                    )}
                    {captured ? (
                      <span
                        aria-hidden
                        title="Family capture"
                        className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-warn shadow-[0_0_0_3px_var(--color-surface)]"
                      />
                    ) : null}
                  </span>
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-center font-mono text-xs leading-tight whitespace-nowrap transition-colors",
                    selected ? "bg-accent/10 text-fg" : isLive ? "text-fg" : "text-subtle",
                  )}
                >
                  {site.short}
                  {list.length ? (
                    <span className="ml-1 text-subtle tabular-nums">{list.length}</span>
                  ) : null}
                </span>
              </button>
            );
          })
        : null}
    </div>
  );
}

export function MapLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-subtle">
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-raised shadow-[0_0_0_1px_var(--color-accent)]" />
        Has work
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-surface opacity-60 shadow-[var(--shadow-border-hover)]" />
        Refuses
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-warn" />
        Family capture
      </li>
      <li className="flex items-center gap-1.5">
        <span className="font-display text-sm leading-none text-fg">3</span>
        Deepest order filed
      </li>
    </ul>
  );
}
