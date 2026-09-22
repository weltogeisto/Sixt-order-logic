import { useEffect, useMemo, useState } from "react";
import { AGENTS, QUESTIONS, SITES } from "@/game/data";
import { scoreBrief } from "@/game/engine";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BriefAnswers } from "@/game/types";
import { OrderMark } from "./OrderMark";

const EMPTY: BriefAnswers = {
  motive: "",
  tamper: "",
  observer: "",
  analysis: "",
};

export function Debrief() {
  const state = useGame((s) => s.state);
  const doFile = useGame((s) => s.doFile);
  const begin = useGame((s) => s.begin);
  const setScreen = useGame((s) => s.setScreen);
  const setBest = useGame((s) => s.setBest);
  const [draft, setDraft] = useState<BriefAnswers>(state?.answers ?? EMPTY);
  const [showFile, setShowFile] = useState(false);

  const filed = !!state?.answers;
  const answered = QUESTIONS.filter((q) => draft[q.id]).length;
  const complete = answered === QUESTIONS.length;

  const card = useMemo(() => {
    if (!state?.answers) return null;
    return scoreBrief(state, state.answers);
  }, [state]);

  useEffect(() => {
    if (card) setBest(card.total);
  }, [card, setBest]);

  if (!state) return null;

  if (!filed) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-8 sm:px-8">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">
          21:00 · File · {answered} of 4
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-fg">
          The brief
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Four claims. Calibration beats bravado. You can still return to the
          room and scan.
        </p>

        <button
          type="button"
          className="mt-4 text-left text-sm text-fg underline-offset-2 hover:underline"
          onClick={() => setShowFile((v) => !v)}
        >
          {showFile ? "Hide case file" : `Review case file (${state.findings.length})`}
        </button>
        {showFile ? (
          <ul className="mt-3 max-h-80 overflow-y-auto rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            {state.crossNotes.map((c) => (
              <li key={c.id} className="mb-3 border-l border-warn pl-3">
                <p className="text-sm font-medium text-fg">{c.headline}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{c.body}</p>
              </li>
            ))}
            {state.findings.map((f) => {
              const site = SITES.find((s) => s.id === f.siteId);
              const agent = AGENTS.find((a) => a.id === f.agentId);
              return (
                <li key={f.id} className="mb-3 border-l border-border pl-3 last:mb-0">
                  <p className="font-mono text-xs text-subtle">
                    {site?.short} · {agent?.name} · order {f.order}
                    {f.contaminated ? " · charitable" : ""}
                  </p>
                  <p className="text-sm text-fg">{f.headline}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{f.body}</p>
                </li>
              );
            })}
            {state.findings.length === 0 ? (
              <li className="text-sm text-subtle">The file is empty.</li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-10 flex flex-col gap-10 pb-24">
          {QUESTIONS.map((q) => (
            <fieldset key={q.id}>
              <legend className="font-display text-xl text-fg">{q.title}</legend>
              <p className="mt-1 mb-3 text-sm text-muted">{q.prompt}</p>
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => {
                  const on = draft[q.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, [q.id]: opt.id })}
                      className={cn(
                        "rounded-xl px-4 py-3 text-left text-sm leading-relaxed shadow-[var(--shadow-border)]",
                        on ? "bg-accent text-accent-fg" : "bg-surface text-fg",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border bg-bg/95 py-3">
          <Button variant="ghost" onClick={() => setScreen("play")}>
            Return to the room
          </Button>
          <Button disabled={!complete} onClick={() => doFile(draft)}>
            Submit brief
          </Button>
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
      <h1 className="mt-2 font-display text-4xl tracking-tight text-fg">
        {card.rank}
      </h1>
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
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">
          Lessons
        </p>
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
