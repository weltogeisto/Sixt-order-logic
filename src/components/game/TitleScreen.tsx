import { useState } from "react";
import { ArrowRight, BookOpen, Play, RotateCcw } from "lucide-react";
import { APP_NAME, HOURS } from "@/game/data";
import { briefProgress } from "@/game/engine";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { Modal, ModalClose } from "@/components/ui/dialog";
import { OrderMark } from "./OrderMark";

export function TitleScreen() {
  const begin = useGame((s) => s.begin);
  const resume = useGame((s) => s.resume);
  const setScreen = useGame((s) => s.setScreen);
  const state = useGame((s) => s.state);
  const bestScore = useGame((s) => s.bestScore);
  const canResume = !!state && !state.ended;
  const [confirmNew, setConfirmNew] = useState(false);

  const start = () => {
    if (canResume) setConfirmNew(true);
    else begin();
  };

  const hour = canResume ? HOURS[state.hour - 1] : null;
  const prog = canResume ? briefProgress(state.brief) : null;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-10 sm:py-10">
      <header className="flex items-center justify-between">
        <span className="eyebrow">Independent brief · Simulation</span>
        {bestScore > 0 ? (
          <span className="rounded-full bg-surface/80 px-3 py-1 font-mono text-xs tabular-nums text-muted shadow-[var(--shadow-border)]">
            Best <span className="text-fg">{bestScore}</span>/100
          </span>
        ) : null}
      </header>

      <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="flex flex-col items-start">
          <OrderMark order={6} size={64} animate className="lg:hidden" />
          <h1 className="mt-8 animate-rise font-display text-6xl leading-[0.95] tracking-tight text-fg sm:text-8xl lg:mt-0">
            {APP_NAME}
          </h1>
          <p className="mt-6 max-w-md animate-rise text-lg leading-relaxed text-muted [animation-delay:80ms]">
            Six hours. Six orders of logic. Reconstruct the Hugging Face incident without trusting a
            record that wrote itself.
          </p>
          <blockquote className="mt-8 max-w-lg animate-rise border-l-2 border-accent/50 pl-4 font-display text-xl leading-snug text-fg/90 italic [animation-delay:160ms]">
            “We cannot rule out that the analysis model lied.”
          </blockquote>

          {canResume && hour && prog ? (
            <button
              type="button"
              onClick={resume}
              className="group mt-10 flex w-full max-w-md animate-rise items-center gap-4 rounded-3xl bg-surface/90 p-4 text-left shadow-[var(--shadow-panel)] transition-shadow [animation-delay:220ms] hover:shadow-[var(--shadow-glow)]"
            >
              <OrderMark order={hour.order} size={44} />
              <span className="min-w-0 flex-1">
                <span className="eyebrow block">Resume · {hour.clock}</span>
                <span className="mt-0.5 block truncate font-display text-xl text-fg">
                  {hour.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Hour {hour.id} of 6 · {state.findings.length}{" "}
                  {state.findings.length === 1 ? "filing" : "filings"} · brief {prog.ready}/4 ready
                </span>
              </span>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-5" aria-hidden />
              </span>
            </button>
          ) : null}

          <div className="mt-6 flex w-full max-w-md animate-rise flex-col gap-3 [animation-delay:260ms] sm:flex-row">
            <Button
              size="lg"
              variant={canResume ? "secondary" : "default"}
              className="w-full sm:w-auto"
              onClick={start}
            >
              {canResume ? <RotateCcw /> : <Play />}
              {canResume ? "New investigation" : "Begin investigation"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setScreen("codex")}
            >
              <BookOpen />
              Codex
            </Button>
          </div>
        </div>

        <div className="relative hidden aspect-square w-full max-w-md justify-self-center lg:block">
          <OrderMark
            order={6}
            size={440}
            animate
            className="absolute inset-[20%] size-[60%] text-accent/90"
          />
          <ol className="absolute inset-0 m-auto flex size-full items-center justify-center">
            {HOURS.map((h, i) => {
              const angle = -90 + i * 60;
              const rad = (angle * Math.PI) / 180;
              const cos = Math.cos(rad);
              // Anchor each label away from the dial, like numerals on a clock face.
              const tx = cos < -0.2 ? "-100%" : cos > 0.2 ? "0%" : "-50%";
              const side = cos < -0.2 ? "text-right" : cos > 0.2 ? "text-left" : "text-center";
              return (
                <li
                  key={h.id}
                  className={`absolute ${side}`}
                  style={{
                    left: `${50 + cos * 34}%`,
                    top: `${50 + Math.sin(rad) * 38}%`,
                    transform: `translate(${tx}, -50%)`,
                  }}
                >
                  <span
                    className="block animate-rise"
                    style={{ animationDelay: `${600 + i * 90}ms` }}
                  >
                    <span className="block font-mono text-xs tabular-nums text-fg">{h.clock}</span>
                    <span className="block text-xs whitespace-nowrap text-subtle">{h.name}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </main>

      <ol
        className="mb-8 grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-6 lg:hidden"
        aria-label="The six hours"
      >
        {HOURS.map((h) => (
          <li key={h.id} className="border-t border-border pt-2">
            <span className="block font-mono text-xs tabular-nums text-fg">{h.clock}</span>
            <span className="block text-xs leading-snug text-subtle">{h.name}</span>
          </li>
        ))}
      </ol>

      <footer className="text-xs leading-relaxed text-subtle">
        Inspired by METR and Redwood Research’s public investigation, 26 August 2026. A teaching
        game — not their report.
      </footer>

      <Modal
        open={confirmNew}
        onOpenChange={setConfirmNew}
        title="Replace the open run?"
        description={`You have an investigation open at ${hour?.clock ?? ""}. Starting over discards that file.`}
      >
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ModalClose asChild>
            <Button variant="ghost">Keep it</Button>
          </ModalClose>
          <Button
            onClick={() => {
              setConfirmNew(false);
              begin();
            }}
          >
            Start over
          </Button>
        </div>
      </Modal>
    </div>
  );
}
