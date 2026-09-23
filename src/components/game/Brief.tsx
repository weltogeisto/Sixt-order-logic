import { useEffect, useId, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { QUESTIONS } from "@/game/data";
import {
  MAX_CITES,
  briefProgress,
  evidenceById,
  evidenceExcerpt,
  evidenceMeta,
  footnotes,
  isCharitable,
  questionReady,
} from "@/game/engine";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuestionId } from "@/game/types";
import { Footnote } from "./Footnote";

function optionLabel(q: QuestionId, optionId?: string) {
  if (!optionId) return null;
  return QUESTIONS.find((x) => x.id === q)?.options.find((o) => o.id === optionId)?.label ?? null;
}

function statusLine(answered: boolean, cites: number) {
  const a = answered ? "Answered" : "No answer";
  const c = cites === 0 ? "no citation" : cites === 1 ? "1 citation" : `${cites} citations`;
  return `${a} · ${c}`;
}

/**
 * The brief on the desk: four clauses, always visible. Each clause shows
 * the drafted answer (or the question until there is one) and its
 * footnotes. The left rule encodes state: none → empty, muted → partly
 * written, accent → answered and cited.
 */
export function BriefPanel({ onOpen }: { onOpen: (q: QuestionId) => void }) {
  const state = useGame((s) => s.state)!;
  const { brief } = state;
  const notes = footnotes(brief);
  const prog = briefProgress(brief);
  const untouched = prog.answered === 0 && notes.size === 0;

  return (
    <section
      aria-labelledby="brief-panel-title"
      className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="brief-panel-title" className="font-display text-2xl tracking-tight text-fg">
          The brief
        </h2>
        <p className="text-sm tabular-nums text-muted">{prog.ready} of 4 ready</p>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {untouched
          ? "You file this at 21:00. Read a filing, then cite it to the question it answers."
          : "Draft answers any time. Citations are what the brief is scored on."}
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-2">
        {QUESTIONS.map((q) => {
          const cites = brief.cites[q.id];
          const answer = optionLabel(q.id, brief.answers[q.id]);
          const ready = questionReady(brief, q.id);
          const touched = Boolean(answer) || cites.length > 0;
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onOpen(q.id)}
                aria-label={`${q.title}. ${statusLine(Boolean(answer), cites.length)}. Open in the brief.`}
                className="group relative flex h-full w-full flex-col rounded-xl bg-raised py-3 pr-3 pl-4 text-left transition-shadow duration-150 hover:shadow-[var(--shadow-border-hover)]"
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-3 left-0 w-0.5 rounded-full transition-colors duration-200",
                    ready ? "bg-accent" : touched ? "bg-muted" : "bg-border",
                  )}
                />
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg leading-tight text-fg">{q.title}</span>
                  <span className="flex gap-1" aria-hidden>
                    {cites.map((id) => (
                      <Footnote key={id} n={notes.get(id) ?? 0} />
                    ))}
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-1 line-clamp-2 text-xs leading-relaxed",
                    answer ? "text-fg" : "text-muted",
                  )}
                >
                  {answer ?? q.prompt}
                </span>
                <span className="mt-auto pt-2 text-xs text-muted">
                  {statusLine(Boolean(answer), cites.length)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The full brief: each question with its options and its footnotes.
 * Used in the side sheet during play, the Brief tab on mobile, and the
 * filing screen at 21:00 — one editor, one vocabulary.
 */
export function BriefEditor({ focus }: { focus?: QuestionId }) {
  const state = useGame((s) => s.state)!;
  const doDraft = useGame((s) => s.doDraft);
  const doCite = useGame((s) => s.doCite);
  const uid = useId();
  const refs = useRef<Partial<Record<QuestionId, HTMLElement | null>>>({});
  const { brief } = state;
  const notes = footnotes(brief);
  const locked = Boolean(state.answers);

  useEffect(() => {
    if (!focus) return;
    const el = refs.current[focus];
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [focus]);

  return (
    <div className="flex flex-col gap-12">
      {QUESTIONS.map((q) => {
        const cites = brief.cites[q.id];
        const headingId = `${uid}-${q.id}-h`;
        return (
          <section
            key={q.id}
            ref={(el) => {
              refs.current[q.id] = el;
            }}
            aria-labelledby={headingId}
            className="scroll-mt-4"
          >
            <h3 id={headingId} className="font-display text-2xl tracking-tight text-fg">
              {q.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{q.prompt}</p>

            <fieldset className="mt-4" disabled={locked}>
              <legend className="sr-only">Your answer to: {q.prompt}</legend>
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => {
                  const on = brief.answers[q.id] === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-xl px-4 py-3 text-sm leading-relaxed transition-[background-color,box-shadow] duration-150",
                        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                        on
                          ? "bg-accent text-accent-fg"
                          : "bg-raised text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
                        locked && "cursor-default",
                      )}
                    >
                      <input
                        type="radio"
                        name={`${uid}-${q.id}`}
                        value={opt.id}
                        checked={on}
                        onChange={() => doDraft(q.id, opt.id)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 size-2.5 shrink-0 rounded-full",
                          on ? "bg-accent-fg" : "shadow-[inset_0_0_0_1px_var(--color-muted)]",
                        )}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-5">
              <p className="text-xs text-muted">
                Citations{" "}
                <span className="tabular-nums">
                  {cites.length}/{MAX_CITES}
                </span>
              </p>
              {cites.length ? (
                <ol className="mt-2 flex flex-col gap-2">
                  {cites.map((id) => {
                    const e = evidenceById(state, id);
                    if (!e) return null;
                    return (
                      <li
                        key={id}
                        className="flex items-start gap-3 rounded-lg bg-raised px-3 py-2.5"
                      >
                        <Footnote n={notes.get(id) ?? 0} className="mt-1.5 text-base" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-fg">{e.headline}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                            {evidenceExcerpt(e)}
                          </span>
                          <span className="mt-1 block font-mono text-xs text-subtle">
                            {evidenceMeta(e)}
                            {isCharitable(e) ? (
                              <span className="text-warn"> · charitable tone</span>
                            ) : null}
                          </span>
                        </span>
                        {!locked ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => doCite(q.id, id)}
                            aria-label={`Remove footnote ${notes.get(id)} from ${q.title}`}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  No citation yet. Open a filing in the case file and cite it for {q.title}.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Side sheet on desktop, full screen on small viewports. */
export function BriefDialog({ focus, onClose }: { focus: QuestionId | null; onClose: () => void }) {
  const state = useGame((s) => s.state);
  if (!state) return null;
  const prog = briefProgress(state.brief);

  return (
    <Dialog.Root open={focus !== null} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-bg/80 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-surface shadow-[var(--shadow-border-hover)] outline-none",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-8 data-[state=open]:fade-in-0 data-[state=open]:duration-200",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150",
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-border px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
            <div>
              <Dialog.Title className="font-display text-3xl tracking-tight text-fg">
                The brief
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">
                {prog.ready} of 4 ready. Answers stay drafts until you file at 21:00.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close the brief">
                <X />
              </Button>
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <BriefEditor focus={focus ?? undefined} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
