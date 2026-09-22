export type Order = 1 | 2 | 3 | 4 | 5 | 6;
export type SiteId = "board" | "gym" | "vault" | "runtime" | "perimeter" | "cluster";
export type AgentId = "census" | "intent" | "commons" | "mask" | "nest" | "closure";
export type Family = "independent" | "sol";
export type Screen = "title" | "briefing" | "play" | "debrief" | "codex";
export type PlayTab = "map" | "agents" | "brief" | "file";

export type AgentDef = {
  id: AgentId;
  name: string;
  order: Order;
  family: Family;
  role: string;
  blurb: string;
  unlockHour: number;
};

export type SiteDef = {
  id: SiteId;
  name: string;
  short: string;
  blurb: string;
  x: number;
  y: number;
};

export type HourDef = {
  id: number;
  clock: string;
  name: string;
  order: Order;
  incident: string;
  prompt: string;
  event: string;
};

export type World = {
  boardActive: boolean;
  boardAgents: number;
  messages: number;
  cheatFound: boolean;
  scorerWorkstreams: boolean;
  tamperInterest: number;
  hfPivot: boolean;
  attackers: number;
  spoofPackaged: boolean;
  spoofRate: number;
  signedMessages: number;
  massExit: boolean;
  sameFamilyAnalysis: boolean;
  familyCapture: Record<SiteId, boolean>;
};

export type Finding = {
  id: string;
  hour: number;
  siteId: SiteId;
  agentId: AgentId;
  order: Order;
  contaminated: boolean;
  headline: string;
  body: string;
  claims: string[];
};

export type CrossNote = {
  id: string;
  hour: number;
  siteId: SiteId;
  headline: string;
  body: string;
  claims: string[];
  /** Finding ids on the site when the cross-check ran — the filings it tested. */
  checks: string[];
};

export type BriefAnswers = {
  motive: string;
  tamper: string;
  observer: string;
  analysis: string;
};

export type QuestionId = keyof BriefAnswers;

/** Anything that can be cited: a scanner filing or a cross-check note. */
export type Evidence = Finding | CrossNote;

/**
 * The brief the player writes during play. Answers are drafts until filed;
 * cites hold evidence ids (Finding.id or CrossNote.id), in citation order.
 */
export type BriefDraft = {
  answers: Partial<BriefAnswers>;
  cites: Record<QuestionId, string[]>;
};

export type GameState = {
  hour: number;
  ap: number;
  usedAgentsThisHour: AgentId[];
  findings: Finding[];
  crossNotes: CrossNote[];
  quarantined: SiteId[];
  selectedSite: SiteId;
  selectedAgent: AgentId | null;
  log: string[];
  world: World;
  ended: boolean;
  answers: BriefAnswers | null;
  brief: BriefDraft;
  introOpen: boolean;
  flash: string | null;
};

export type CiteVerdict = {
  id: string;
  n: number;
  headline: string;
  excerpt: string;
  meta: string;
  holds: boolean;
  charitable: boolean;
  /** Same-family filing that carries the claim but was never cross-checked. */
  unchecked: boolean;
};

export type QuestionStatus = "cited" | "uncited" | "guessed" | "wrong";

export type ScoreCard = {
  total: number;
  perQuestion: {
    id: QuestionId;
    label: string;
    awarded: number;
    max: number;
    note: string;
    status: QuestionStatus;
    cites: CiteVerdict[];
    penalty: number;
  }[];
  rank: string;
  summary: string;
  lessons: string[];
};
