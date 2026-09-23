import { useState } from "react";
import { BookOpen, Clock, Play } from "lucide-react";
import { APP_NAME } from "@/game/data";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-between px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-widest text-muted uppercase">
          Independent brief
        </span>
        {bestScore > 0 ? (
          <span className="font-mono text-xs tabular-nums text-muted">
            Best {bestScore}
          </span>
        ) : (
          <span className="font-mono text-xs text-subtle">Simulation</span>
        )}
      </header>

      <div className="flex flex-1 flex-col items-start justify-center gap-8 py-12">
        <OrderMark order={6} size={72} />
        <div className="max-w-xl">
          <h1 className="font-display text-5xl leading-none tracking-tight text-fg sm:text-7xl">
            {APP_NAME}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Six hours. Six orders of logic. Reconstruct the Hugging Face
            incident without trusting a record that wrote itself.
          </p>
        </div>
        <blockquote className="max-w-lg border-l border-border pl-4 font-display text-lg leading-snug text-fg/90 italic">
          We cannot rule out that the analysis model lied.
        </blockquote>
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:flex-wrap">
          {canResume ? (
            <Button className="w-full sm:w-auto" onClick={resume}>
              <Clock className="size-4" />
              Resume hour {state.hour}
            </Button>
          ) : null}
          <Button
            variant={canResume ? "secondary" : "default"}
            className="w-full sm:w-auto"
            onClick={start}
          >
            <Play className="size-4" />
            {canResume ? "New investigation" : "Begin investigation"}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setScreen("codex")}
          >
            <BookOpen className="size-4" />
            Codex
          </Button>
        </div>
      </div>

      <footer className="flex flex-col gap-1 text-xs text-subtle">
        <p>
          Inspired by METR and Redwood Research’s public investigation, 26
          August 2026. A teaching game — not their report.
        </p>
      </footer>

      {confirmNew ? (
        <div className="fixed inset-0 z-30 grid place-items-end bg-bg/80 p-4 sm:place-items-center">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-[var(--shadow-border-hover)]">
            <h2 className="font-display text-2xl text-fg">Replace the open run?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              You have an investigation in hour {state?.hour}. Starting over
              discards that file.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmNew(false)}>
                Keep it
              </Button>
              <Button
                onClick={() => {
                  setConfirmNew(false);
                  begin();
                }}
              >
                Start over
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
