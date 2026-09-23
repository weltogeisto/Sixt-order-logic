import { MAX_CITES, QUESTION_IDS, emptyBrief, worldForHour } from "./engine";
import type { BriefDraft, GameState, PlayTab, Screen } from "./types";

const KEY = "sixth-hour-v1";
/**
 * v3: the brief (draft answers + citations) lives on GameState.
 * v4: cross-checks record the filings they tested (`checks`).
 */
export const SAVE_VERSION = 4;
const VERSION = SAVE_VERSION;

export type SaveBlob = {
  version: number;
  screen: Screen;
  playTab: PlayTab;
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

/**
 * Bring any saved brief (or none, pre-v3) into shape and drop citations that
 * point at evidence no longer in the file.
 */
function migrateBrief(
  raw: unknown,
  answers: GameState["answers"],
  evidenceIds: Set<string>,
): BriefDraft {
  const brief = emptyBrief();
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<BriefDraft>;
  const src = r.answers ?? answers ?? {};
  for (const q of QUESTION_IDS) {
    const a = (src as Record<string, unknown>)[q];
    if (typeof a === "string" && a) brief.answers[q] = a;
    const list = Array.isArray(r.cites?.[q]) ? r.cites![q] : [];
    brief.cites[q] = [...new Set(list.filter((id) => evidenceIds.has(id)))].slice(0, MAX_CITES);
  }
  return brief;
}

function migrateState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<GameState> & { hourIntroSeen?: number };
  if (typeof s.hour !== "number") return null;
  const findings = s.findings ?? [];
  // Pre-v4 cross-checks did not record which filings they tested; assume
  // every filing on the site at or before the check's hour.
  const crossNotes = (s.crossNotes ?? []).map((c) =>
    Array.isArray(c.checks)
      ? c
      : {
          ...c,
          checks: findings
            .filter((f) => f.siteId === c.siteId && f.hour <= c.hour)
            .map((f) => f.id),
        },
  );
  const ids = new Set([...findings, ...crossNotes].map((e) => e.id));
  const answers = s.answers ?? null;
  return {
    hour: s.hour,
    ap: s.ap ?? 2,
    usedAgentsThisHour: s.usedAgentsThisHour ?? [],
    findings,
    crossNotes,
    quarantined: s.quarantined ?? [],
    selectedSite: s.selectedSite ?? "board",
    selectedAgent: s.selectedAgent ?? "census",
    log: s.log ?? [],
    world: s.world ?? worldForHour(s.hour),
    ended: Boolean(s.ended),
    answers,
    brief: migrateBrief(s.brief, answers, ids),
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
    const tabs: PlayTab[] = ["map", "agents", "brief", "file"];
    return {
      ...defaults,
      ...parsed,
      playTab: tabs.includes(parsed.playTab) ? parsed.playTab : "map",
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
