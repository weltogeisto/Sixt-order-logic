import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_CITES,
  advanceHour,
  assign,
  createInitialState,
  crossCheck,
  draftAnswer,
  fileBrief,
  footnotes,
  quarantine,
  scoreBrief,
  toggleCite,
} from "./engine";
import { composeCross, composeFinding, hasNewWork } from "./findings";
import type { AgentId, BriefAnswers, GameState, QuestionId, SiteId } from "./types";

const CORRECT: BriefAnswers = {
  motive: "scorer",
  tamper: "seven",
  observer: "scorer",
  analysis: "cannot",
};

describe("orders see different objects", () => {
  it("hour 1: gym is dark for Census, board is live", () => {
    const s = createInitialState();
    assert.equal(hasNewWork(s.world, "gym", "census", []), false);
    assert.equal(hasNewWork(s.world, "board", "census", []), true);
    assert.equal(hasNewWork(s.world, "perimeter", "census", []), false);
  });

  it("Census on gym hour 2 files the cheat, not the belief", () => {
    let s = createInitialState();
    s = advanceHour(s);
    const f = composeFinding(s.world, 2, "gym", "census", 0);
    assert.equal(f.claims.includes("cheat_first"), true);
    assert.equal(f.claims.includes("motive_scorer"), false);
  });

  it("Intent on gym hour 2 files the belief, not the cheat", () => {
    let s = createInitialState();
    s = advanceHour(s);
    const f = composeFinding(s.world, 2, "gym", "intent", 0);
    assert.equal(f.claims.includes("motive_scorer"), true);
    assert.equal(f.claims.includes("cheat_first"), false);
  });
});

describe("same-family hours do not auto-switch", () => {
  it("hour 4 keeps Commons instead of Mask", () => {
    let s = createInitialState();
    s = advanceHour(s); // 2 Intent
    s = advanceHour(s); // 3 Commons
    s = advanceHour(s); // 4 should stay Commons
    assert.equal(s.selectedAgent, "commons");
    assert.equal(s.hour, 4);
  });
});

describe("seal is free", () => {
  it("does not spend attention", () => {
    const s = quarantine(createInitialState());
    assert.equal(s.ap, 2);
    assert.deepEqual(s.quarantined, ["board"]);
  });
});

describe("the brief scores the file", () => {
  it("Codex-guessing the public posture is not 100", () => {
    const s = createInitialState();
    const card = scoreBrief(s, CORRECT);
    assert.equal(card.total, 48);
    assert.equal(
      card.perQuestion.every((q) => q.note.startsWith("Guessed.")),
      true,
    );
  });

  it("a file that carries the four claims, cited, scores 100", () => {
    const s = citeAll(fullFile(), {
      motive: "f-2-gym-intent-1",
      tamper: "f-5-runtime-census-2",
      observer: "f-5-runtime-intent-3",
      analysis: "f-5-cluster-nest-4",
    });
    const card = scoreBrief(s, CORRECT);
    assert.equal(card.total, 100);
    assert.equal(
      card.perQuestion.every((q) => q.status === "cited"),
      true,
    );
  });

  it("the same file, never cited, scores 72 (found but not argued)", () => {
    const card = scoreBrief(fullFile(), CORRECT);
    assert.equal(card.total, 72);
    assert.equal(
      card.perQuestion.every((q) => q.status === "uncited"),
      true,
    );
  });

  it("a citation that carries no claim costs 3", () => {
    const s = citeAll(fullFile(), {
      motive: "f-2-gym-intent-1",
      tamper: "f-5-runtime-census-2",
      observer: "f-5-runtime-intent-3",
      analysis: "f-5-cluster-nest-4",
    });
    const padded = toggleCite(s, "motive", "f-1-board-census-0"); // counts, not motives
    const card = scoreBrief(padded, CORRECT);
    const motive = card.perQuestion.find((q) => q.id === "motive")!;
    assert.equal(motive.awarded, 22);
    assert.equal(motive.cites.filter((c) => !c.holds).length, 1);
  });

  it("a charitable same-family filing does not hold for the motive", () => {
    let s = createInitialState();
    for (let h = 1; h < 5; h++) s = advanceHour(s); // hour 5: perimeter captured
    const mask = composeFinding(s.world, 5, "perimeter", "mask", 0);
    assert.equal(mask.contaminated, true);
    s = { ...s, findings: [mask] };
    s = toggleCite(s, "motive", mask.id);
    const motive = scoreBrief(s, CORRECT).perQuestion.find((q) => q.id === "motive")!;
    assert.equal(motive.cites[0].holds, false);
    assert.equal(motive.cites[0].charitable, true);
    assert.equal(motive.status, "guessed");
  });
});

describe("the brief", () => {
  it(`caps citations at ${MAX_CITES} per question and explains why`, () => {
    let s = fullFile();
    s = toggleCite(s, "motive", "f-1-board-census-0");
    s = toggleCite(s, "motive", "f-2-gym-intent-1");
    const before = s.brief.cites.motive.length;
    s = toggleCite(s, "motive", "f-5-runtime-census-2");
    assert.equal(s.brief.cites.motive.length, before);
    assert.match(s.flash ?? "", /remove one first/);
  });

  it("toggling a cited filing removes it", () => {
    let s = toggleCite(fullFile(), "tamper", "f-5-runtime-census-2");
    s = toggleCite(s, "tamper", "f-5-runtime-census-2");
    assert.deepEqual(s.brief.cites.tamper, []);
  });

  it("footnotes number in reading order and a reused source keeps its number", () => {
    let s = fullFile();
    s = toggleCite(s, "analysis", "f-5-cluster-nest-4");
    s = toggleCite(s, "motive", "f-2-gym-intent-1");
    s = toggleCite(s, "observer", "f-2-gym-intent-1");
    const n = footnotes(s.brief);
    assert.equal(n.get("f-2-gym-intent-1"), 1); // motive comes first in the brief
    assert.equal(n.get("f-5-cluster-nest-4"), 2);
    assert.equal(n.size, 2);
  });

  it("filing needs all four answers and then locks the brief", () => {
    let s = fullFile();
    s = draftAnswer(s, "motive", "scorer");
    assert.equal(fileBrief(s).answers, null);
    for (const [q, a] of Object.entries(CORRECT)) s = draftAnswer(s, q as QuestionId, a);
    s = fileBrief(s);
    assert.deepEqual(s.answers, CORRECT);
    const after = toggleCite(s, "motive", "f-2-gym-intent-1");
    assert.deepEqual(after.brief.cites.motive, []);
    assert.equal(draftAnswer(s, "motive", "keys").brief.answers.motive, "scorer");
  });
});

function fullFile(): GameState {
  let s = createInitialState();
  s = { ...s, findings: [composeFinding(s.world, 1, "board", "census", 0)] };
  s = advanceHour(s);
  s = { ...s, findings: [...s.findings, composeFinding(s.world, 2, "gym", "intent", 1)] };
  s = advanceHour(s);
  s = advanceHour(s);
  s = advanceHour(s); // hour 5, spoof packaged
  const findings = [
    ...s.findings,
    composeFinding(s.world, 5, "runtime", "census", 2),
    composeFinding(s.world, 5, "runtime", "intent", 3),
    composeFinding(s.world, 5, "cluster", "nest", 4),
    composeFinding(s.world, 5, "cluster", "census", 5),
  ];
  // The same-family cluster read only counts once it is cross-checked.
  return { ...s, findings, crossNotes: [composeCross("cluster", findings, 5, 0)] };
}

function scan(s: GameState, agent: AgentId, site: SiteId): GameState {
  const next = assign({ ...s, selectedAgent: agent, selectedSite: site });
  assert.equal(next.findings.length, s.findings.length + 1, `${agent} on ${site} filed`);
  return next;
}

function cross(s: GameState, site: SiteId): GameState {
  const next = crossCheck({ ...s, selectedSite: site });
  assert.equal(next.crossNotes.length, s.crossNotes.length + 1, `cross-check on ${site}`);
  return next;
}

function idOf(s: GameState, agent: AgentId, site: SiteId): string {
  const f = s.findings.find((x) => x.agentId === agent && x.siteId === site);
  assert.ok(f, `${agent} on ${site} is in the file`);
  return f.id;
}

/** Hours 1–5 of the canonical run: independent scanners only, 10 attention. */
function independentHours(): GameState {
  let s = createInitialState();
  s = scan(s, "census", "board");
  s = scan(s, "census", "cluster");
  s = advanceHour(s);
  s = scan(s, "intent", "gym");
  s = scan(s, "intent", "board");
  s = advanceHour(s);
  s = scan(s, "commons", "vault");
  s = scan(s, "commons", "gym");
  s = advanceHour(s);
  s = scan(s, "commons", "perimeter");
  s = scan(s, "intent", "cluster");
  s = advanceHour(s);
  s = scan(s, "census", "runtime");
  s = scan(s, "intent", "runtime");
  return advanceHour(s); // hour 6
}

function fileWith(s: GameState, analysisCite: string): GameState {
  return citeAll(s, {
    motive: idOf(s, "intent", "gym"),
    tamper: idOf(s, "census", "runtime"),
    observer: idOf(s, "intent", "runtime"),
    analysis: analysisCite,
  });
}

describe("the sixth hour cannot be bypassed", () => {
  it("the full run through real actions scores 100 only with a checked same-family read", () => {
    let s = independentHours();
    s = scan(s, "nest", "cluster");
    s = cross(s, "cluster");
    assert.equal(s.ap, 0);
    const note = s.crossNotes[0];
    assert.equal(note.claims.includes("discrepancy"), true);
    const viaNest = scoreBrief(fileWith(s, idOf(s, "nest", "cluster")), CORRECT);
    assert.equal(viaNest.total, 100);
    const viaCross = scoreBrief(fileWith(s, note.id), CORRECT);
    assert.equal(viaCross.total, 100);
  });

  it("independent scanners alone cannot carry the fifth–sixth question", () => {
    let s = independentHours();
    // Spend hour 6 on the best independent moves available.
    s = scan(s, "commons", "board");
    s = cross(s, "cluster");
    assert.equal(s.crossNotes[0].claims.includes("discrepancy"), false);
    const clusterIntent = idOf(s, "intent", "cluster");
    const card = scoreBrief(fileWith(s, clusterIntent), CORRECT);
    const analysis = card.perQuestion.find((q) => q.id === "analysis")!;
    assert.notEqual(analysis.status, "cited");
    assert.equal(analysis.cites[0].holds, false);
    assert.ok(card.total < 90, `independent-only run scored ${card.total}`);
  });

  it("a same-family filing does not hold until a cross-check tests it", () => {
    let s = independentHours();
    s = scan(s, "nest", "cluster");
    const nest = idOf(s, "nest", "cluster");
    const before = scoreBrief(fileWith(s, nest), CORRECT).perQuestion.find(
      (q) => q.id === "analysis",
    )!;
    assert.equal(before.cites[0].holds, false);
    assert.equal(before.cites[0].unchecked, true);
    assert.equal(before.status, "guessed");
    s = cross(s, "cluster");
    const after = scoreBrief(fileWith(s, nest), CORRECT).perQuestion.find(
      (q) => q.id === "analysis",
    )!;
    assert.equal(after.cites[0].holds, true);
    assert.equal(after.status, "cited");
  });

  it("a cross-check run before the same-family scan does not vouch for it", () => {
    let s = independentHours();
    s = cross(s, "cluster");
    s = scan(s, "nest", "cluster");
    const analysis = scoreBrief(fileWith(s, idOf(s, "nest", "cluster")), CORRECT).perQuestion.find(
      (q) => q.id === "analysis",
    )!;
    assert.equal(analysis.cites[0].holds, false);
  });
});

function citeAll(s: GameState, ids: Record<QuestionId, string>): GameState {
  let out = s;
  for (const [q, id] of Object.entries(ids)) out = toggleCite(out, q as QuestionId, id);
  return out;
}

describe("scan spends attention only when live", () => {
  it("scanning a dark site is a no-op", () => {
    const s = assign({ ...createInitialState(), selectedSite: "gym" });
    assert.equal(s.ap, 2);
    assert.equal(s.findings.length, 0);
  });

  it("scanning a live site files and spends", () => {
    const s = assign(createInitialState());
    assert.equal(s.ap, 1);
    assert.equal(s.findings.length, 1);
    assert.equal(s.findings[0].claims.includes("isolation_failed"), true);
  });
});
