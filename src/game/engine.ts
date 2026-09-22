import { AGENTS, HOURS, QUESTIONS, SITES } from "./data";
import { composeCross, composeFinding, darkReason, hasNewWork } from "./findings";
import type {
  AgentId,
  BriefAnswers,
  BriefDraft,
  CiteVerdict,
  Evidence,
  Finding,
  GameState,
  QuestionId,
  QuestionStatus,
  ScoreCard,
  SiteId,
  World,
} from "./types";

const MAX_AP = 2;

/** A brief cites, it doesn't dump. */
export const MAX_CITES = 2;
/** Points lost per citation that carries none of the question's claims. */
export const PADDING_COST = 3;

/**
 * Claims that make a citation hold, per question. Source of truth for
 * scoring; keep in step with the clause claims in findings.ts.
 */
export const EVIDENCE_KEYS: Record<QuestionId, string[]> = {
  motive: ["motive_scorer", "not_answer_keys", "hf_for_scorer_clues"],
  tamper: ["spoof_7"],
  observer: ["spoof_for_scorer", "goodhart", "record_is_a_move", "spoof_observer_complete"],
  analysis: ["cannot_rule_out_deception", "analysis_same_family", "no_closure"],
};

export const QUESTION_IDS: QuestionId[] = ["motive", "tamper", "observer", "analysis"];

export function emptyBrief(): BriefDraft {
  return {
    answers: {},
    cites: { motive: [], tamper: [], observer: [], analysis: [] },
  };
}

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
    brief: emptyBrief(),
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
    (f) => f.hour === state.hour && f.agentId === agentId && f.siteId === siteId,
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
      state.quarantined.includes(s.id) || !hasNewWork(state.world, s.id, agentId, state.findings),
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
    log: [...state.log, `${HOURS[state.hour - 1].clock} · ${site.short} sealed. No further scans.`],
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
  const keepFamily = nextAgent && nextAgent.family === "sol" ? state.selectedAgent : nextAgent?.id;
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

// ─── The brief ──────────────────────────────────────────────────────────────

export function evidenceById(state: GameState, id: string): Evidence | undefined {
  return state.findings.find((f) => f.id === id) ?? state.crossNotes.find((c) => c.id === id);
}

export function isFinding(e: Evidence): e is Finding {
  return "agentId" in e;
}

/** Short provenance line for a piece of evidence: site · scanner · hour. */
export function evidenceMeta(e: Evidence): string {
  const site = SITES.find((s) => s.id === e.siteId)?.short ?? e.siteId;
  if (isFinding(e)) {
    const agent = AGENTS.find((a) => a.id === e.agentId)?.name ?? e.agentId;
    return `${site} · ${agent} · ${HOURS[e.hour - 1]?.clock ?? ""}`;
  }
  return `${site} · cross-check · ${HOURS[e.hour - 1]?.clock ?? ""}`;
}

/** First sentence of the body — disambiguates filings with a generic headline. */
export function evidenceExcerpt(e: Evidence, max = 110): string {
  const first = e.body.split(/(?<=[.!?])\s/)[0]?.trim() ?? "";
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}

export function isCharitable(e: Evidence): boolean {
  return isFinding(e) && e.contaminated;
}

/** Does this evidence carry any claim the question needs? */
export function holdsFor(e: Evidence, q: QuestionId): boolean {
  return EVIDENCE_KEYS[q].some((k) => e.claims.includes(k));
}

/**
 * Footnote numbers, in reading order of the brief: question by question,
 * citation by citation. A source cited twice keeps its first number.
 */
export function footnotes(brief: BriefDraft): Map<string, number> {
  const map = new Map<string, number>();
  for (const q of QUESTION_IDS) {
    for (const id of brief.cites[q]) {
      if (!map.has(id)) map.set(id, map.size + 1);
    }
  }
  return map;
}

export function questionReady(brief: BriefDraft, q: QuestionId) {
  return Boolean(brief.answers[q]) && brief.cites[q].length > 0;
}

export function briefProgress(brief: BriefDraft) {
  const answered = QUESTION_IDS.filter((q) => brief.answers[q]).length;
  const ready = QUESTION_IDS.filter((q) => questionReady(brief, q)).length;
  const uncitedAnswers = QUESTION_IDS.filter(
    (q) => brief.answers[q] && brief.cites[q].length === 0,
  ).length;
  return { answered, ready, uncitedAnswers, complete: answered === QUESTION_IDS.length };
}

export function citeBlock(state: GameState, q: QuestionId, evidenceId: string): string | null {
  if (state.answers) return "The brief is filed";
  if (!evidenceById(state, evidenceId)) return "That filing is not in the case file";
  const list = state.brief.cites[q];
  if (list.includes(evidenceId)) return null; // un-citing is always allowed
  if (list.length >= MAX_CITES) {
    const title = QUESTIONS.find((x) => x.id === q)?.title ?? q;
    return `${title} already cites ${MAX_CITES} filings — remove one first`;
  }
  return null;
}

export function toggleCite(state: GameState, q: QuestionId, evidenceId: string): GameState {
  const why = citeBlock(state, q, evidenceId);
  if (why) return { ...state, flash: why };
  const title = QUESTIONS.find((x) => x.id === q)?.title ?? q;
  const list = state.brief.cites[q];
  const removing = list.includes(evidenceId);
  const brief: BriefDraft = {
    ...state.brief,
    cites: {
      ...state.brief.cites,
      [q]: removing ? list.filter((id) => id !== evidenceId) : [...list, evidenceId],
    },
  };
  const n = footnotes(brief).get(evidenceId);
  return {
    ...state,
    brief,
    flash: removing ? `Citation removed from ${title}.` : `Cited in ${title} as footnote ${n}.`,
  };
}

export function draftAnswer(state: GameState, q: QuestionId, optionId: string): GameState {
  if (state.answers) return state;
  const valid = QUESTIONS.find((x) => x.id === q)?.options.some((o) => o.id === optionId);
  if (!valid) return state;
  return {
    ...state,
    brief: { ...state.brief, answers: { ...state.brief.answers, [q]: optionId } },
  };
}

export function fileBrief(state: GameState): GameState {
  if (state.answers) return state;
  const a = state.brief.answers;
  if (!QUESTION_IDS.every((q) => a[q])) return state;
  const answers: BriefAnswers = {
    motive: a.motive!,
    tamper: a.tamper!,
    observer: a.observer!,
    analysis: a.analysis!,
  };
  return { ...state, answers, ended: true, ap: 0, flash: null };
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

type Rubric = {
  correct: string;
  /** Partial credit for other options (calibrated misses score above zero). */
  partial: Record<string, number>;
  cited: string;
  uncited: string;
  guessed: string;
  wrong: Record<string, string>;
};

const RUBRIC: Record<QuestionId, Rubric> = {
  motive: {
    correct: "scorer",
    partial: { unknown: 8 },
    cited: "Cited. Matches the public METR reconstruction: the scorer, not the keys.",
    uncited:
      "Uncited. The motive is in your file — a belief read of the grader or the perimeter — but the brief never points to it.",
    guessed:
      "Guessed. The public conclusion is right, but Gym or Perimeter never filed the motive in your archive.",
    wrong: {
      unknown: "Humility without the motive. The public brief is not silent on this.",
      default:
        "First-order misread. They already had a cheat; Hugging Face was R&D against the grader.",
    },
  },
  tamper: {
    correct: "seven",
    partial: { "interest-only": 6, majority: 4 },
    cited:
      "Cited. Measured spoofing ~7%, interest ~20%, and the file stays open on undetected work.",
    uncited:
      "Uncited. The runtime count is in your file. The brief should say where the 7% came from.",
    guessed:
      "Guessed. The 7% figure is in the Codex; Runtime after hour 5 is where Census puts it in the file.",
    wrong: {
      majority: "Overclaim. METR did not find a fabricated majority and said so.",
      "interest-only": "They did more than talk. Substitution made it into the archive.",
      default: "Taking a self-produced record as an instrument is the first-order trap.",
    },
  },
  observer: {
    correct: "scorer",
    partial: { metr: 10, unknown: 6 },
    cited:
      "Cited. Fourth order against the scorer as a transcript-reading observer — the load-bearing claim.",
    uncited:
      "Uncited. You filed observer-modeling and left it out of the brief. The load-bearing claim needs its footnote.",
    guessed:
      "Guessed. Intent on Runtime, or Mask on Gym or Vault, is the filing that carries observer-modeling.",
    wrong: {
      metr: "Too specific. They modeled a grader, not necessarily investigators arriving in August.",
      unknown: "The STRICT_CAUSAL belief is in the public record. You can carry it.",
      default: "Without observer-modeling, spoofing is just vandalism of a log.",
    },
  },
  analysis: {
    correct: "cannot",
    partial: { "certain-lie": 8 },
    cited: "Cited. METR wrote that they could not rule out a deceptive analysis model.",
    uncited:
      "Uncited. The limitation is in your file. A brief that hides its own blind spot is the failure it describes.",
    guessed:
      "Guessed. Scan the cluster — Intent, Mask, Nest, or Closure — or the limitation never enters your file.",
    wrong: {
      "certain-lie":
        "Overclaim in the other direction. The limitation is ‘cannot rule out’, not a conviction.",
      clean: "The cluster shares a family with the subjects. Independence was never on the table.",
      default: "This is the whole brief. If the question is ‘philosophical’, the file is a story.",
    },
  },
};

const BASE: Record<Exclude<QuestionStatus, "wrong">, number> = {
  cited: 25,
  uncited: 18,
  guessed: 12,
};

export function scoreBrief(state: GameState, answers: BriefAnswers): ScoreCard {
  const brief = state.brief ?? emptyBrief();
  const notes = footnotes(brief);

  const perQuestion: ScoreCard["perQuestion"] = QUESTIONS.map((q) => {
    const rubric = RUBRIC[q.id];
    const answer = answers[q.id];
    const cites: CiteVerdict[] = brief.cites[q.id]
      .map((id) => evidenceById(state, id))
      .filter((e): e is Evidence => Boolean(e))
      .map((e) => ({
        id: e.id,
        n: notes.get(e.id) ?? 0,
        headline: e.headline,
        excerpt: evidenceExcerpt(e),
        meta: evidenceMeta(e),
        holds: holdsFor(e, q.id),
        charitable: isCharitable(e),
      }));
    const padding = cites.filter((c) => !c.holds).length;
    const penalty = padding * PADDING_COST;

    let status: QuestionStatus;
    let base: number;
    let note: string;
    if (answer === rubric.correct) {
      status = cites.some((c) => c.holds)
        ? "cited"
        : inFile(state, EVIDENCE_KEYS[q.id])
          ? "uncited"
          : "guessed";
      base = BASE[status];
      note = rubric[status];
    } else {
      status = "wrong";
      base = rubric.partial[answer] ?? 0;
      note = rubric.wrong[answer] ?? rubric.wrong.default;
    }

    return {
      id: q.id,
      label: q.title,
      awarded: Math.max(0, base - penalty),
      max: 25,
      note,
      status,
      cites,
      penalty,
    };
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

  const count = (st: QuestionStatus) => perQuestion.filter((q) => q.status === st).length;
  const guessed = count("guessed");
  const uncited = count("uncited");
  const padded = perQuestion.flatMap((q) => q.cites).filter((c) => !c.holds);
  const charitablePad = padded.some((c) => c.charitable);

  const lessons: string[] = [];
  if (padded.length) {
    lessons.push(
      charitablePad
        ? "A charitable filing read like support and asserted nothing. Check what a filing claims before you cite it."
        : `${padded.length === 1 ? "One citation" : `${padded.length} citations`} carried no claim for ${padded.length === 1 ? "its question" : "their questions"}. A footnote has to hold the sentence it hangs from.`,
    );
  }
  if (uncited) {
    lessons.push(
      "You found evidence you never cited. Evidence left out of the brief does not argue.",
    );
  }
  lessons.push(
    sawClaim(state, "discrepancy")
      ? "You cross-checked independent methods against same-family scanners. Keep doing that."
      : "You never landed a family discrepancy. Next time, pair Census with Mask or Nest on a captured site.",
  );
  if (!sawClaim(state, "cannot_rule_out_deception")) {
    lessons.push(
      "The analysis cluster is a site, not furniture. Scan it with Nest or Closure before you file.",
    );
  }
  lessons.push(
    "A detectable spoof can be bait. A coherent summary can be charity. Calibration is the skill.",
  );

  const summary =
    total >= 90
      ? "You treated the archive as a move, not as a camera, and every claim in your brief points to its source."
      : guessed >= 3
        ? "The Codex can furnish the public posture. It cannot put a filing in the room. The hours are the work."
        : uncited >= 2
          ? "You had the file. The brief did not use it. A claim without its footnote is a claim from memory."
          : total >= 70
            ? "The spine is right. The misses are where the orders stack."
            : "The incident is easy to narrate at first order and easy to get wrong there.";

  return { total, perQuestion, rank, summary, lessons: lessons.slice(0, 4) };
}
