import { useState } from "react";
import { ChevronDown, GitCompare } from "lucide-react";
import { AGENTS, HOURS, QUESTIONS, SITES } from "@/game/data";
import { MAX_CITES, footnotes, isCrossChecked, isSameFamily } from "@/game/engine";
import { useGame } from "@/game/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CrossNote, Finding } from "@/game/types";
import { Footnote } from "./Footnote";
import { OrderMark } from "./OrderMark";

/**
 * One row of toggles under an opened filing: which questions of the brief
 * this filing is cited for. Tapping a full question explains why (flash)
 * instead of silently doing nothing.
 */
export function CiteBar({ evidenceId }: { evidenceId: string }) {
  const state = useGame((s) => s.state);
  const doCite = useGame((s) => s.doCite);
  if (!state || state.answers) return null;
  const notes = footnotes(state.brief);
  const n = notes.get(evidenceId);

  return (
    <div
      role="group"
      aria-label="Cite this filing in the brief"
      data-tour="cite"
      className="mt-4 border-t border-border pt-3"
    >
      <p className="mb-2 text-xs text-muted">Cite in the brief for</p>
      <div className="grid grid-cols-2 gap-1.5 min-[420px]:grid-cols-4">
        {QUESTIONS.map((q) => {
          const list = state.brief.cites[q.id];
          const on = list.includes(evidenceId);
          const full = !on && list.length >= MAX_CITES;
          return (
            <button
              key={q.id}
              type="button"
              aria-pressed={on}
              aria-disabled={full || undefined}
              title={
                full
                  ? `${q.title} already cites ${MAX_CITES} filings`
                  : on
                    ? `Remove from ${q.title}`
                    : `Cite for ${q.title}: ${q.prompt}`
              }
              onClick={() => doCite(q.id, evidenceId)}
              className={cn(
                "inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97]",
                on
                  ? "bg-accent text-accent-fg"
                  : "text-fg shadow-[var(--shadow-border-hover)] hover:bg-overlay",
                full && "text-subtle shadow-[var(--shadow-border)] hover:bg-transparent",
              )}
            >
              {q.short}
              {on && n ? <Footnote n={n} inverse /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Where a filing is already cited, as footnote marks after its headline. */
function CitedMarks({ evidenceId }: { evidenceId: string }) {
  const state = useGame((s) => s.state);
  if (!state) return null;
  const n = footnotes(state.brief).get(evidenceId);
  if (!n) return null;
  const where = QUESTIONS.filter((q) => state.brief.cites[q.id].includes(evidenceId))
    .map((q) => q.title)
    .join(", ");
  return (
    <span className="ml-1 whitespace-nowrap" title={`Cited in ${where}`}>
      <Footnote n={n} />
      <span className="sr-only">, cited in {where}</span>
    </span>
  );
}

function siteShort(id: string) {
  return SITES.find((s) => s.id === id)?.short ?? id;
}

export function FindingCard({
  finding,
  open = false,
  citable = true,
}: {
  finding: Finding;
  open?: boolean;
  citable?: boolean;
}) {
  const state = useGame((s) => s.state);
  const [show, setShow] = useState(open);
  const agent = AGENTS.find((a) => a.id === finding.agentId);
  const sameFamily = isSameFamily(finding);
  const tested = state ? isCrossChecked(state, finding) : false;
  const isNew = !!state && finding.hour === state.hour && state.findings.at(-1)?.id === finding.id;

  return (
    <li
      className={cn(
        "animate-rise rounded-2xl bg-raised shadow-[var(--shadow-border)] transition-shadow",
        show ? "p-4" : "p-0",
      )}
    >
      <button
        type="button"
        aria-expanded={show}
        onClick={() => setShow((v) => !v)}
        className={cn(
          "flex w-full items-start gap-3 rounded-2xl text-left",
          !show && "p-4 hover:bg-overlay",
        )}
      >
        <OrderMark order={finding.order} size={30} className="mt-0.5" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-subtle">
            <span className="text-muted">{siteShort(finding.siteId)}</span>
            <span aria-hidden>·</span>
            <span>
              {agent?.name ?? finding.agentId} · order {finding.order}
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{HOURS[finding.hour - 1]?.clock}</span>
            {isNew ? (
              <span className="rounded-full bg-accent px-1.5 font-sans text-[0.625rem] leading-4 font-semibold tracking-wide text-accent-fg uppercase">
                New
              </span>
            ) : null}
          </span>
          <span className="mt-1 block font-display text-lg leading-snug text-fg">
            {finding.headline}
            <CitedMarks evidenceId={finding.id} />
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={sameFamily ? "warn" : "ok"}>
              {sameFamily ? "same-family" : "independent"}
            </Badge>
            {finding.contaminated ? <Badge tone="warn">charitable tone</Badge> : null}
            {sameFamily ? (
              <Badge tone="default" className="bg-bg/60">
                {tested ? "cross-checked" : "not cross-checked"}
              </Badge>
            ) : null}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "mt-1 size-4 shrink-0 text-subtle transition-transform duration-200",
            show && "rotate-180",
          )}
        />
        <span className="sr-only">{show ? "Collapse filing" : "Read filing"}</span>
      </button>
      {show ? (
        <div className="animate-rise pl-10.5">
          <p className="mt-3 text-sm leading-relaxed text-muted">{finding.body}</p>
          {citable ? <CiteBar evidenceId={finding.id} /> : null}
        </div>
      ) : null}
    </li>
  );
}

export function CrossCard({ note, citable = true }: { note: CrossNote; citable?: boolean }) {
  return (
    <li className="animate-rise rounded-2xl bg-raised p-4 shadow-[inset_3px_0_0_var(--color-warn),var(--shadow-border)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-7.5 shrink-0 place-items-center rounded-full bg-warn/15 text-warn">
          <GitCompare className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-subtle">
            <span className="text-muted">{siteShort(note.siteId)}</span> · cross-check ·{" "}
            <span className="tabular-nums">{HOURS[note.hour - 1]?.clock}</span>
          </p>
          <p className="mt-1 font-display text-lg leading-snug text-fg">
            {note.headline}
            <CitedMarks evidenceId={note.id} />
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{note.body}</p>
          {citable ? <CiteBar evidenceId={note.id} /> : null}
        </div>
      </div>
    </li>
  );
}

type Filter = "all" | "uncited" | "cited";

export function CaseStrip({
  expanded = false,
  citable = true,
}: {
  expanded?: boolean;
  citable?: boolean;
}) {
  const state = useGame((s) => s.state)!;
  const [filter, setFilter] = useState<Filter>("all");
  const notes = footnotes(state.brief);
  const keep = (id: string) =>
    filter === "all" ? true : filter === "cited" ? notes.has(id) : !notes.has(id);
  const items = [...state.findings].reverse().filter((f) => keep(f.id));
  const crosses = [...state.crossNotes].reverse().filter((c) => keep(c.id));
  const total = state.findings.length + state.crossNotes.length;
  const shown = items.length + crosses.length;

  return (
    <section aria-labelledby="case-file-title" className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="case-file-title" className="eyebrow">
          Case file · <span className="tabular-nums">{total}</span>{" "}
          {total === 1 ? "filing" : "filings"}
        </h2>
        {total > 0 ? (
          <div
            role="radiogroup"
            aria-label="Filter the case file"
            className="flex rounded-full bg-bg/60 p-0.5 shadow-[var(--shadow-border)]"
          >
            {(["all", "uncited", "cited"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-8 rounded-full px-3 text-xs font-medium capitalize transition-colors",
                  filter === f
                    ? "bg-raised text-fg shadow-[var(--shadow-border-hover)]"
                    : "text-muted hover:text-fg",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {total === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-6 text-center">
          <p className="text-sm text-muted">The file is empty.</p>
          <p className="mt-1 text-xs text-subtle">
            Scans land here. Open a filing, then cite it to the brief.
          </p>
        </div>
      ) : shown === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {filter === "cited" ? "Nothing cited yet." : "Every filing is cited."}
        </p>
      ) : (
        <ul
          className={cn(
            "scroll-quiet mt-4 flex flex-col gap-3",
            !expanded && "max-h-[32rem] overflow-y-auto overscroll-contain pr-1",
          )}
        >
          {crosses.map((c) => (
            <CrossCard key={c.id} note={c} citable={citable} />
          ))}
          {items.map((f) => (
            <FindingCard key={f.id} finding={f} open={expanded} citable={citable} />
          ))}
        </ul>
      )}
    </section>
  );
}
