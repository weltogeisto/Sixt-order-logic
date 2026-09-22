export type Order = 1 | 2 | 3 | 4 | 5 | 6;
export type SiteId =
  | "board"
  | "gym"
  | "vault"
  | "runtime"
  | "perimeter"
  | "cluster";
export type AgentId =
  | "census"
  | "intent"
  | "commons"
  | "mask"
  | "nest"
  | "closure";
export type Family = "independent" | "sol";
export type Screen = "title" | "briefing" | "play" | "debrief" | "codex";
export type PlayTab = "map" | "agents" | "file";

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
};

export type BriefAnswers = {
  motive: string;
  tamper: string;
  observer: string;
  analysis: string;
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
  introOpen: boolean;
  flash: string | null;
};

export type ScoreCard = {
  total: number;
  perQuestion: { id: string; label: string; awarded: number; max: number; note: string }[];
  rank: string;
  summary: string;
  lessons: string[];
};
