import { create } from "zustand";
import {
  advanceHour,
  assign,
  clearFlash,
  createInitialState,
  crossCheck,
  dismissIntro,
  draftAnswer,
  fileBrief,
  quarantine,
  toggleCite,
} from "./engine";
import { SAVE_VERSION, loadSave, writeSave, type SaveBlob } from "./save";
import type { AgentId, GameState, PlayTab, QuestionId, Screen, SiteId } from "./types";

const TUTORIAL_KEY = "sixth-hour-tutorial-done";

type GameStore = SaveBlob & {
  ready: boolean;
  /** Step of the practice hour, or null outside it. The practice run is never persisted. */
  tutorial: number | null;
  tutorialDone: boolean;
  startTutorial: () => void;
  setTutorialStep: (step: number) => void;
  endTutorial: (next: "begin" | "title") => void;
  returnTo: Screen;
  hydrate: () => void;
  persist: () => void;
  setScreen: (screen: Screen) => void;
  setPlayTab: (playTab: PlayTab) => void;
  setBriefingStep: (briefingStep: number) => void;
  begin: () => void;
  resume: () => void;
  patch: (fn: (s: GameState) => GameState) => void;
  selectSite: (siteId: SiteId) => void;
  selectAgent: (agentId: AgentId) => void;
  doAssign: () => void;
  doCross: () => void;
  doQuarantine: () => void;
  doAdvance: () => void;
  doDismissIntro: () => void;
  doClearFlash: () => void;
  doCite: (q: QuestionId, evidenceId: string) => void;
  doDraft: (q: QuestionId, optionId: string) => void;
  doFile: () => void;
  setBest: (n: number) => void;
  resetToTitle: () => void;
};

const empty: SaveBlob = {
  version: SAVE_VERSION,
  screen: "title",
  playTab: "map",
  briefingStep: 0,
  state: null,
  bestScore: 0,
};

function persistNow(get: () => GameStore) {
  // The practice hour lives in memory only; the real save stays untouched.
  if (get().tutorial !== null) return;
  const { screen, playTab, briefingStep, state, bestScore } = get();
  writeSave({ version: SAVE_VERSION, screen, playTab, briefingStep, state, bestScore });
}

export const useGame = create<GameStore>((set, get) => ({
  ...empty,
  ready: false,
  returnTo: "title",
  tutorial: null,
  tutorialDone: false,
  hydrate: () => {
    const loaded = loadSave();
    let tutorialDone = false;
    try {
      tutorialDone = localStorage.getItem(TUTORIAL_KEY) === "1";
    } catch {
      tutorialDone = false;
    }
    set({ ...loaded, ready: true, tutorialDone });
  },
  startTutorial: () => {
    persistNow(get);
    // Start on a dim site so the first lesson is choosing a bright one.
    set({
      tutorial: 0,
      screen: "play",
      playTab: "map",
      state: { ...createInitialState(), introOpen: false, selectedSite: "gym" },
    });
  },
  setTutorialStep: (tutorial) => set({ tutorial }),
  endTutorial: (next) => {
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {
      // Private mode: the practice hour just stays on offer.
    }
    set({ tutorial: null, tutorialDone: true });
    get().hydrate();
    if (next === "begin") get().begin();
    else get().setScreen("title");
  },
  persist: () => persistNow(get),
  setScreen: (screen) => {
    const cur = get().screen;
    set(screen === "codex" && cur !== "codex" ? { screen, returnTo: cur } : { screen });
    persistNow(get);
  },
  setPlayTab: (playTab) => {
    set({ playTab });
    persistNow(get);
  },
  setBriefingStep: (briefingStep) => set({ briefingStep }),
  begin: () => {
    set({
      screen: "briefing",
      briefingStep: 0,
      playTab: "map",
      state: createInitialState(),
    });
    persistNow(get);
  },
  resume: () => {
    const { state } = get();
    if (!state) return;
    set({ screen: state.ended ? "debrief" : "play" });
    persistNow(get);
  },
  patch: (fn) => {
    const { state } = get();
    if (!state) return;
    set({ state: fn(state) });
    persistNow(get);
  },
  selectSite: (siteId) => get().patch((s) => ({ ...s, selectedSite: siteId })),
  selectAgent: (agentId) => get().patch((s) => ({ ...s, selectedAgent: agentId })),
  doAssign: () => get().patch(assign),
  doCross: () => get().patch(crossCheck),
  doQuarantine: () => get().patch(quarantine),
  doAdvance: () => {
    get().patch(advanceHour);
    const { state } = get();
    if (state?.ended) {
      set({ screen: "debrief" });
      persistNow(get);
    }
  },
  doDismissIntro: () => get().patch(dismissIntro),
  doClearFlash: () => get().patch(clearFlash),
  doCite: (q, evidenceId) => get().patch((s) => toggleCite(s, q, evidenceId)),
  doDraft: (q, optionId) => get().patch((s) => draftAnswer(s, q, optionId)),
  doFile: () => {
    get().patch(fileBrief);
    set({ screen: "debrief" });
    persistNow(get);
  },
  setBest: (n) => {
    set({ bestScore: Math.max(get().bestScore, n) });
    persistNow(get);
  },
  resetToTitle: () => {
    const best = get().bestScore;
    set({ ...empty, bestScore: best, ready: true });
    persistNow(get);
  },
}));
