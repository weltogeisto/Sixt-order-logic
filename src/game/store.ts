import { create } from "zustand";
import {
  advanceHour,
  assign,
  clearFlash,
  createInitialState,
  crossCheck,
  dismissIntro,
  fileBrief,
  quarantine,
} from "./engine";
import { loadSave, writeSave, type SaveBlob } from "./save";
import type { AgentId, BriefAnswers, GameState, PlayTab, Screen, SiteId } from "./types";

type GameStore = SaveBlob & {
  ready: boolean;
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
  doFile: (answers: BriefAnswers) => void;
  setBest: (n: number) => void;
  resetToTitle: () => void;
};

const empty: SaveBlob = {
  version: 2,
  screen: "title",
  playTab: "map",
  briefingStep: 0,
  state: null,
  bestScore: 0,
};

function persistNow(get: () => GameStore) {
  const { screen, playTab, briefingStep, state, bestScore } = get();
  writeSave({ version: 2, screen, playTab, briefingStep, state, bestScore });
}

export const useGame = create<GameStore>((set, get) => ({
  ...empty,
  ready: false,
  returnTo: "title",
  hydrate: () => {
    const loaded = loadSave();
    set({ ...loaded, ready: true });
  },
  persist: () => persistNow(get),
  setScreen: (screen) => {
    const cur = get().screen;
    set(
      screen === "codex" && cur !== "codex"
        ? { screen, returnTo: cur }
        : { screen },
    );
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
  doFile: (answers) => {
    get().patch((s) => fileBrief(s, answers));
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
