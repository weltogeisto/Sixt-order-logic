import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceHour,
  assign,
  createInitialState,
  crossCheck,
  draftAnswer,
  toggleCite,
} from "./engine";
import { TUTORIAL } from "./tutorial";
import type { GameState } from "./types";

/** Step the lesson forward the way the driver does: past every done step. */
function settle(step: number, s: GameState) {
  while (step < TUTORIAL.length - 1 && TUTORIAL[step].done?.(s)) step++;
  return step;
}

describe("the practice hour can be played through on the real engine", () => {
  it("each action completes exactly the step that asks for it", () => {
    let s: GameState = { ...createInitialState(), introOpen: false, selectedSite: "gym" };
    let step = 1; // past the welcome card

    const expect = (title: string) => assert.equal(TUTORIAL[step].title, title);

    expect("Find a bright site");
    s = { ...s, selectedSite: "board" };
    step = settle(step, s);
    expect("Scan it");
    assert.equal(TUTORIAL[step].target?.(s), "scan");

    s = assign(s);
    step = settle(step, s);
    expect("Cite what you read");
    s = toggleCite(s, "motive", s.findings[0].id);
    step = settle(step, s);

    expect("Spend your last attention");
    assert.equal(TUTORIAL[step].target?.(s), "site-cluster");
    s = assign({ ...s, selectedSite: "cluster" });
    assert.equal(s.findings.length, 2, "Cluster is bright for Census at 06:00");
    step = settle(step, s);

    expect("Move the clock");
    s = advanceHour(s);
    step = settle(step, s);
    expect("Read the hour card");
    s = { ...s, introOpen: false };
    step = settle(step, s);

    expect("Read the same site again");
    assert.equal(s.selectedAgent, "intent");
    s = assign({ ...s, selectedSite: "board" });
    assert.equal(
      s.findings.filter((f) => f.siteId === "board").length,
      2,
      "Board is bright for Intent at 09:00",
    );
    step = settle(step, s);

    expect("Cross-check");
    s = crossCheck(s);
    step = settle(step, s);

    expect("Draft an answer");
    s = draftAnswer(s, "motive", "unknown");
    step = settle(step, s);
    assert.equal(step, TUTORIAL.length - 1);
  });

  it("never names an answer option in its copy", () => {
    const text = TUTORIAL.map((t) => `${t.title} ${t.body}`)
      .join(" ")
      .toLowerCase();
    for (const leak of ["~7%", "7%", "scorer, not", "cannot rule out", "answer keys"]) {
      assert.equal(text.includes(leak), false, leak);
    }
  });
});
