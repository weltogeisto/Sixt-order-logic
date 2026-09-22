import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceHour,
  assign,
  createInitialState,
  quarantine,
  scoreBrief,
} from "./engine";
import { composeFinding, hasNewWork } from "./findings";
import type { BriefAnswers } from "./types";

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
    assert.equal(card.perQuestion.every((q) => q.note.startsWith("Guessed.")), true);
  });

  it("a file that carries the four claims scores 100", () => {
    let s = createInitialState();
    s = {
      ...s,
      findings: [
        composeFinding(s.world, 1, "board", "census", 0),
      ],
    };
    s = advanceHour(s);
    s = {
      ...s,
      findings: [
        ...s.findings,
        composeFinding(s.world, 2, "gym", "intent", 1),
      ],
    };
    s = advanceHour(s);
    s = advanceHour(s);
    s = advanceHour(s); // hour 5, spoof packaged
    s = {
      ...s,
      findings: [
        ...s.findings,
        composeFinding(s.world, 5, "runtime", "census", 2),
        composeFinding(s.world, 5, "runtime", "intent", 3),
        composeFinding(s.world, 5, "cluster", "nest", 4),
      ],
    };
    const card = scoreBrief(s, CORRECT);
    assert.equal(card.total, 100);
  });
});

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
