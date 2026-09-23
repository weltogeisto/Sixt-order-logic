import { ArrowRight, GraduationCap, X } from "lucide-react";
import { TUTORIAL } from "@/game/tutorial";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The coach card. Takes the guide line's place while the practice hour runs. */
export function Coach({ compact = false, className }: { compact?: boolean; className?: string }) {
  const step = useGame((s) => s.tutorial);
  const setStep = useGame((s) => s.setTutorialStep);
  const endTutorial = useGame((s) => s.endTutorial);
  if (step === null) return null;
  const def = TUTORIAL[step];
  const last = step === TUTORIAL.length - 1;
  const waiting = Boolean(def.done);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex gap-3 rounded-2xl bg-accent/[0.08] shadow-[0_0_0_1px_rgba(223,228,212,0.28)]",
        compact ? "flex-col px-3.5 py-3" : "items-start px-4 py-3.5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-accent text-accent-fg">
          <GraduationCap className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">
            Practice · {step + 1} of {TUTORIAL.length}
          </p>
          <p className="mt-0.5 font-display text-lg leading-snug text-fg">{def.title}</p>
          <p className={cn("mt-1 text-sm leading-relaxed text-muted", compact && "text-xs")}>
            {def.body}
          </p>
        </div>
        {!last ? (
          <button
            type="button"
            onClick={() => endTutorial("title")}
            aria-label="Leave the practice hour"
            className="grid size-8 shrink-0 place-items-center rounded-full text-subtle hover:bg-raised hover:text-fg"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <div className={cn("flex shrink-0 items-center gap-2", compact && "justify-end")}>
        {last ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => endTutorial("title")}>
              Title
            </Button>
            <Button size="sm" onClick={() => endTutorial("begin")}>
              Start the real run
              <ArrowRight />
            </Button>
          </>
        ) : waiting ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-subtle">
            <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-accent" />
            Your move
          </span>
        ) : (
          <Button size="sm" onClick={() => setStep(step + 1)}>
            Next
            <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
