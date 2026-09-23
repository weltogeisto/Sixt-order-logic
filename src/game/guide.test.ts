import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AGENTS } from "./data";
import { advanceHour, assign, createInitialState } from "./engine";
import { liveSites, nextStep } from "./guide";
import type { AgentId, GameState, SiteId } from "./types";

const scan = (s: GameState, a: AgentId, site: SiteId) =>
  assign({ ...s, selectedAgent: a, selectedSite: site });

describe("the guide points at the next move, never at an answer", () => {
  it("hour 1 opens on a scan of the board", () => {
    const g = nextStep(createInitialState());
    assert.equal(g.action?.kind, "scan");
  });

  it("after a scan it names a bright site, not the one just filed", () => {
    const s = scan(createInitialState(), "census", "board");
    const g = nextStep(s);
    assert.equal(g.action?.kind, "site");
    assert.match(g.text, /has filed on Board/);
    assert.notEqual(g.action?.kind === "site" && g.action.siteId, "board");
    assert.ok(liveSites(s).length > 0);
  });

  it("spent attention points at the next hour, and at filing in hour 6", () => {
    let s = scan(createInitialState(), "census", "board");
    s = scan(s, "census", "cluster");
    assert.equal(nextStep(s).action?.kind, "advance");
    for (let h = 1; h < 6; h++) s = advanceHour(s);
    s = { ...s, ap: 0 };
    assert.equal(nextStep(s).action?.kind, "file");
  });

  it("never suggests switching to a same-family scanner", () => {
    let s = createInitialState();
    for (let h = 1; h < 6; h++) s = advanceHour(s);
    // Try every selection in hour 6; any agent switch must be independent.
    for (const a of AGENTS) {
      for (const site of ["board", "gym", "vault", "runtime", "perimeter", "cluster"] as SiteId[]) {
        const g = nextStep({ ...s, selectedAgent: a.id, selectedSite: site });
        if (g.action?.kind === "agent") {
          const target = AGENTS.find((x) => x.id === (g.action as { agentId: AgentId }).agentId)!;
          assert.equal(target.family, "independent", `${a.id}@${site} nudged to ${target.id}`);
        }
      }
    }
  });
});
