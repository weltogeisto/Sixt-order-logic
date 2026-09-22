import { useEffect, useMemo } from "react";
import { Check, Minus } from "lucide-react";
import { briefProgress, scoreBrief } from "@/game/engine";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BriefEditor } from "./Brief";
import { CaseStrip } from "./CaseFile";
import { Footnote } from "./Footnote";
import { OrderMark } from "./OrderMark";

export function Debrief() {
  const state = useGame((s) => s.state);
  const doFile = useGame((s) => s.doFile);
  const begin = useGame((s) => s.begin);
  const setScreen = useGame((s) => s.setScreen);
  const setBest = useGame((s) => s.setBest);

  const filed = !!state?.answers;

  const card = useMemo(() => {
    if (!state?.answers) return null;
    return scoreBrief(state, state.answers);
  }, [state]);

  useEffect(() => {
    if (card) setBest(card.total);
  }, [card, setBest]);

  if (!state) return null;

  if (!filed) {
    const prog = briefProgress(state.brief);
    const remaining = 4 - prog.answered;
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-8 sm:px-8">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">
          21:00 · File · {prog.answered} of 4 answered
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-fg">The brief</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Four claims. Calibration beats bravado. Each answer should point to a filing that carries
          it — the case file is below if you want to cite more.
        </p>

        <div className="mt-10">
          <BriefEditor />
        </div>

        <section aria-label="Case file" className="mt-12 pb-28">
          <CaseStrip citable />
        </section>

        <div className="sticky bottom-0 z-10 -mx-5 flex flex-col gap-2 border-t border-border bg-bg/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:-mx-8 sm:px-8">
          <p className="text-xs text-muted" aria-live="polite">
            {!prog.complete
              ? `Answer ${remaining} more ${remaining === 1 ? "question" : "questions"} to submit.`
              : prog.uncitedAnswers > 0
                ? `${prog.uncitedAnswers} ${prog.uncitedAnswers === 1 ? "answer has" : "answers have"} no citation. You can still submit.`
                : "Every answer has a footnote. Ready to submit."}
          </p>
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setScreen("play")}>
              Return to the room
            </Button>
            <Button disabled={!prog.complete} onClick={doFile}>
              Submit brief
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-8 sm:px-8">
      <OrderMark order={6} size={56} />
      <p className="mt-6 font-mono text-xs tabular-nums tracking-widest text-muted uppercase">
        Score {card.total} / 100
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-fg">{card.rank}</h1>
      <p className="mt-3 text-base leading-relaxed text-muted">{card.summary}</p>

      <ul className="mt-10 flex flex-col gap-6">
        {card.perQuestion.map((q) => (
          <li key={q.id} className="border-t border-border pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl text-fg">{q.label}</h2>
              <span className="font-mono text-xs tabular-nums text-muted">
                {q.awarded}/{q.max}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{q.note}</p>
            {q.cites.length ? (
              <ol className="mt-3 flex flex-col gap-2" aria-label={`Citations for ${q.label}`}>
                {q.cites.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-3 rounded-lg bg-surface px-3 py-2.5"
                  >
                    <Footnote n={c.n} className="mt-1 text-base" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-fg">{c.headline}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                        {c.excerpt}
                      </span>
                      <span className="mt-1 block font-mono text-xs text-subtle">
                        {c.meta}
                        {c.charitable ? (
                          <span className="text-warn"> · charitable tone</span>
                        ) : null}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium",
                        c.holds ? "text-ok" : "text-danger",
                      )}
                    >
                      {c.holds ? <Check className="size-3.5" /> : <Minus className="size-3.5" />}
                      {c.holds ? "Holds" : c.unchecked ? "Unchecked · −3" : "No claim · −3"}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-xs text-muted">No citation.</p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">Lessons</p>
        <ul className="mt-3 flex flex-col gap-3">
          {card.lessons.map((l) => (
            <li key={l} className="text-sm leading-relaxed text-fg">
              {l}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 mb-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={begin}>Investigate again</Button>
        <Button variant="secondary" onClick={() => setScreen("codex")}>
          Open the codex
        </Button>
        <Button variant="ghost" onClick={() => setScreen("title")}>
          Title
        </Button>
      </div>
    </div>
  );
}
