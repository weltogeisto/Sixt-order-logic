import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Check, Copy, Home, Minus, RotateCcw, Send } from "lucide-react";
import { APP_NAME } from "@/game/data";
import { briefProgress, scoreBrief } from "@/game/engine";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BriefEditor, BriefMeter } from "./Brief";
import { CaseStrip } from "./CaseFile";
import { Footnote } from "./Footnote";
import { OrderMark } from "./OrderMark";

function useCountUp(target: number, ms = 1100) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

function ScoreDial({ total }: { total: number }) {
  const shown = useCountUp(total);
  const r = 70;
  const len = 2 * Math.PI * r;
  return (
    <div className="relative grid size-44 shrink-0 place-items-center">
      <svg viewBox="0 0 160 160" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - shown / 100)}
        />
      </svg>
      <div className="text-center">
        <span className="block font-display text-6xl leading-none tabular-nums text-fg">
          {shown}
        </span>
        <span className="mt-1 block font-mono text-xs text-subtle">of 100</span>
      </div>
    </div>
  );
}

export function Debrief() {
  const state = useGame((s) => s.state);
  const doFile = useGame((s) => s.doFile);
  const begin = useGame((s) => s.begin);
  const setScreen = useGame((s) => s.setScreen);
  const setBest = useGame((s) => s.setBest);
  const bestScore = useGame((s) => s.bestScore);
  const [copied, setCopied] = useState(false);
  const [bestBefore] = useState(bestScore);

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
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-10 sm:py-10">
        <Button variant="ghost" className="self-start" onClick={() => setScreen("play")}>
          <ArrowLeft />
          Return to the room
        </Button>
        <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">21:00 · File</p>
            <h1 className="mt-2 font-display text-5xl tracking-tight text-fg">The brief</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              Four claims. Calibration beats bravado. Each answer should point to a filing that
              carries it — the case file is here if you want to cite more.
            </p>
          </div>
          <BriefMeter ready={prog.ready} answered={prog.answered} />
        </header>

        <div className="mt-10 grid gap-10 pb-36 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <BriefEditor />
          </div>
          <section aria-label="Case file" className="lg:sticky lg:top-6 lg:self-start">
            <CaseStrip citable />
          </section>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/85 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <p className="text-sm text-muted" aria-live="polite">
              {!prog.complete
                ? `Answer ${remaining} more ${remaining === 1 ? "question" : "questions"} to submit.`
                : prog.uncitedAnswers > 0
                  ? `${prog.uncitedAnswers} ${prog.uncitedAnswers === 1 ? "answer has" : "answers have"} no citation. You can still submit.`
                  : "Every answer has a footnote. Ready to submit."}
            </p>
            <Button size="lg" disabled={!prog.complete} onClick={doFile}>
              <Send />
              Submit brief
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const share = `${APP_NAME} — ${card.total}/100 · ${card.rank}\n${card.perQuestion
    .map(
      (q) =>
        `${q.awarded === q.max ? "■" : q.awarded > 0 ? "▣" : "□"} ${q.label} ${q.awarded}/${q.max}`,
    )
    .join("\n")}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(share);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  const newBest = card.total > bestBefore && bestBefore > 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <ScoreDial total={card.total} />
        <div>
          <p className="eyebrow flex items-center justify-center gap-2 sm:justify-start">
            <OrderMark order={6} size={16} />
            Brief filed · 21:00
            {newBest ? (
              <span className="rounded-full bg-accent px-2 text-accent-fg">New best</span>
            ) : null}
          </p>
          <h1 className="mt-2 animate-rise font-display text-4xl tracking-tight text-fg sm:text-5xl">
            {card.rank}
          </h1>
          <p className="mt-3 animate-rise text-base leading-relaxed text-muted [animation-delay:100ms]">
            {card.summary}
          </p>
        </div>
      </header>

      <ol className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Score by question">
        {card.perQuestion.map((q) => (
          <li key={q.id} className="rounded-2xl bg-surface/80 p-3 shadow-[var(--shadow-border)]">
            <span className="block truncate text-xs text-muted">{q.label}</span>
            <span className="mt-1 block font-display text-2xl tabular-nums text-fg">
              {q.awarded}
              <span className="font-mono text-xs text-subtle">/{q.max}</span>
            </span>
            <span className="mt-2 block h-1 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full rounded-full bg-accent transition-[width] duration-700"
                style={{ width: `${(q.awarded / q.max) * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ol>

      <ul className="mt-8 flex flex-col gap-4">
        {card.perQuestion.map((q, i) => (
          <li
            key={q.id}
            className="panel animate-rise p-5"
            style={{ animationDelay: `${150 + i * 70}ms` }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl text-fg">{q.label}</h2>
              <span className="font-mono text-sm tabular-nums text-muted">
                {q.awarded}/{q.max}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{q.note}</p>
            {q.cites.length ? (
              <ol className="mt-4 flex flex-col gap-2" aria-label={`Citations for ${q.label}`}>
                {q.cites.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-3 rounded-xl bg-raised px-3.5 py-3"
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
                        "mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        c.holds ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger",
                      )}
                    >
                      {c.holds ? <Check className="size-3.5" /> : <Minus className="size-3.5" />}
                      {c.holds ? "Holds" : c.unchecked ? "Unchecked · −3" : "No claim · −3"}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-xs text-subtle">No citation.</p>
            )}
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-3xl bg-accent/[0.06] p-6 shadow-[0_0_0_1px_rgba(223,228,212,0.15)]">
        <p className="eyebrow">Lessons</p>
        <ul className="mt-4 flex flex-col gap-4">
          {card.lessons.map((l) => (
            <li key={l} className="flex gap-3 text-sm leading-relaxed text-fg">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
              {l}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button size="lg" onClick={begin}>
          <RotateCcw />
          Investigate again
        </Button>
        <Button size="lg" variant="secondary" onClick={copy} aria-live="polite">
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy result"}
        </Button>
        <Button size="lg" variant="outline" onClick={() => setScreen("codex")}>
          <BookOpen />
          Codex
        </Button>
        <Button size="lg" variant="ghost" onClick={() => setScreen("title")}>
          <Home />
          Title
        </Button>
      </div>
    </div>
  );
}
