import { HOW_TO } from "@/game/data";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { OrderMark } from "./OrderMark";
import { cn } from "@/lib/utils";
import type { Order } from "@/game/types";

export function Briefing() {
  const step = useGame((s) => s.briefingStep);
  const setStep = useGame((s) => s.setBriefingStep);
  const setScreen = useGame((s) => s.setScreen);
  const last = step >= HOW_TO.length - 1;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-8 sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <ol className="flex gap-1.5" aria-label={`Step ${step + 1} of ${HOW_TO.length}`}>
          {HOW_TO.map((_, i) => (
            <li
              key={i}
              className={cn(
                "h-1 w-8 rounded-full",
                i === step ? "bg-accent" : i < step ? "bg-muted" : "bg-raised",
              )}
            />
          ))}
        </ol>
        <button
          type="button"
          className="font-mono text-xs text-subtle hover:text-fg"
          onClick={() => setScreen("play")}
        >
          Skip
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6 py-16">
        <OrderMark order={(step + 1) as Order} size={56} />
        <h2 className="font-display text-3xl tracking-tight text-fg sm:text-4xl">
          {HOW_TO[step].title}
        </h2>
        <p className="max-w-xl text-base leading-relaxed text-muted">
          {HOW_TO[step].body}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep(Math.max(0, step - 1))}
        >
          Back
        </Button>
        <Button
          onClick={() => {
            if (last) setScreen("play");
            else setStep(step + 1);
          }}
        >
          {last ? "Enter the room" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
