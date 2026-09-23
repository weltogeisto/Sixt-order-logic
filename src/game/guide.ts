import { AGENTS, HOURS, SITES } from "./data";
import { assignBlock, canCross, isAgentUnlocked } from "./engine";
import type { AgentId, GameState, SiteId } from "./types";

/**
 * The next useful move, in one line. It only ever points at what the chrome
 * already shows (bright sites, unlocked scanners, spent attention) — never at
 * which filing answers which question. The brief is where the player thinks.
 */
export type Guide = {
  text: string;
  action?:
    | { kind: "scan" }
    | { kind: "advance" }
    | { kind: "file" }
    | { kind: "site"; siteId: SiteId; label: string }
    | { kind: "agent"; agentId: AgentId; label: string };
};

/** Sites the selected scanner can read right now. */
export function liveSites(state: GameState, agentId: AgentId | null = state.selectedAgent) {
  if (!agentId) return [];
  return SITES.filter((s) => assignBlock(state, agentId, s.id) === null).map((s) => s.id);
}

export function nextStep(state: GameState): Guide {
  const site = SITES.find((s) => s.id === state.selectedSite)!;
  const agent = AGENTS.find((a) => a.id === state.selectedAgent);
  const next = HOURS[state.hour]?.clock;

  if (state.ap === 0) {
    return state.hour >= 6
      ? {
          text: "Attention spent. Finish your citations, then file the brief.",
          action: { kind: "file" },
        }
      : { text: `Attention spent. The hour closes at ${next}.`, action: { kind: "advance" } };
  }

  if (!agent) {
    return { text: "Pick a scanner to read the surface." };
  }

  if (assignBlock(state, agent.id, site.id) === null) {
    return {
      text: `Scan ${site.short} with ${agent.name} — order ${agent.order}, 1 attention.`,
      action: { kind: "scan" },
    };
  }

  const live = liveSites(state, agent.id);
  if (live.length > 0) {
    const names = live.map((id) => SITES.find((s) => s.id === id)!.short);
    const justFiled = state.findings.some(
      (f) => f.hour === state.hour && f.agentId === agent.id && f.siteId === site.id,
    );
    const why = justFiled
      ? `${agent.name} has filed on ${site.short}.`
      : `${agent.name} has nothing on ${site.short}.`;
    return {
      text: `${why} Bright sites: ${names.join(", ")}.`,
      action: { kind: "site", siteId: live[0], label: `Go to ${names[0]}` },
    };
  }

  if (canCross(state, site.id)) {
    return {
      text: `${agent.name} is spent this hour. ${site.short} has two filings to cross-check.`,
    };
  }

  // Point only at independent scanners: a same-family read stays the
  // player's choice, never a nudge (handover rule 5).
  const withWork = AGENTS.filter(
    (a) =>
      a.id !== agent.id && isAgentUnlocked(a.id, state.hour) && liveSites(state, a.id).length > 0,
  );
  const other = withWork.find((a) => a.family === "independent");
  if (other) {
    return {
      text: `${agent.name} is spent at this order. ${other.name} still has work.`,
      action: { kind: "agent", agentId: other.id, label: `Switch to ${other.name}` },
    };
  }
  if (withWork.length > 0) {
    return {
      text: `${agent.name} is spent at this order. Only same-family scanners have work left.`,
    };
  }

  return state.hour >= 6
    ? { text: "Nothing left to read. File the brief.", action: { kind: "file" } }
    : { text: `Nothing left to read this hour. Move on to ${next}.`, action: { kind: "advance" } };
}
