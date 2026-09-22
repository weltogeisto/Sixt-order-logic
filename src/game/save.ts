import { worldForHour } from "./engine";
import type { GameState, Screen } from "./types";

const KEY = "sixth-hour-v1";
const VERSION = 2;

export type SaveBlob = {
  version: number;
  screen: Screen;
  playTab: "map" | "agents" | "file";
  briefingStep: number;
  state: GameState | null;
  bestScore: number;
};

const defaults: SaveBlob = {
  version: VERSION,
  screen: "title",
  playTab: "map",
  briefingStep: 0,
  state: null,
  bestScore: 0,
};

function migrateState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<GameState> & { hourIntroSeen?: number };
  if (typeof s.hour !== "number") return null;
  return {
    hour: s.hour,
    ap: s.ap ?? 2,
    usedAgentsThisHour: s.usedAgentsThisHour ?? [],
    findings: s.findings ?? [],
    crossNotes: s.crossNotes ?? [],
    quarantined: s.quarantined ?? [],
    selectedSite: s.selectedSite ?? "board",
    selectedAgent: s.selectedAgent ?? "census",
    log: s.log ?? [],
    world: s.world ?? worldForHour(s.hour),
    ended: Boolean(s.ended),
    answers: s.answers ?? null,
    introOpen: Boolean(s.introOpen),
    flash: s.flash ?? null,
  };
}

export function loadSave(): SaveBlob {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as SaveBlob;
    if (!parsed) return { ...defaults };
    return {
      ...defaults,
      ...parsed,
      version: VERSION,
      state: migrateState(parsed.state),
    };
  } catch {
    return { ...defaults };
  }
}

export function writeSave(blob: SaveBlob) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...blob, version: VERSION }));
  } catch {
    /* private mode / quota */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
