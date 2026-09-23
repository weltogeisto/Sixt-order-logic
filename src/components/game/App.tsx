import { useEffect } from "react";
import { useGame } from "@/game/store";
import { Briefing } from "./Briefing";
import { CodexView } from "./CodexView";
import { Debrief } from "./Debrief";
import { PlayShell } from "./PlayShell";
import { TitleScreen } from "./TitleScreen";

export function App() {
  const screen = useGame((s) => s.screen);
  const hydrate = useGame((s) => s.hydrate);
  const persist = useGame((s) => s.persist);
  const hour = useGame((s) => s.state?.hour ?? null);
  const filed = useGame((s) => Boolean(s.state?.answers));

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // The sky follows the clock during a run; title and Codex sit at night.
  useEffect(() => {
    const root = document.documentElement;
    const inRun = screen === "play" || screen === "briefing" || screen === "debrief";
    const h = !inRun || hour === null ? null : filed ? 6 : hour;
    if (h === null) delete root.dataset.hour;
    else root.dataset.hour = String(h);
  }, [screen, hour, filed]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", persist);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", persist);
    };
  }, [persist]);

  if (screen === "briefing") return <Briefing />;
  if (screen === "play") return <PlayShell />;
  if (screen === "debrief") return <Debrief />;
  if (screen === "codex") return <CodexView />;
  return <TitleScreen />;
}
