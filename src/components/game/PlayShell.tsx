import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Compass,
  FolderClosed,
  GitCompare,
  Keyboard,
  Lock,
  Map as MapIcon,
  Radar,
  ScrollText,
  Users,
} from "lucide-react";
import { AGENTS, HOURS, SITES } from "@/game/data";
import {
  assignBlock,
  briefProgress,
  crossBlock,
  isAgentUnlocked,
  quarantineBlock,
} from "@/game/engine";
import { liveSites, nextStep, type Guide } from "@/game/guide";
import { useGame } from "@/game/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AgentId, PlayTab, QuestionId } from "@/game/types";
import { BriefDialog, BriefEditor, BriefMeter, BriefPanel } from "./Brief";
import { CaseStrip, FindingCard } from "./CaseFile";
import { Coach } from "./Coach";
import { useTutorialDriver } from "./useTutorialDriver";
import { OrderMark } from "./OrderMark";
import { MapLegend, SiteMap } from "./SiteMap";

const TABS: { id: PlayTab; label: string; icon: typeof MapIcon }[] = [
  { id: "map", label: "Surface", icon: MapIcon },
  { id: "agents", label: "Scanners", icon: Users },
  { id: "brief", label: "Brief", icon: ScrollText },
  { id: "file", label: "File", icon: FolderClosed },
];

const SHORTCUTS: [string, string][] = [
  ["1 – 6", "Select a scanner"],
  ["S", "Scan the selected site"],
  ["C", "Cross-check the selected site"],
  ["B", "Open the brief"],
  ["N", "Next hour / file the brief"],
  ["?", "Show these shortcuts"],
];

export function PlayShell() {
  const state = useGame((s) => s.state);
  const playTab = useGame((s) => s.playTab);
  const setPlayTab = useGame((s) => s.setPlayTab);
  const setScreen = useGame((s) => s.setScreen);
  const doAdvance = useGame((s) => s.doAdvance);
  const doAssign = useGame((s) => s.doAssign);
  const doCross = useGame((s) => s.doCross);
  const selectAgent = useGame((s) => s.selectAgent);
  const selectSite = useGame((s) => s.selectSite);
  const doDismissIntro = useGame((s) => s.doDismissIntro);
  const doClearFlash = useGame((s) => s.doClearFlash);
  const [confirm, setConfirm] = useState<"advance" | "quarantine" | null>(null);
  const [briefFocus, setBriefFocus] = useState<QuestionId | null>(null);
  const [help, setHelp] = useState(false);
  const tutorial = useGame((s) => s.tutorial);
  useTutorialDriver();

  useEffect(() => {
    if (!state?.flash) return;
    const t = window.setTimeout(() => doClearFlash(), 3200);
    return () => window.clearTimeout(t);
  }, [state?.flash, doClearFlash]);

  const requestAdvance = useCallback(() => {
    const s = useGame.getState().state;
    if (!s) return;
    if (s.hour >= 6) {
      setScreen("debrief");
      return;
    }
    if (s.ap > 0) setConfirm("advance");
    else doAdvance();
  }, [doAdvance, setScreen]);

  const openBrief = useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) setBriefFocus("motive");
    else setPlayTab("brief");
  }, [setPlayTab]);

  // Keyboard: one key per verb, ignored while typing or while a dialog is up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      const s = useGame.getState().state;
      if (!s || s.ended) return;
      const k = e.key.toLowerCase();
      if (/^[1-6]$/.test(k)) {
        const agent = AGENTS[Number(k) - 1];
        if (isAgentUnlocked(agent.id, s.hour)) selectAgent(agent.id);
      } else if (k === "s") doAssign();
      else if (k === "c") doCross();
      else if (k === "n") requestAdvance();
      else if (k === "b") openBrief();
      else if (k === "?") setHelp(true);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doAssign, doCross, openBrief, requestAdvance, selectAgent]);

  if (!state) return null;

  const hour = HOURS[state.hour - 1];
  const site = SITES.find((s) => s.id === state.selectedSite)!;
  const agent = AGENTS.find((a) => a.id === state.selectedAgent);
  const nextClock = state.hour >= 6 ? null : HOURS[state.hour].clock;
  const scanOk = assignBlock(state, state.selectedAgent, site.id) === null;
  const unlocked = AGENTS.find((a) => a.unlockHour === hour.id);
  const progress = briefProgress(state.brief);
  const guide = nextStep(state);

  const runGuide = (g: Guide) => {
    const a = g.action;
    if (!a) return;
    if (a.kind === "scan") doAssign();
    else if (a.kind === "advance") requestAdvance();
    else if (a.kind === "file") setScreen("debrief");
    else if (a.kind === "site") selectSite(a.siteId);
    else if (a.kind === "agent") selectAgent(a.agentId);
  };

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 pt-3 pb-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <OrderMark order={hour.order} size={36} className="hidden sm:block" />
            <div className="min-w-0">
              <p className="eyebrow tabular-nums">
                {hour.clock} · Hour {hour.id} of 6
                {tutorial !== null ? <span className="text-accent"> · Practice</span> : null}
              </p>
              <h1 className="truncate font-display text-xl leading-tight tracking-tight text-fg sm:text-2xl">
                {hour.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Attention ap={state.ap} />
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:inline-flex"
              onClick={() => setHelp(true)}
              aria-label="Keyboard shortcuts"
            >
              <Keyboard />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setScreen("codex")} aria-label="Codex">
              <BookOpen />
              <span className="hidden sm:inline">Codex</span>
            </Button>
            <AdvanceButton
              hour={state.hour}
              ap={state.ap}
              nextClock={nextClock}
              onClick={requestAdvance}
              className="hidden lg:inline-flex"
            />
          </div>
        </div>
        <DayTrack current={state.hour} />
      </header>

      <div
        className={cn(
          "mx-auto hidden w-full max-w-7xl px-6 pt-4 lg:block",
          // Practice: keep the coach in view under the header while the page scrolls.
          tutorial !== null && "sticky top-24 z-20",
        )}
      >
        {tutorial !== null ? (
          <Coach className="bg-surface/95 backdrop-blur-md" />
        ) : (
          <GuideBar guide={guide} onRun={runGuide} />
        )}
      </div>

      <div className="mx-auto mt-4 hidden w-full max-w-7xl flex-1 grid-cols-12 gap-5 px-6 pb-10 lg:grid">
        <aside className="col-span-3" aria-label="Scanners">
          <AgentList />
        </aside>
        <section className="col-span-5 flex flex-col gap-5" aria-label="Surface and brief">
          <div className="panel p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="eyebrow">Incident surface</p>
              <p className="text-xs text-subtle">
                {agent ? `Lit for ${agent.name}` : "Pick a scanner"}
              </p>
            </div>
            <SiteMap />
            <div className="mt-2 border-t border-border pt-3">
              <MapLegend />
            </div>
          </div>
          <BriefPanel onOpen={setBriefFocus} />
        </section>
        <aside className="col-span-4 flex flex-col gap-5" aria-label="Site and case file">
          <SiteDetail onSeal={() => setConfirm("quarantine")} />
          <CaseStrip />
        </aside>
      </div>

      <main
        className={cn("flex flex-1 flex-col px-4 pb-48 lg:hidden", tutorial !== null && "pb-80")}
      >
        {playTab === "map" ? (
          <div className="panel mt-4 p-3">
            <SiteMap />
            <div className="mt-1 border-t border-border px-1 pt-3 pb-1">
              <MapLegend />
            </div>
          </div>
        ) : null}
        {playTab === "agents" ? (
          <div className="mt-4">
            <AgentList />
          </div>
        ) : null}
        {playTab === "brief" ? (
          <div className="panel mt-4 p-5">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-3xl tracking-tight text-fg">The brief</h2>
              <BriefMeter ready={progress.ready} answered={progress.answered} />
            </div>
            <BriefEditor />
          </div>
        ) : null}
        {playTab === "file" ? (
          <div className="mt-4">
            <CaseStrip expanded />
          </div>
        ) : null}
        {playTab === "map" || playTab === "agents" ? (
          <div className="mt-4">
            <SiteDetail compact onSeal={() => setConfirm("quarantine")} />
          </div>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="flex flex-col gap-2.5 px-4 pt-3 pb-2">
          {tutorial !== null ? (
            <Coach compact />
          ) : (
            <GuideBar guide={guide} onRun={runGuide} compact />
          )}
          <div className="flex w-full items-center gap-2">
            <Button
              className="min-w-0 flex-1"
              disabled={!scanOk}
              onClick={doAssign}
              data-tour="scan"
            >
              <Radar />
              <span className="truncate">
                Scan {site.short}
                {agent ? ` · ${agent.name}` : ""}
              </span>
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
            const count =
              tab.id === "brief"
                ? `${progress.ready}/4`
                : tab.id === "file"
                  ? `${state.findings.length + state.crossNotes.length}`
                  : null;
            return (
              <button
                key={tab.id}
                type="button"
                data-tour={tab.id === "brief" ? "brief" : undefined}
                onClick={() => setPlayTab(tab.id)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
                  on ? "text-fg" : "text-subtle",
                )}
              >
                {on ? (
                  <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />
                ) : null}
                <Icon className="size-4" />
                <span>
                  {tab.label}
                  {count ? <span className="ml-1 tabular-nums text-subtle">{count}</span> : null}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <Toast message={state.flash} high={tutorial !== null} />

      <Modal
        open={state.introOpen}
        onOpenChange={(o) => (!o ? doDismissIntro() : undefined)}
        className="sm:max-w-lg"
        eyebrow={
          <div className="flex items-center gap-4">
            <OrderMark order={hour.order} size={56} animate key={hour.id} />
            <div>
              <p className="font-display text-4xl leading-none tabular-nums text-fg">
                {hour.clock}
              </p>
              <p className="eyebrow mt-1.5">
                Hour {hour.id} of 6 · Order {hour.order}
              </p>
            </div>
          </div>
        }
        title={hour.name}
      >
        <p className="mt-3 text-sm leading-relaxed text-muted">{hour.event}</p>
        <p className="mt-4 border-l-2 border-accent/60 pl-3 font-display text-lg leading-snug text-fg italic">
          {hour.prompt}
        </p>
        {unlocked ? (
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-raised p-4 shadow-[var(--shadow-border)]">
            <OrderMark order={unlocked.order} size={32} />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm text-fg">
                <span className="eyebrow">Unlocked</span>
                <span className="font-medium">{unlocked.name}</span>
                <Badge tone={unlocked.family === "sol" ? "warn" : "ok"}>
                  {unlocked.family === "sol" ? "same-family" : "independent"}
                </Badge>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{unlocked.blurb}</p>
            </div>
          </div>
        ) : null}
        <ul className="mt-5 grid grid-cols-1 gap-2 text-xs text-muted sm:grid-cols-3">
          <li className="rounded-xl bg-bg/50 px-3 py-2">
            <span className="block text-fg">2 attention</span>
            Scan or cross-check, 1 each
          </li>
          <li className="rounded-xl bg-bg/50 px-3 py-2">
            <span className="block text-fg">Bright sites</span>
            have work for your scanner
          </li>
          <li className="rounded-xl bg-bg/50 px-3 py-2">
            <span className="block text-fg">Cite</span>
            filings to the brief
          </li>
        </ul>
        <div className="mt-6 flex justify-end">
          <ModalClose asChild>
            <Button size="lg" className="w-full sm:w-auto">
              Open the surface
              <ArrowRight />
            </Button>
          </ModalClose>
        </div>
      </Modal>

      <BriefDialog focus={briefFocus} onClose={() => setBriefFocus(null)} />

      <Modal
        open={confirm === "advance"}
        onOpenChange={(o) => (!o ? setConfirm(null) : undefined)}
        title="Leave attention unspent?"
        description={`You still have ${state.ap} attention. Advancing closes this hour — unspent attention is lost.`}
      >
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ModalClose asChild>
            <Button variant="ghost">Stay</Button>
          </ModalClose>
          <Button
            onClick={() => {
              setConfirm(null);
              doAdvance();
            }}
          >
            Advance to {nextClock}
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirm === "quarantine"}
        onOpenChange={(o) => (!o ? setConfirm(null) : undefined)}
        title={`Seal ${site.short}?`}
        description="Free and irreversible. No scanner can read this site again — use it if you think a same-family re-read would launder the picture."
      >
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ModalClose asChild>
            <Button variant="ghost">Cancel</Button>
          </ModalClose>
          <Button
            onClick={() => {
              setConfirm(null);
              useGame.getState().doQuarantine();
            }}
          >
            <Lock />
            Seal site
          </Button>
        </div>
      </Modal>

      <Modal open={help} onOpenChange={setHelp} title="Keyboard shortcuts">
        <dl className="mt-5 flex flex-col divide-y divide-border">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted">{v}</dt>
              <dd>
                <kbd className="rounded-md bg-raised px-2 py-1 text-xs text-fg shadow-[var(--shadow-border-hover)]">
                  {k}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </Modal>
    </div>
  );
}

function GuideBar({
  guide,
  onRun,
  compact = false,
  className,
}: {
  guide: Guide;
  onRun: (g: Guide) => void;
  compact?: boolean;
  className?: string;
}) {
  const a = guide.action;
  const showAction =
    a && (a.kind === "site" || a.kind === "agent" || (!compact && a.kind !== "advance"));
  const label =
    a?.kind === "site" || a?.kind === "agent"
      ? a.label
      : a?.kind === "scan"
        ? "Scan"
        : a?.kind === "file"
          ? "File the brief"
          : null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3",
        !compact && "rounded-2xl bg-surface/80 px-4 py-2.5 shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <Compass aria-hidden className="size-4 shrink-0 text-accent" />
      <p
        className={cn(
          "min-w-0 flex-1 text-sm text-fg",
          compact && "line-clamp-2 text-xs leading-snug text-muted",
        )}
      >
        {guide.text}
      </p>
      {showAction && label ? (
        <Button
          variant="secondary"
          size="sm"
          className={cn(compact && "h-8")}
          onClick={() => onRun(guide)}
        >
          {label}
          <ArrowRight />
        </Button>
      ) : null}
    </div>
  );
}

function Toast({ message, high = false }: { message: string | null; high?: boolean }) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 lg:top-auto lg:bottom-8",
        // During practice the phone's bottom stack holds the coach; float above the page instead.
        high ? "top-24" : "bottom-52",
      )}
    >
      {message ? (
        <p
          key={message}
          className="flex max-w-md animate-in items-center gap-2.5 rounded-full bg-overlay py-2.5 pr-5 pl-3 text-sm text-fg shadow-[var(--shadow-float)] duration-300 fade-in-0 slide-in-from-bottom-3"
        >
          <span className="grid size-6 place-items-center rounded-full bg-accent text-accent-fg">
            <Radar className="size-3.5" aria-hidden />
          </span>
          <span className="line-clamp-2">{message}</span>
        </p>
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
}: {
  hour: number;
  ap: number;
  nextClock: string | null;
  onClick: () => void;
  className?: string;
}) {
  if (hour >= 6) {
    return (
      <Button
        variant={ap === 0 ? "default" : "secondary"}
        className={className}
        onClick={onClick}
        data-tour="advance"
      >
        <ScrollText />
        File the brief
      </Button>
    );
  }
  return (
    <Button
      variant={ap === 0 ? "default" : "secondary"}
      className={className}
      onClick={onClick}
      data-tour="advance"
    >
      <span className="tabular-nums">{nextClock}</span>
      <ArrowRight />
    </Button>
  );
}

function Attention({ ap }: { ap: number }) {
  return (
    <div
      className="flex h-9 items-center gap-2 rounded-full bg-surface/80 px-3 shadow-[var(--shadow-border)]"
      role="img"
      aria-label={`${ap} of 2 attention left`}
      title="Attention: each scan or cross-check costs 1"
    >
      <span className="eyebrow hidden sm:inline">Attention</span>
      <span className="flex gap-1.5">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={cn(
              "size-2.5 rounded-full transition-[background-color,box-shadow,transform] duration-300",
              i < ap
                ? "bg-accent shadow-[0_0_10px_0_var(--color-accent)]"
                : "scale-90 bg-transparent shadow-[inset_0_0_0_1px_var(--color-subtle)]",
            )}
          />
        ))}
      </span>
    </div>
  );
}

function DayTrack({ current }: { current: number }) {
  return (
    <ol
      className="mx-auto flex w-full max-w-7xl gap-1 px-4 pb-2.5 sm:px-6"
      aria-label={`Hour ${current} of 6`}
    >
      {HOURS.map((h) => {
        const done = h.id < current;
        const on = h.id === current;
        return (
          <li key={h.id} className="flex-1" aria-current={on ? "step" : undefined}>
            <span
              className={cn(
                "block h-1 rounded-full transition-colors duration-500",
                on ? "bg-accent" : done ? "bg-muted/50" : "bg-border",
              )}
            />
            <span
              className={cn(
                "mt-1 hidden font-mono text-[0.6875rem] tabular-nums sm:block",
                on ? "text-fg" : done ? "text-subtle" : "text-subtle/60",
              )}
            >
              {h.clock}
              <span className="ml-1.5 hidden xl:inline">{h.name}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AgentList() {
  const state = useGame((s) => s.state)!;
  const selectAgent = useGame((s) => s.selectAgent);

  return (
    <div className="flex flex-col gap-2">
      <p className="eyebrow mb-1 hidden lg:block">Scanners</p>
      {AGENTS.map((agent, i) => {
        const unlocked = isAgentUnlocked(agent.id, state.hour);
        const selected = state.selectedAgent === agent.id;
        const lit = unlocked ? liveSites(state, agent.id as AgentId).length : 0;
        return (
          <button
            key={agent.id}
            type="button"
            disabled={!unlocked}
            aria-pressed={selected}
            onClick={() => selectAgent(agent.id)}
            className={cn(
              "group relative flex items-start gap-3 rounded-2xl p-3.5 text-left transition-[background-color,box-shadow] duration-150",
              selected
                ? "bg-raised shadow-[0_0_0_1px_var(--color-accent)]"
                : "bg-surface/80 shadow-[var(--shadow-border)] hover:bg-raised hover:shadow-[var(--shadow-border-hover)]",
              !unlocked &&
                "bg-transparent opacity-50 shadow-[var(--shadow-border)] hover:bg-transparent",
            )}
          >
            <OrderMark order={agent.order} size={34} className={cn(!unlocked && "text-subtle")} />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-fg">{agent.name}</span>
                <Badge tone={agent.family === "sol" ? "warn" : "ok"}>
                  {agent.family === "sol" ? "same-family" : "independent"}
                </Badge>
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {unlocked ? (
                  `Order ${agent.order} · ${agent.role}`
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Lock className="size-3" aria-hidden />
                    Unlocks at {HOURS[agent.unlockHour - 1].clock}
                  </span>
                )}
              </span>
              {unlocked && state.ap > 0 ? (
                <span
                  className={cn(
                    "mt-1.5 inline-flex items-center gap-1.5 text-xs",
                    lit ? "text-fg" : "text-subtle",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("size-1.5 rounded-full", lit ? "bg-accent" : "bg-subtle/50")}
                  />
                  {lit ? `${lit} ${lit === 1 ? "site" : "sites"} lit` : "Spent this hour"}
                </span>
              ) : null}
              {selected && unlocked ? (
                <span className="mt-2 block animate-rise text-xs leading-relaxed text-subtle">
                  {agent.blurb}
                </span>
              ) : null}
            </span>
            {unlocked ? (
              <kbd className="hidden rounded-md px-1.5 py-0.5 text-[0.6875rem] text-subtle shadow-[var(--shadow-border)] lg:block">
                {i + 1}
              </kbd>
            ) : null}
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
  const onSite = state.findings.filter((f) => f.siteId === site.id);
  const latest = [...onSite].slice(-2).reverse();
  const scanWhy = assignBlock(state, state.selectedAgent, site.id);
  const crossWhy = crossBlock(state, site.id);
  const sealWhy = quarantineBlock(state, site.id);
  const captured = state.world.familyCapture[site.id];

  return (
    <section aria-labelledby="site-title" className="panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Selected site</p>
          <h2 id="site-title" className="mt-0.5 font-display text-2xl tracking-tight text-fg">
            {site.name}
          </h2>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5 pt-1">
          {sealed ? (
            <Badge>
              <Lock className="mr-1 size-3" aria-hidden />
              sealed
            </Badge>
          ) : null}
          {captured ? <Badge tone="warn">captured</Badge> : null}
          <Badge>
            {onSite.length} {onSite.length === 1 ? "filing" : "filings"}
          </Badge>
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{site.blurb}</p>
      {captured ? (
        <p className="mt-3 flex gap-2 rounded-xl bg-warn/10 px-3 py-2 text-xs leading-relaxed text-warn">
          <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full bg-warn" />
          Family capture: same-family scanners will file a milder picture here.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        {!compact ? (
          <>
            <Button size="lg" disabled={scanWhy !== null} onClick={doAssign} data-tour="scan">
              <Radar />
              {agent ? `Scan with ${agent.name}` : "Select a scanner"}
              <kbd className="ml-auto hidden rounded bg-accent-fg/10 px-1.5 text-xs xl:inline">
                S
              </kbd>
            </Button>
            {scanWhy ? <Reason>{scanWhy}</Reason> : null}
          </>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            disabled={crossWhy !== null}
            onClick={doCross}
            data-tour="cross"
          >
            <GitCompare />
            Cross-check
          </Button>
          <Button variant="outline" disabled={sealWhy !== null} onClick={onSeal}>
            <Lock />
            Seal
          </Button>
        </div>
        {crossWhy && !(compact && state.ap === 0) ? (
          <Reason>Cross-check: {crossWhy.toLowerCase()}</Reason>
        ) : null}
      </div>

      {latest.length ? (
        <div className="mt-5">
          <p className="eyebrow mb-2">Latest here</p>
          <ul className="flex flex-col gap-3">
            {latest.map((f, i) => (
              <FindingCard key={f.id} finding={f} open={i === 0} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-border px-3.5 py-3 text-xs text-subtle">
          No filings here yet. Scan to put evidence in the file.
        </p>
      )}
    </section>
  );
}

function Reason({ children }: { children: ReactNode }) {
  return <p className="px-1 text-xs leading-relaxed text-subtle">{children}</p>;
}
