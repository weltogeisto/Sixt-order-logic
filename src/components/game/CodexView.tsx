import { ArrowLeft } from "lucide-react";
import { CODEX, HOURS } from "@/game/data";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { OrderMark } from "./OrderMark";

export function CodexView() {
  const setScreen = useGame((s) => s.setScreen);
  const returnTo = useGame((s) => s.returnTo);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-8 sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setScreen(returnTo === "codex" ? "title" : returnTo)}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <span className="font-mono text-xs tracking-widest text-muted uppercase">
          Game info
        </span>
      </div>

      <header className="mt-10 mb-12">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">
          Typical concepts
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-fg sm:text-5xl">
          Codex
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Orders of logic, six hours of the day, and the game theory of a
          self-produced record.
        </p>
      </header>

      <ol className="mb-16 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {HOURS.map((h) => (
          <li
            key={h.id}
            className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tabular-nums text-muted">
                {h.clock}
              </span>
              <OrderMark order={h.order} size={22} />
            </div>
            <p className="mt-3 font-display text-lg leading-tight text-fg">
              {h.name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-subtle">{h.incident}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-16 pb-16">
        {CODEX.map((section) => (
          <article key={section.id} className="max-w-2xl">
            <p className="font-mono text-xs tracking-widest text-muted uppercase">
              {section.kicker}
            </p>
            <h2 className="mt-2 font-display text-2xl tracking-tight text-fg">
              {section.title}
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {section.body.map((p) => (
                <p key={p.slice(0, 48)} className="text-sm leading-relaxed text-muted">
                  {p}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
