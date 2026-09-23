import { useEffect, useRef } from "react";
import { TUTORIAL } from "@/game/tutorial";
import { useGame } from "@/game/store";

function visible(el: Element) {
  return el.getClientRects().length > 0;
}

/**
 * Runs the practice hour: moves to the next step once the current one is
 * done, opens the phone view a step needs, and marks the one control the
 * step is about with `data-tour-active`. Mount once.
 */
export function useTutorialDriver() {
  const step = useGame((s) => s.tutorial);
  const state = useGame((s) => s.state);
  const setStep = useGame((s) => s.setTutorialStep);
  const setPlayTab = useGame((s) => s.setPlayTab);
  const scrolled = useRef<string | null>(null);

  // Advance past every step the player has already done, in order.
  useEffect(() => {
    if (step === null || !state) return;
    let next = step;
    while (next < TUTORIAL.length - 1 && TUTORIAL[next].done?.(state)) next++;
    if (next !== step) setStep(next);
  }, [step, state, setStep]);

  // Phones show one view at a time: open the one this step needs.
  useEffect(() => {
    if (step === null) return;
    const tab = TUTORIAL[step]?.tab;
    if (tab && !window.matchMedia("(min-width: 1024px)").matches) setPlayTab(tab);
    // Only on entering a step, so the player can still look around.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Highlight the target and bring it into view once per step and target.
  useEffect(() => {
    if (step === null || !state) return;
    const key = TUTORIAL[step]?.target?.(state) ?? null;
    const cleared = document.querySelectorAll("[data-tour-active]");
    cleared.forEach((el) => el.removeAttribute("data-tour-active"));
    if (!key) return;
    const el = [...document.querySelectorAll(`[data-tour="${key}"]`)].find(visible);
    if (!el) return;
    el.setAttribute("data-tour-active", "");
    const id = `${step}:${key}`;
    if (scrolled.current !== id) {
      scrolled.current = id;
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight - 200) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      }
    }
  });

  useEffect(
    () => () => {
      document
        .querySelectorAll("[data-tour-active]")
        .forEach((el) => el.removeAttribute("data-tour-active"));
    },
    [],
  );
}
