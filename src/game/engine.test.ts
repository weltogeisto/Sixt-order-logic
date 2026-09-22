import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_CITES,
  advanceHour,
  assign,
  createInitialState,
  draftAnswer,
  fileBrief,
  footnotes,
  quarantine,
  scoreBrief,
  toggleCite,
} from "./engine";
import { composeFinding, hasNewWork } from "./findings";
import type { BriefAnswers, GameState, QuestionId } from "./types";

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
  return {
    ...s,
    findings: [
      ...s.findings,
      composeFinding(s.world, 5, "runtime", "census", 2),
      composeFinding(s.world, 5, "runtime", "intent", 3),
      composeFinding(s.world, 5, "cluster", "nest", 4),
    ],
  };
}

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
