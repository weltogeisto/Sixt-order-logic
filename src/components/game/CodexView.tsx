import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { CODEX, HOURS } from "@/game/data";
import { useGame } from "@/game/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrderMark } from "./OrderMark";

export function CodexView() {
  const setScreen = useGame((s) => s.setScreen);
  const returnTo = useGame((s) => s.returnTo);
  const [active, setActive] = useState(CODEX[0].id);
  const back = () => setScreen(returnTo === "codex" ? "title" : returnTo);

  // Track the section in view for the index.
  useEffect(() => {
    const els = CODEX.map((c) => document.getElementById(`codex-${c.id}`)).filter(
      Boolean,
    ) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id.replace("codex-", ""));
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const jump = (id: string) => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(`codex-${id}`)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="flex min-h-dvh w-full flex-col">
      <div className="sticky top-0 z-20 border-b border-border/60 bg-bg/75 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-10">
          <Button variant="ghost" onClick={back}>
            <ArrowLeft />
            {returnTo === "play"
              ? "Back to the room"
              : returnTo === "debrief"
                ? "Back to the brief"
                : "Back"}
          </Button>
          <span className="eyebrow">Codex</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-10">
        <header className="mt-10 mb-10 max-w-2xl">
          <p className="eyebrow">Typical concepts</p>
          <h1 className="mt-2 font-display text-5xl tracking-tight text-fg sm:text-6xl">Codex</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Orders of logic, six hours of the day, and the game theory of a self-produced record.
          </p>
        </header>

        <ol className="mb-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {HOURS.map((h) => (
            <li key={h.id} className="panel p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tabular-nums text-muted">{h.clock}</span>
                <OrderMark order={h.order} size={22} />
              </div>
              <p className="mt-3 font-display text-lg leading-tight text-fg">{h.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-subtle">{h.incident}</p>
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 gap-10 pb-20 lg:grid-cols-[14rem_1fr] lg:gap-16">
          <nav aria-label="Codex sections" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <ol className="scroll-quiet -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
              {CODEX.map((c) => (
                <li key={c.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => jump(c.id)}
                    aria-current={active === c.id ? "location" : undefined}
                    className={cn(
                      "w-full rounded-full px-3.5 py-2 text-left text-sm whitespace-nowrap transition-colors lg:rounded-xl lg:whitespace-normal",
                      active === c.id
                        ? "bg-raised text-fg shadow-[var(--shadow-border-hover)]"
                        : "text-muted shadow-[var(--shadow-border)] hover:text-fg lg:shadow-none",
                    )}
                  >
                    <span className="hidden font-mono text-[0.6875rem] tracking-widest text-subtle uppercase lg:block">
                      {c.kicker}
                    </span>
                    {c.title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex max-w-2xl flex-col gap-16">
            {CODEX.map((section) => (
              <article key={section.id} id={`codex-${section.id}`} className="scroll-mt-24">
                <p className="eyebrow">{section.kicker}</p>
                <h2 className="mt-2 font-display text-3xl tracking-tight text-fg">
                  {section.title}
                </h2>
                <div className="mt-5 flex flex-col gap-4">
                  {section.body.map((p) => (
                    <p key={p.slice(0, 48)} className="text-base leading-relaxed text-muted">
                      {p}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
