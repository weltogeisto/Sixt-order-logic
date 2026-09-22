import { SITE_LINKS, SITES } from "@/game/data";
import { hasNewWork } from "@/game/findings";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";
import type { SiteId } from "@/game/types";

export function SiteMap() {
  const state = useGame((s) => s.state);
  const selectSite = useGame((s) => s.selectSite);
  if (!state) return null;

  const pos = Object.fromEntries(SITES.map((s) => [s.id, s])) as Record<
    SiteId,
    (typeof SITES)[number]
  >;

  const maxOrder = (id: SiteId) => {
    const list = state.findings.filter((f) => f.siteId === id);
    return list.reduce((m, f) => Math.max(m, f.order), 0);
  };

  return (
    <div className="relative h-56 w-full lg:aspect-square lg:h-auto">
      <svg
        viewBox="0 0 100 100"
        className="size-full text-border"
        role="img"
        aria-label="Incident surface"
      >
        {SITE_LINKS.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={pos[a].x}
            y1={pos[a].y}
            x2={pos[b].x}
            y2={pos[b].y}
            stroke="currentColor"
            strokeWidth="0.35"
          />
        ))}
        <circle
          cx="50"
          cy="50"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          opacity="0.7"
        />
        <text
          x="50"
          y="51.2"
          textAnchor="middle"
          fill="currentColor"
          className="text-subtle"
          fontSize="2.2"
          letterSpacing="0.18"
        >
          RECORD
        </text>
      </svg>

      {SITES.map((site) => {
        const selected = state.selectedSite === site.id;
        const sealed = state.quarantined.includes(site.id);
        const order = maxOrder(site.id);
        const captured = state.world.familyCapture[site.id];
        const live =
          !!state.selectedAgent &&
          hasNewWork(state.world, site.id, state.selectedAgent, state.findings);
        return (
          <button
            key={site.id}
            type="button"
            onClick={() => selectSite(site.id)}
            className="absolute flex min-w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: `${site.x}%`, top: `${site.y}%` }}
          >
            <span
              className={cn(
                "relative grid size-11 place-items-center rounded-full bg-surface transition-[box-shadow,background-color,color] duration-150",
                selected
                  ? "bg-accent text-accent-fg"
                  : "shadow-[var(--shadow-border)]",
                sealed && !selected && "opacity-50",
                !live && !selected && !sealed && "opacity-40",
                live && !selected && "shadow-[var(--shadow-border-hover)]",
              )}
            >
              <span className="font-mono text-xs tabular-nums">
                {order || (live ? "·" : "–")}
              </span>
              {captured ? (
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-warn" />
              ) : null}
            </span>
            <span
              className={cn(
                "max-w-20 text-center font-mono text-xs leading-tight text-muted",
                selected && "text-fg",
                live && !selected && "text-fg",
              )}
            >
              {site.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}
