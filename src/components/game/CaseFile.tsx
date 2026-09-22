import { useState } from "react";
import { AGENTS, QUESTIONS } from "@/game/data";
import { MAX_CITES, footnotes } from "@/game/engine";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";
import type { CrossNote, Finding } from "@/game/types";
import { Footnote } from "./Footnote";

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
      className="mt-3 border-t border-border pt-3"
    >
      <p className="mb-2 text-xs text-muted">Cite in the brief for</p>
      <div className="grid grid-cols-4 gap-1.5">
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
                "inline-flex h-9 min-w-0 items-center justify-center gap-0.5 rounded-full px-2 text-xs font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
                on
                  ? "bg-accent text-accent-fg"
                  : "text-fg shadow-[var(--shadow-border)] hover:bg-raised hover:shadow-[var(--shadow-border-hover)]",
                full && "text-muted opacity-60 hover:bg-transparent",
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

export function FindingCard({
  finding,
  open = false,
  citable = true,
}: {
  finding: Finding;
  open?: boolean;
  citable?: boolean;
}) {
  const [show, setShow] = useState(open);
  const agent = AGENTS.find((a) => a.id === finding.agentId);
  return (
    <li className="rounded-lg bg-raised p-3">
      <p className="font-mono text-xs text-muted">
        Hour {finding.hour} · order {finding.order} · {agent?.name ?? finding.agentId}
        {finding.contaminated ? <span className="text-warn"> · charitable tone</span> : null}
      </p>
      <p className="mt-1 text-sm font-medium text-fg">
        {finding.headline}
        <CitedMarks evidenceId={finding.id} />
      </p>
      {show ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted">{finding.body}</p>
          {citable ? <CiteBar evidenceId={finding.id} /> : null}
        </>
      ) : (
        <button
          type="button"
          className="mt-2 text-xs text-fg underline-offset-2 hover:underline"
          onClick={() => setShow(true)}
        >
          Read filing
        </button>
      )}
    </li>
  );
}

export function CrossCard({ note, citable = true }: { note: CrossNote; citable?: boolean }) {
  return (
    <li className="rounded-lg bg-raised p-3 shadow-[inset_2px_0_0_var(--color-warn)]">
      <p className="font-mono text-xs text-muted">Hour {note.hour} · cross-check</p>
      <p className="mt-1 text-sm font-medium text-fg">
        {note.headline}
        <CitedMarks evidenceId={note.id} />
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{note.body}</p>
      {citable ? <CiteBar evidenceId={note.id} /> : null}
    </li>
  );
}

export function CaseStrip({
  expanded = false,
  citable = true,
}: {
  expanded?: boolean;
  citable?: boolean;
}) {
  const state = useGame((s) => s.state)!;
  const items = [...state.findings].reverse();
  const crosses = [...state.crossNotes].reverse();
  const total = items.length + crosses.length;

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-xs tracking-widest text-muted uppercase">
        Case file · {total} {total === 1 ? "filing" : "filings"}
      </p>
      {total === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Empty. Scans land here. Read a filing, then cite it to the brief.
        </p>
      ) : (
        <ul
          className={cn(
            "mt-3 flex flex-col gap-3",
            !expanded && "max-h-96 overflow-y-auto overscroll-contain",
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
    </div>
  );
}
