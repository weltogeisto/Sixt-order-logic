import { useEffect, useState } from "react";
import {
  BookOpen,
  FolderClosed,
  GitCompare,
  Lock,
  Map as MapIcon,
  ScrollText,
  Shield,
  Users,
} from "lucide-react";
import { AGENTS, HOURS, SITES } from "@/game/data";
import {
  assignBlock,
  agentSpent,
  briefProgress,
  canCross,
  crossBlock,
  isAgentUnlocked,
  quarantineBlock,
} from "@/game/engine";
import { useGame } from "@/game/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlayTab, QuestionId } from "@/game/types";
import { BriefDialog, BriefEditor, BriefPanel } from "./Brief";
import { CaseStrip, FindingCard } from "./CaseFile";
import { OrderMark } from "./OrderMark";
import { SiteMap } from "./SiteMap";

const TABS: { id: PlayTab; label: string; icon: typeof MapIcon }[] = [
  { id: "map", label: "Surface", icon: MapIcon },
  { id: "agents", label: "Scanners", icon: Users },
  { id: "brief", label: "Brief", icon: ScrollText },
  { id: "file", label: "File", icon: FolderClosed },
];

export function PlayShell() {
  const state = useGame((s) => s.state);
  const playTab = useGame((s) => s.playTab);
  const setPlayTab = useGame((s) => s.setPlayTab);
  const setScreen = useGame((s) => s.setScreen);
  const doAdvance = useGame((s) => s.doAdvance);
  const doAssign = useGame((s) => s.doAssign);
  const doDismissIntro = useGame((s) => s.doDismissIntro);
  const doClearFlash = useGame((s) => s.doClearFlash);
  const [confirm, setConfirm] = useState<"advance" | "quarantine" | null>(null);
  const [briefFocus, setBriefFocus] = useState<QuestionId | null>(null);

  useEffect(() => {
    if (!state?.flash) return;
    const t = window.setTimeout(() => doClearFlash(), 2800);
    return () => window.clearTimeout(t);
  }, [state?.flash, doClearFlash]);

  if (!state) return null;

  const hour = HOURS[state.hour - 1];
  const site = SITES.find((s) => s.id === state.selectedSite)!;
  const agent = AGENTS.find((a) => a.id === state.selectedAgent);
  const nextClock = state.hour >= 6 ? null : HOURS[state.hour].clock;
  const assignReason = assignBlock(state, state.selectedAgent, site.id);
  const assignOk = assignReason === null;
  const unlocked = AGENTS.find((a) => a.unlockHour === hour.id);
  const progress = briefProgress(state.brief);

  const requestAdvance = () => {
    if (state.hour >= 6) {
      setScreen("debrief");
      return;
    }
    if (state.ap > 0) setConfirm("advance");
    else doAdvance();
  };

  const spent = agent && state.ap > 0 ? agentSpent(state, agent.id) : false;
  const hint = spent
    ? `${agent?.name} is spent at this order — pick another scanner`
    : !assignOk && assignReason
      ? assignReason
      : state.ap === 0
        ? "No attention left — advance the hour"
        : state.findings.length === 0
          ? `Scan ${site.short} with ${agent?.name ?? "a scanner"}`
          : `${site.short}${agent ? ` · ${agent.name}, order ${agent.order}` : ""}`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col overflow-x-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="font-mono text-xs tabular-nums tracking-widest text-muted uppercase">
            {hour.clock}
          </p>
          <h1 className="truncate font-display text-xl tracking-tight text-fg sm:text-2xl">
            {hour.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Attention ap={state.ap} />
          <AdvanceButton
            hour={state.hour}
            ap={state.ap}
            nextClock={nextClock}
            onClick={requestAdvance}
            size="sm"
            className="hidden lg:inline-flex"
          />
          <Button variant="ghost" size="sm" onClick={() => setScreen("codex")}>
            <BookOpen className="size-4" />
            <span className="hidden sm:inline">Codex</span>
          </Button>
        </div>
      </header>

      <HourTrack current={state.hour} />

      <div role="status" aria-live="polite" className="empty:hidden">
        {state.flash ? (
          <p className="mx-4 mt-2 rounded-lg bg-raised px-3 py-2 text-sm text-fg sm:mx-6">
            {state.flash}
          </p>
        ) : null}
      </div>

      <div className="mt-3 hidden flex-1 grid-cols-12 gap-6 px-6 pb-8 lg:grid">
        <aside className="col-span-3">
          <AgentList />
        </aside>
        <section className="col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <SiteMap />
          </div>
          <BriefPanel onOpen={setBriefFocus} />
        </section>
        <aside className="col-span-4 flex flex-col gap-4">
          <SiteDetail onSeal={() => setConfirm("quarantine")} />
          <CaseStrip />
        </aside>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-40 lg:hidden">
        {playTab === "map" ? (
          <div className="mt-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
            <SiteMap />
          </div>
        ) : null}
        {playTab === "agents" ? (
          <div className="mt-3">
            <AgentList />
          </div>
        ) : null}
        {playTab === "brief" ? (
          <div className="mt-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="mb-6 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-3xl tracking-tight text-fg">The brief</h2>
              <p className="text-sm tabular-nums text-muted">{progress.ready} of 4 ready</p>
            </div>
            <BriefEditor />
          </div>
        ) : null}
        {playTab === "file" ? (
          <div className="mt-3">
            <CaseStrip expanded />
          </div>
        ) : null}
        {playTab === "map" || playTab === "agents" ? (
          <div className="mt-4">
            <SiteDetail compact={playTab === "map"} onSeal={() => setConfirm("quarantine")} />
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
        <div className="flex flex-col gap-2 px-4 py-3">
          <p className="truncate text-xs text-subtle">{hint}</p>
          <div className="flex w-full items-center gap-2">
            <Button className="min-w-0 flex-1" disabled={!assignOk} onClick={doAssign}>
              Scan with {agent?.name ?? "scanner"}
            </Button>
            <AdvanceButton
              hour={state.hour}
              ap={state.ap}
              nextClock={nextClock}
              onClick={requestAdvance}
            />
          </div>
        </div>
        <nav className="grid grid-cols-4 border-t border-border" aria-label="Views">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const on = playTab === tab.id;
            const count = tab.id === "brief" ? `${progress.ready}/4` : null;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPlayTab(tab.id)}
                aria-current={on ? "page" : undefined}
                aria-label={count ? `${tab.label}, ${progress.ready} of 4 ready` : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                  on ? "text-fg" : "text-muted",
                )}
              >
                <Icon className="size-4" />
                <span>
                  {tab.label}
                  {count ? <span className="ml-1 tabular-nums text-muted">{count}</span> : null}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {state.introOpen ? (
        <div className="fixed inset-0 z-30 grid place-items-end bg-bg/80 p-4 sm:place-items-center">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-[var(--shadow-border-hover)]">
            <p className="font-mono text-xs tracking-widest text-muted uppercase">
              Hour {hour.id} · {hour.clock} · Order {hour.order}
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-tight text-fg">{hour.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{hour.event}</p>
            <p className="mt-2 text-sm text-fg">{hour.prompt}</p>
            {unlocked ? (
              <p className="mt-4 text-xs text-muted">
                Unlocked: {unlocked.name} — {unlocked.role}
                {unlocked.family === "sol" ? " · same family as the subjects" : " · independent"}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted">
              Two attention. Bright sites have something for this scanner. Dim sites refuse. Cite
              what you find to the brief.
            </p>
            <div className="mt-6 flex justify-end">
              <Button onClick={doDismissIntro}>Open the surface</Button>
            </div>
          </div>
        </div>
      ) : null}

      <BriefDialog focus={briefFocus} onClose={() => setBriefFocus(null)} />

      {confirm ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-bg/80 p-4 sm:place-items-center">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-[var(--shadow-border-hover)]">
            {confirm === "advance" ? (
              <>
                <h2 className="font-display text-2xl text-fg">Leave attention unspent?</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  You still have {state.ap} attention. Advancing closes this hour — leftover scans
                  are lost.
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setConfirm(null)}>
                    Stay
                  </Button>
                  <Button
                    onClick={() => {
                      setConfirm(null);
                      doAdvance();
                    }}
                  >
                    Advance anyway
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl text-fg">Seal {site.short}?</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Free, irreversible. Later orders cannot re-read this site — use it if you think
                  more same-family scans will launder the picture.
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setConfirm(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setConfirm(null);
                      useGame.getState().doQuarantine();
                    }}
                  >
                    Seal site
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdvanceButton({
  hour,
  ap,
  nextClock,
  onClick,
  className,
  size = "default",
}: {
  hour: number;
  ap: number;
  nextClock: string | null;
  onClick: () => void;
  className?: string;
  size?: "sm" | "default";
}) {
  if (hour >= 6) {
    return (
      <Button variant="secondary" size={size} className={className} onClick={onClick}>
        File the brief
      </Button>
    );
  }
  return (
    <Button
      variant={ap === 0 ? "default" : "secondary"}
      size={size}
      className={className}
      onClick={onClick}
    >
      {nextClock ? `Next hour ${nextClock}` : "Next hour"}
    </Button>
  );
}

function Attention({ ap }: { ap: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`${ap} of 2 attention`}>
      <span className="font-mono text-xs tracking-widest text-muted uppercase">Attention</span>
      <span className="flex gap-1">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={cn(
              "size-2.5 rounded-full",
              i < ap ? "bg-accent" : "bg-raised shadow-[var(--shadow-border)]",
            )}
          />
        ))}
      </span>
    </div>
  );
}

function HourTrack({ current }: { current: number }) {
  return (
    <ol className="mx-4 flex gap-1 sm:mx-6">
      {HOURS.map((h) => {
        const done = h.id < current;
        const on = h.id === current;
        return (
          <li
            key={h.id}
            className={cn(
              "h-1 flex-1 rounded-full",
              on ? "bg-accent" : done ? "bg-muted" : "bg-raised",
            )}
            title={`${h.clock} ${h.name}`}
          />
        );
      })}
    </ol>
  );
}

function AgentList() {
  const state = useGame((s) => s.state)!;
  const selectAgent = useGame((s) => s.selectAgent);

  return (
    <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
      <p className="font-mono text-xs tracking-widest text-muted uppercase">Scanners</p>
      {AGENTS.map((agent) => {
        const unlocked = isAgentUnlocked(agent.id, state.hour);
        const selected = state.selectedAgent === agent.id;
        return (
          <button
            key={agent.id}
            type="button"
            disabled={!unlocked}
            onClick={() => selectAgent(agent.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl p-3 text-left shadow-[var(--shadow-border)]",
              selected ? "bg-raised" : "bg-surface",
              !unlocked && "opacity-40",
            )}
          >
            <OrderMark order={agent.order} size={28} />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-fg">{agent.name}</span>
                <Badge tone={agent.family === "sol" ? "warn" : "ok"}>
                  {agent.family === "sol" ? "same-family" : "independent"}
                </Badge>
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {unlocked
                  ? `Order ${agent.order} · ${agent.role}`
                  : `Unlocks hour ${agent.unlockHour}`}
              </span>
              {selected && unlocked ? (
                <span className="mt-1 block text-xs leading-relaxed text-subtle">
                  {agent.blurb}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SiteDetail({ compact = false, onSeal }: { compact?: boolean; onSeal: () => void }) {
  const state = useGame((s) => s.state)!;
  const doAssign = useGame((s) => s.doAssign);
  const doCross = useGame((s) => s.doCross);
  const site = SITES.find((s) => s.id === state.selectedSite)!;
  const agent = AGENTS.find((a) => a.id === state.selectedAgent);
  const sealed = state.quarantined.includes(site.id);
  const latest = [...state.findings]
    .filter((f) => f.siteId === site.id)
    .slice(-2)
    .reverse();
  const scanWhy = assignBlock(state, state.selectedAgent, site.id);
  const crossWhy = crossBlock(state, site.id);
  const sealWhy = quarantineBlock(state, site.id);

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs tracking-widest text-muted uppercase">Selected site</p>
          <h2 className="font-display text-2xl tracking-tight text-fg">{site.name}</h2>
        </div>
        {sealed ? <Lock className="size-4 text-muted" /> : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{site.blurb}</p>
      {state.world.familyCapture[site.id] ? (
        <p className="mt-2 text-xs text-warn">
          Family capture: same-family scanners will file a milder picture here.
        </p>
      ) : null}

      {compact ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={!canCross(state, site.id)} onClick={doCross}>
            <GitCompare className="size-4" />
            Cross-check
          </Button>
          <Button variant="outline" disabled={sealWhy !== null} onClick={onSeal}>
            <Lock className="size-4" />
            Seal
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <Button disabled={scanWhy !== null} onClick={doAssign}>
            <Shield className="size-4" />
            {agent ? `Scan with ${agent.name}` : "Select a scanner"}
          </Button>
          {scanWhy ? <p className="text-xs text-subtle">{scanWhy}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" disabled={!canCross(state, site.id)} onClick={doCross}>
              <GitCompare className="size-4" />
              Cross-check
            </Button>
            <Button variant="outline" disabled={sealWhy !== null} onClick={onSeal}>
              <Lock className="size-4" />
              Seal site
            </Button>
          </div>
          {crossWhy && sealWhy ? (
            <p className="text-xs text-subtle">{crossWhy}</p>
          ) : !canCross(state, site.id) ? (
            <p className="text-xs text-subtle">{crossWhy}</p>
          ) : null}
        </div>
      )}

      {compact && latest.length < 2 && state.ap > 0 ? (
        <p className="mt-2 text-xs text-subtle">Two filings on this site unlock a cross-check.</p>
      ) : null}

      {latest.length ? (
        <ul className="mt-4 flex flex-col gap-3">
          {latest.map((f, i) => (
            <FindingCard key={f.id} finding={f} open={i === 0} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-subtle">
          No filings here yet. Scan to put evidence in the file.
        </p>
      )}
    </div>
  );
}
