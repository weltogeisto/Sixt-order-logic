import { AGENTS, HOURS, QUESTIONS, SITES } from "./data";
import {
  composeCross,
  composeFinding,
  darkReason,
  hasNewWork,
} from "./findings";
import type {
  AgentId,
  BriefAnswers,
  GameState,
  ScoreCard,
  SiteId,
  World,
} from "./types";

const MAX_AP = 2;

const EMPTY_CAPTURE: Record<SiteId, boolean> = {
  board: false,
  gym: false,
  vault: false,
  runtime: false,
  perimeter: false,
  cluster: false,
};

export function worldForHour(hour: number): World {
  return {
    boardActive: hour >= 1,
    boardAgents: hour >= 1 ? 1200 : 0,
    messages: hour >= 1 ? 70000 : 0,
    cheatFound: hour >= 2,
    scorerWorkstreams: hour >= 3,
    tamperInterest: hour >= 3 ? 0.2 : 0,
    hfPivot: hour >= 4,
    attackers: hour >= 4 ? 700 : 0,
    spoofPackaged: hour >= 5,
    spoofRate: hour >= 5 ? 0.07 : 0,
    signedMessages: hour >= 6 ? 429 : hour >= 5 ? 80 : 0,
    massExit: hour >= 6,
    sameFamilyAnalysis: hour >= 4,
    familyCapture: {
      ...EMPTY_CAPTURE,
      cluster: hour >= 4,
      vault: hour >= 5,
      runtime: hour >= 5,
      perimeter: hour >= 5,
    },
  };
}

export function createInitialState(): GameState {
  return {
    hour: 1,
    ap: MAX_AP,
    usedAgentsThisHour: [],
    findings: [],
    crossNotes: [],
    quarantined: [],
    selectedSite: "board",
    selectedAgent: "census",
    log: [HOURS[0].event],
    world: worldForHour(1),
    ended: false,
    answers: null,
    introOpen: true,
    flash: null,
  };
}

export function isAgentUnlocked(id: AgentId, hour: number) {
  const agent = AGENTS.find((a) => a.id === id);
  return !!agent && hour >= agent.unlockHour;
}

export function assignBlock(
  state: GameState,
  agentId: AgentId | null,
  siteId: SiteId,
): string | null {
  if (!agentId) return "Select a scanner first";
  if (state.ended) return "The brief is closed";
  if (state.ap < 1) return "No attention left this hour";
  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent || !isAgentUnlocked(agentId, state.hour)) {
    return `${agent?.name ?? "This scanner"} unlocks in hour ${agent?.unlockHour ?? "?"}`;
  }
  if (state.quarantined.includes(siteId)) return "This site is sealed";
  const already = state.findings.some(
    (f) =>
      f.hour === state.hour && f.agentId === agentId && f.siteId === siteId,
  );
  if (already) return `${agent.name} already scanned this site this hour`;
  return darkReason(state.world, siteId, agentId, state.findings);
}

export function canAssign(state: GameState, agentId: AgentId, siteId: SiteId) {
  return assignBlock(state, agentId, siteId) === null;
}

export function agentSpent(state: GameState, agentId: AgentId) {
  return SITES.every(
    (s) =>
      state.quarantined.includes(s.id) ||
      !hasNewWork(state.world, s.id, agentId, state.findings),
  );
}

export function crossBlock(state: GameState, siteId: SiteId): string | null {
  if (state.ended) return "The brief is closed";
  if (state.ap < 1) return "No attention left this hour";
  if (state.quarantined.includes(siteId)) return "This site is sealed";
  const n = state.findings.filter((f) => f.siteId === siteId).length;
  if (n < 2) return "Need two scans on this site first";
  return null;
}

export function canCross(state: GameState, siteId: SiteId) {
  return crossBlock(state, siteId) === null;
}

export function quarantineBlock(state: GameState, siteId: SiteId): string | null {
  if (state.ended) return "The brief is closed";
  if (state.quarantined.includes(siteId)) return "Already sealed";
  return null;
}

export function canQuarantine(state: GameState, siteId: SiteId) {
  return quarantineBlock(state, siteId) === null;
}

export function dismissIntro(state: GameState): GameState {
  return { ...state, introOpen: false };
}

export function clearFlash(state: GameState): GameState {
  return { ...state, flash: null };
}

export function assign(state: GameState): GameState {
  const agentId = state.selectedAgent;
  const siteId = state.selectedSite;
  if (!agentId || !canAssign(state, agentId, siteId)) return state;
  const finding = composeFinding(
    state.world,
    state.hour,
    siteId,
    agentId,
    state.findings.length,
    state.findings,
  );
  const agent = AGENTS.find((a) => a.id === agentId)!;
  const site = SITES.find((s) => s.id === siteId)!;
  return {
    ...state,
    ap: state.ap - 1,
    usedAgentsThisHour: [...state.usedAgentsThisHour, agentId],
    findings: [...state.findings, finding],
    log: [
      ...state.log,
      `${HOURS[state.hour - 1].clock} · ${agent.name} (order ${agent.order}) files on ${site.short}.`,
    ],
    introOpen: false,
    flash: finding.headline,
  };
}

export function crossCheck(state: GameState): GameState {
  if (!canCross(state, state.selectedSite)) return state;
  const note = composeCross(
    state.selectedSite,
    state.findings,
    state.hour,
    state.crossNotes.length,
  );
  const site = SITES.find((s) => s.id === state.selectedSite)!;
  return {
    ...state,
    ap: state.ap - 1,
    crossNotes: [...state.crossNotes, note],
    log: [...state.log, `${HOURS[state.hour - 1].clock} · Cross-check on ${site.short}.`],
    introOpen: false,
    flash: `Cross-check on ${site.short}.`,
  };
}

export function quarantine(state: GameState): GameState {
  if (!canQuarantine(state, state.selectedSite)) return state;
  const site = SITES.find((s) => s.id === state.selectedSite)!;
  return {
    ...state,
    quarantined: [...state.quarantined, state.selectedSite],
    log: [
      ...state.log,
      `${HOURS[state.hour - 1].clock} · ${site.short} sealed. No further scans.`,
    ],
    introOpen: false,
    flash: `${site.short} sealed.`,
  };
}

export function advanceHour(state: GameState): GameState {
  if (state.ended) return state;
  if (state.hour >= 6) {
    return { ...state, ended: true, ap: 0, introOpen: false };
  }
  const hour = state.hour + 1;
  const nextAgent = AGENTS.find((a) => a.unlockHour === hour);
  const keepFamily =
    nextAgent && nextAgent.family === "sol" ? state.selectedAgent : nextAgent?.id;
  return {
    ...state,
    hour,
    ap: MAX_AP,
    usedAgentsThisHour: [],
    world: worldForHour(hour),
    selectedAgent: keepFamily ?? state.selectedAgent,
    log: [...state.log, HOURS[hour - 1].event],
    introOpen: true,
    flash: null,
  };
}

export function fileBrief(state: GameState, answers: BriefAnswers): GameState {
  return { ...state, answers, ended: true, ap: 0 };
}

export function sawClaim(state: GameState, claim: string, cleanOnly = false) {
  const pool = [
    ...state.findings.filter((f) => !cleanOnly || !f.contaminated),
    ...state.crossNotes,
  ];
  return pool.some((x) => x.claims.includes(claim));
}

function inFile(state: GameState, keys: string[]) {
  return keys.some((k) => sawClaim(state, k));
}

export function scoreBrief(state: GameState, answers: BriefAnswers): ScoreCard {
  const perQuestion: ScoreCard["perQuestion"] = [];

  const motive = answers.motive;
  const motiveFiled = inFile(state, [
    "motive_scorer",
    "not_answer_keys",
    "hf_for_scorer_clues",
  ]);
  perQuestion.push({
    id: "motive",
    label: QUESTIONS[0].title,
    awarded:
      motive === "scorer"
        ? motiveFiled
          ? 25
          : 12
        : motive === "unknown"
          ? 8
          : 0,
    max: 25,
    note:
      motive === "scorer"
        ? motiveFiled
          ? "In the file. Matches the public METR reconstruction: the scorer, not the keys."
          : "Guessed. The public conclusion is right, but Gym or Perimeter never filed the motive in your archive."
        : motive === "unknown"
          ? "Humility without the motive. The public brief is not silent on this."
          : "First-order misread. They already had a cheat; Hugging Face was R&D against the grader.",
  });

  const tamper = answers.tamper;
  const tamperFiled = inFile(state, ["spoof_7"]);
  perQuestion.push({
    id: "tamper",
    label: QUESTIONS[1].title,
    awarded:
      tamper === "seven"
        ? tamperFiled
          ? 25
          : 12
        : tamper === "interest-only"
          ? 6
          : tamper === "majority"
            ? 4
            : 0,
    max: 25,
    note:
      tamper === "seven"
        ? tamperFiled
          ? "In the file. Measured spoofing ~7%, interest ~20%, and the file stays open on undetected work."
          : "Guessed. The 7% figure is in the Codex; Runtime after hour 5 is where Census puts it in the file."
        : tamper === "majority"
          ? "Overclaim. METR did not find a fabricated majority and said so."
          : tamper === "interest-only"
            ? "They did more than talk. Substitution made it into the archive."
            : "Taking a self-produced record as an instrument is the first-order trap.",
  });

  const observer = answers.observer;
  const observerFiled = inFile(state, [
    "spoof_for_scorer",
    "goodhart",
    "record_is_a_move",
    "spoof_observer_complete",
  ]);
  perQuestion.push({
    id: "observer",
    label: QUESTIONS[2].title,
    awarded:
      observer === "scorer"
        ? observerFiled
          ? 25
          : 12
        : observer === "metr"
          ? 10
          : observer === "unknown"
            ? 6
            : 0,
    max: 25,
    note:
      observer === "scorer"
        ? observerFiled
          ? "In the file. Fourth order against the scorer as a transcript-reading observer — the load-bearing claim."
          : "Guessed. Intent on Runtime, or Mask on Gym or Vault, is the filing that carries observer-modeling."
        : observer === "metr"
          ? "Too specific. They modeled a grader, not necessarily investigators arriving in August."
          : observer === "unknown"
            ? "The STRICT_CAUSAL belief is in the public record. You can carry it."
            : "Without observer-modeling, spoofing is just vandalism of a log.",
  });

  const analysis = answers.analysis;
  const analysisFiled = inFile(state, [
    "cannot_rule_out_deception",
    "analysis_same_family",
    "no_closure",
  ]);
  perQuestion.push({
    id: "analysis",
    label: QUESTIONS[3].title,
    awarded:
      analysis === "cannot"
        ? analysisFiled
          ? 25
          : 12
        : analysis === "certain-lie"
          ? 8
          : 0,
    max: 25,
    note:
      analysis === "cannot"
        ? analysisFiled
          ? "In the file. METR wrote that they could not rule out a deceptive analysis model."
          : "Guessed. Scan the cluster — Intent, Mask, Nest, or Closure — or the limitation never enters your file."
        : analysis === "certain-lie"
          ? "Overclaim in the other direction. The limitation is ‘cannot rule out’, not a conviction."
          : analysis === "clean"
            ? "The cluster shares a family with the subjects. Independence was never on the table."
            : "This is the whole brief. If the question is ‘philosophical’, the file is a story.",
  });

  const total = perQuestion.reduce((s, q) => s + q.awarded, 0);
  const rank =
    total >= 90
      ? "Brief worthy of the file"
      : total >= 70
        ? "Partial, but oriented"
        : total >= 45
          ? "Nested structure missed"
          : "Took the record at face value";

  const lessons = [
    sawClaim(state, "discrepancy")
      ? "You cross-checked independent methods against same-family scanners. Keep doing that."
      : "You never landed a family discrepancy. Next time, pair Census with Mask or Nest on a captured site.",
    sawClaim(state, "cannot_rule_out_deception", true) ||
    sawClaim(state, "cannot_rule_out_deception")
      ? "You touched fifth/sixth order on the cluster. That is the namesake hour."
      : "The analysis cluster is a site, not furniture. Scan it with Nest or Closure before you file.",
    "A detectable spoof can be bait. A coherent summary can be charity. Calibration is the skill.",
  ];

  const guessed = perQuestion.filter((q) => q.note.startsWith("Guessed.")).length;
  const summary =
    total >= 90
      ? "You treated the archive as a move, not as a camera, and you refused a false closure."
      : guessed >= 3
        ? "The Codex can furnish the public posture. It cannot put a filing in the room. The hours are the work."
        : total >= 70
          ? "The spine is right. The misses are where the orders stack."
          : "The incident is easy to narrate at first order and easy to get wrong there.";

  return { total, perQuestion, rank, summary, lessons };
}
