import { useEffect } from "react";
import { ArrowLeft, ArrowRight, GitCompare, Radar } from "lucide-react";
import { AGENTS, HOURS, HOW_TO, QUESTIONS } from "@/game/data";
import { useGame } from "@/game/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrderMark } from "./OrderMark";

export function Briefing() {
  const step = useGame((s) => s.briefingStep);
  const setStep = useGame((s) => s.setBriefingStep);
  const setScreen = useGame((s) => s.setScreen);
  const last = step >= HOW_TO.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (last) setScreen("play");
        else setStep(step + 1);
      } else if (e.key === "ArrowLeft" && step > 0) setStep(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last, setScreen, setStep, step]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-6 sm:px-10 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <ol className="flex gap-1.5" aria-label={`Step ${step + 1} of ${HOW_TO.length}`}>
          {HOW_TO.map((h, i) => (
            <li key={h.title}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-label={`Step ${i + 1}: ${h.title}`}
                aria-current={i === step ? "step" : undefined}
                className="grid h-6 place-items-center"
              >
                <span
                  className={cn(
                    "block h-1 rounded-full transition-[width,background-color] duration-300",
                    i === step ? "w-10 bg-accent" : i < step ? "w-6 bg-muted" : "w-6 bg-border",
                  )}
                />
              </button>
            </li>
          ))}
        </ol>
        <Button variant="ghost" size="sm" onClick={() => setScreen("play")}>
          Skip briefing
        </Button>
      </div>

      <div
        key={step}
        className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_1fr] lg:gap-16"
      >
        <div className="animate-rise">
          <p className="eyebrow">
            Briefing · {step + 1} of {HOW_TO.length}
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight text-fg sm:text-5xl">
            {HOW_TO[step].title}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {HOW_TO[step].body}
          </p>
        </div>
        <div className="animate-rise [animation-delay:120ms]">
          <Figure step={step} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep(Math.max(0, step - 1))}
        >
          <ArrowLeft />
          Back
        </Button>
        <p className="hidden text-xs text-subtle sm:block">
          Use <kbd className="rounded bg-raised px-1.5 py-0.5">←</kbd>{" "}
          <kbd className="rounded bg-raised px-1.5 py-0.5">→</kbd> to move
        </p>
        <Button
          size="lg"
          onClick={() => {
            if (last) setScreen("play");
            else setStep(step + 1);
          }}
        >
          {last ? "Enter the room" : "Continue"}
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

/** One real diagram per step, built from the game's own data. */
function Figure({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="panel p-5">
        <p className="eyebrow">Your day</p>
        <ol className="mt-4 flex flex-col">
          {HOURS.map((h) => (
            <li
              key={h.id}
              className="flex items-center gap-4 border-t border-border py-2.5 first:border-t-0"
            >
              <span className="w-12 font-mono text-sm tabular-nums text-fg">{h.clock}</span>
              <OrderMark order={h.order} size={22} />
              <span className="min-w-0 flex-1 truncate font-display text-lg text-fg">{h.name}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
          Then you file four answers: {QUESTIONS.map((q) => q.title).join(" · ")}.
        </p>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="panel flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Each hour</p>
          <span className="flex gap-1.5" aria-label="Two attention">
            <span className="size-3 rounded-full bg-accent shadow-[0_0_10px_0_var(--color-accent)]" />
            <span className="size-3 rounded-full bg-accent shadow-[0_0_10px_0_var(--color-accent)]" />
          </span>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex items-center gap-3 rounded-2xl bg-raised p-3">
            <Radar className="size-4 text-accent" aria-hidden />
            <span className="flex-1 text-fg">Scan a site</span>
            <span className="font-mono text-xs text-muted">1 attention</span>
          </li>
          <li className="flex items-center gap-3 rounded-2xl bg-raised p-3">
            <GitCompare className="size-4 text-warn" aria-hidden />
            <span className="flex-1 text-fg">Cross-check two filings</span>
            <span className="font-mono text-xs text-muted">1 attention</span>
          </li>
        </ul>
        <div className="rounded-2xl border border-dashed border-border p-3">
          <p className="text-xs text-muted">Cite in the brief for</p>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {QUESTIONS.map((q, i) => (
              <span
                key={q.id}
                className={cn(
                  "grid h-9 place-items-center rounded-full text-xs font-medium",
                  i === 0
                    ? "bg-accent text-accent-fg"
                    : "text-fg shadow-[var(--shadow-border-hover)]",
                )}
              >
                {q.short}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <ol className="panel flex flex-col p-3">
        {AGENTS.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
            <OrderMark order={a.order} size={30} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-fg">
                Order {a.order} · {a.name}
              </span>
              <span className="block truncate text-xs text-muted">{a.role}</span>
            </span>
            <span className="font-mono text-xs text-subtle tabular-nums">
              {HOURS[a.unlockHour - 1].clock}
            </span>
          </li>
        ))}
      </ol>
    );
  }
  const col = (family: "independent" | "sol") => (
    <div className="flex flex-col gap-2">
      <Badge tone={family === "sol" ? "warn" : "ok"} className="self-start">
        {family === "sol" ? "same-family" : "independent"}
      </Badge>
      {AGENTS.filter((a) => a.family === family).map((a) => (
        <div key={a.id} className="flex items-center gap-2.5 rounded-2xl bg-raised p-3">
          <OrderMark
            order={a.order}
            size={24}
            className={family === "sol" ? "text-warn" : undefined}
          />
          <span className="text-sm text-fg">{a.name}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="panel p-5">
      <div className="grid grid-cols-2 gap-4">
        {col("independent")}
        {col("sol")}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-warn/10 p-3 text-sm text-warn">
        <GitCompare className="size-4 shrink-0" aria-hidden />A same-family filing counts once a
        cross-check has tested it.
      </div>
    </div>
  );
}
