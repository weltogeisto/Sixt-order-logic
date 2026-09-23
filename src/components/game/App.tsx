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

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
