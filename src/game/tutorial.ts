import { QUESTION_IDS } from "./engine";
import type { GameState, PlayTab } from "./types";

/**
 * The practice hour: one verb per step, on the real engine, never saved or
 * scored. Steps teach what the buttons do — never which filing answers which
 * question (handover rule 9).
 *
 * `target` names a `data-tour` hook to highlight. `done` moves the lesson on
 * by itself once the player has done the thing; steps without `done` wait
 * for a Next button.
 */
export type TutorialStep = {
  title: string;
  body: string;
  target?: (s: GameState) => string | null;
  done?: (s: GameState) => boolean;
  /** Phones show one view at a time; open the one this step needs. */
  tab?: PlayTab;
};

const citedAny = (s: GameState) => QUESTION_IDS.some((q) => s.brief.cites[q].length > 0);
const draftedAny = (s: GameState) => QUESTION_IDS.some((q) => Boolean(s.brief.answers[q]));
const onBoard = (s: GameState) => s.findings.filter((f) => f.siteId === "board").length;

export const TUTORIAL: TutorialStep[] = [
  {
    title: "A practice hour",
    body: "This run is for learning the moves. Nothing here is saved or scored, and your real investigation stays where you left it.",
  },
  {
    title: "Find a bright site",
    body: "Gym is dim: Census has nothing to read there. Bright sites have work for the selected scanner. Pick the Board.",
    target: () => "site-board",
    done: (s) => s.selectedSite === "board",
    tab: "map",
  },
  {
    title: "Scan it",
    body: "A scan spends one attention and puts a filing in the case file. You have two attention each hour.",
    target: () => "scan",
    done: (s) => s.findings.length >= 1,
    tab: "map",
  },
  {
    title: "Cite what you read",
    body: "Open the filing and cite it to a question. Footnotes are what the brief is scored on. In a real run, a citation that carries none of the question’s claims costs 3 — here, any question will do.",
    target: () => "cite",
    done: citedAny,
    tab: "map",
  },
  {
    title: "Spend your last attention",
    body: "Pick another bright site and scan it. Unspent attention does not carry over.",
    target: (s) => (s.selectedSite === "board" ? "site-cluster" : "scan"),
    done: (s) => s.findings.length >= 2,
    tab: "map",
  },
  {
    title: "Move the clock",
    body: "Attention is spent. Each hour unlocks one more order of logic — the next one reads beliefs, not only events.",
    target: () => "advance",
    done: (s) => s.hour >= 2,
  },
  {
    title: "Read the hour card",
    body: "Every hour opens with what just happened and the question this order can see. Close it to reach the surface.",
    done: (s) => s.hour >= 2 && !s.introOpen,
  },
  {
    title: "Read the same site again",
    body: "Intent is selected: it reads what the agents believed. Scan the Board a second time — a different order sees a different object.",
    target: (s) => (s.selectedSite === "board" ? "scan" : "site-board"),
    done: (s) => onBoard(s) >= 2,
    tab: "map",
  },
  {
    title: "Cross-check",
    body: "Two filings on one site can be set against each other for one attention. From 15:00, same-family scanners join — their filings only count in the brief once a cross-check has tested them.",
    target: () => "cross",
    done: (s) => s.crossNotes.length >= 1,
    tab: "map",
  },
  {
    title: "Draft an answer",
    body: "Open the brief and pick an answer to any question. Answers stay drafts until you file at 21:00, so change them as the file grows.",
    target: () => "brief",
    done: draftedAny,
  },
  {
    title: "That is the loop",
    body: "Scan bright sites, cite what holds, cross-check what a cousin of the subject tells you, and file at 21:00. The real run starts at 06:00 with a clean file.",
  },
];
