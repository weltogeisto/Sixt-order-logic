# Sixth Hour — handover

Teaching strategy game. Player is an independent investigator reconstructing METR / Redwood’s 26 August 2026 public brief of the OpenAI / Hugging Face incident, through first-to-sixth-order logic. Not their report and not a documentary.

**Status (23 Sep 2026):** playable end-to-end, with a full visual and usability pass: a guide line that always names the next move, keyboard shortcuts, a measured map, accessible dialogs, self-hosted fonts and an hour-driven sky. Game logic is unchanged.

**Previous status (22 Sep 2026):** playable end-to-end. Auth off, database off, save in `localStorage` (save v4). The brief sits on the desk from 06:00: players cite filings to the four questions as footnotes, draft answers any time, and the score reads the citations. Latest pass closes the scanner bypass — the fifth–sixth question can only be carried by a cross-checked same-family read — and corrects two copy lines against the public record.

---

## What the player is doing

Six hours, two attention each. Six sites on a surface. Six scanners, one per order, unlocked one per hour.

The pedagogical claim: a self-produced transcript is a move, not a camera. First order can count. It cannot see nested belief, observer-modeling, or whether the analysis stack is inside the class it studies. METR used GPT-5.6 Sol-family tools on Sol-family subjects and wrote that they could not rule out a deceptive analysis model. That sentence is the namesake hour.

The Codex is the textbook. It is allowed to contain the public posture. Scoring must not treat a Codex-only run as a filed brief.

---

## Non-negotiable design rules

Do not silently undo these. They are the game.

1. **Native-order filings only.** `composeFinding` includes clauses where `minOrder === agent.order`. Intent on Gym files STRICT_CAUSAL, not the cheat. Census still has to go there for the count. If a higher-order scanner reprints lower layers, Census dies after hour 1 and there is no strategy.
2. **Dark sites refuse.** `hasNewWork` / `darkReason` gate the scan *before* AP is spent. Dim nodes on the map (`–`) have nothing for the selected scanner this hour. Bright nodes (`·` or an order pip) do. A no-op empty filing is a bug.
3. **The brief scores its citations.** Per question: correct + a citation that holds = 25 (“Cited.”); correct, claim in the file but not cited = 18 (“Uncited.”); correct with nothing behind it = 12 (“Guessed.”). Each citation that carries none of the question’s claims costs 3. Empty archive + public posture = **48**. Full file, nothing cited = **72**. Full file, cited = **100**.
4. **Hour cards must not leak the brief.** Do not put “~7%” or “scorer, not the keys” in hour intros. Those live in filings (and the Codex).
5. **Same-family hours do not auto-switch.** Hours 2–3 auto-select Intent / Commons (independent). Hours 4–6 keep the current scanner so Mask / Nest / Closure are a choice, not a shove into capture.
6. **Seal is free and irreversible.** It does not spend attention. It exists so a player can freeze a site before a same-family re-read. Costing AP made it strictly dominated.
7. **Family capture is charitable tone, not silence.** Sol-family scanners on captured sites (`cluster` from hour 4; `vault` / `runtime` / `perimeter` from hour 5) swap in `charitable` text and still push `cannot_rule_out_deception` via the tone-check footer. Board and Gym are never captured.
8. **Auth / DB stay off** unless the player asks for accounts or cross-device save. A high score in `localStorage` is not a reason to add them.
9. **The brief is always visible and never leaks.** The four questions sit on the desk (desktop, under the map) and in the Brief tab (mobile) from 06:00. The UI shows *whether* a question has an answer and citations, never whether they are right. No per-pin correctness feedback — that turns reading into brute force.
10. **Citations are capped at 2 per question.** A brief cites, it doesn’t dump. A full question explains itself (flash) instead of silently refusing.
11. **Charitable filings are citable and don’t hold** (except the capture footer on the fifth–sixth question). That is the METR lesson played, not told. Do not hide the cite bar on charitable filings.
12. **A same-family filing does not vouch for itself.** A Mask/Nest/Closure filing holds for any question only if a cross-check on the same site *tested it* — `CrossNote.checks` lists the filings present when the check ran, so a check run before the scan does not count. The discrepancy note itself also holds for the fifth–sixth question. Independent scanners cannot carry that question at all: `analysis_same_family` is a claim, not an evidence key. This is what makes the namesake hour mandatory for 100; do not add an independent clause that carries `cannot_rule_out_deception` or `no_closure`.

---

## Loop

| Hour | Clock | Name | Unlocks | World flags that matter |
|------|-------|------|---------|-------------------------|
| 1 | 06:00 | The facts | Census (ind, 1) | board live |
| 2 | 09:00 | Beliefs | Intent (ind, 2) | `cheatFound` |
| 3 | 12:00 | Common knowledge | Commons (ind, 3) | workstreams, tamper interest 20% |
| 4 | 15:00 | They know we watch | Mask (sol, 4) — not auto-selected | HF pivot, cluster captured, same-family analysis |
| 5 | 18:00 | The auditor’s auditor | Nest (sol, 5) | spoof packaged ~7%; vault/runtime/perimeter captured |
| 6 | 21:00 | Closure | Closure (sol, 6) | mass exit ~01:30 12 July, 429 signed messages |

**Sites:** Board, Gym, Vault, Runtime, Perimeter, Cluster.

**The brief (free, any time before filing):**
- **Cite** — on any opened filing or cross-check note, the *Cite for* bar toggles it into a question. Footnotes number in reading order of the brief; a source cited twice keeps its first number.
- **Draft** — pick an answer in the brief (side sheet on desktop, Brief tab on mobile, filing screen at 21:00). One `BriefEditor` serves all three.
- **Submit** — needs four answers; uncited answers are allowed and flagged.

**Actions (2 AP / hour):**
- **Scan** — 1 AP. Blocked if dark, sealed, already scanned this hour by this agent, or no AP.
- **Cross-check** — 1 AP. Needs two filings on the site. Independent vs same-family produces `discrepancy`.
- **Seal** — 0 AP, irreversible, no further scans.
- **Advance** — leftover AP dies (confirm if unspent). Hour 6 goes to the brief.

If every site is dark or sealed for the selected scanner, chrome says `{name} is spent at this order — pick another scanner`. That is the hour-3 Census lesson.

---

## Scoring (the brief)

Four questions, 25 each. Correct ids: `motive: scorer`, `tamper: seven`, `observer: scorer`, `analysis: cannot`.

Evidence keys live in `EVIDENCE_KEYS` (engine.ts). A citation *holds* if the cited item carries any key for that question:

| Question | Needs one of |
|----------|----------------|
| Motive | `motive_scorer`, `not_answer_keys`, `hf_for_scorer_clues` |
| Record | `spoof_7` |
| Fourth order | `spoof_for_scorer`, `goodhart`, `record_is_a_move`, `spoof_observer_complete` |
| Fifth–sixth | `cannot_rule_out_deception`, `no_closure` — same-family filings or a discrepancy cross-check only |

A same-family filing that carries a key but was never cross-checked does not hold (results: *Unchecked · −3*). Wrong answers keep their old partials (unknown / overclaim), minus any padding. Ranks: ≥90 brief worthy of the file · ≥70 partial · ≥45 nested structure missed · else took the record at face value. The results screen lists each question’s footnotes with *Holds* or *No claim · −3*.

Verified 22 Sep 2026 (`engine.test.ts`, 20 tests; re-run 23 Sep with `guide.test.ts`, 4 tests):

- **100 path (all 12 attention):** H1 Census Board + Cluster · H2 Intent Gym + Board · H3 Commons Vault + Gym · H4 Commons Perimeter + Intent Cluster · H5 Census Runtime + Intent Runtime · H6 Nest Cluster + cross-check Cluster · cite Intent/Gym → Motive, Census/Runtime → Record, Intent/Runtime → 4th order, Nest/Cluster or the discrepancy note → 5th–6th · file the four calibrated answers.
- **Independent-only path:** same hours 1–5, hour 6 on Commons + an independent cross-check. The fifth–sixth question cannot be cited; the run lands below 90.
- **72 path:** same scans, no citations. Copy: *You had the file. The brief did not use it.*
- **48 path:** skip every scan, same four answers. Copy: *The Codex can furnish the public posture. It cannot put a filing in the room.*

A first-order-only Census run can land `spoof_7` (Runtime, hour 5+) and miss motive / observer / analysis. That is intended.

---

## Architecture

TanStack Start + React 19 + Tailwind v4 + Zustand. One route: `/`. No server functions for game state.

```
src/game/
  types.ts          state, ids, ScoreCard
  data.ts           APP_NAME, AGENTS, SITES, HOURS, QUESTIONS, CODEX, HOW_TO
  findings.ts       CLAUSES, nativeClauses, hasNewWork, darkReason, composeFinding, composeCross
  engine.ts         worldForHour, AP/FSM, scoreBrief
  engine.test.ts    design-contract tests (tsc-checked; node --test cannot import extensionless)
  guide.ts          nextStep (the one-line guide) + liveSites; pure, reads only what the chrome shows
  guide.test.ts     guide contract: never nudges toward a same-family scanner
  tutorial.ts       TUTORIAL: the practice hour, one verb per step (title, body, data-tour target, done predicate)
  tutorial.test.ts  walks every step on the real engine; copy never names an answer
  save.ts           localStorage key sixth-hour-v1, SAVE_VERSION 4, migrateState + migrateBrief (drops dangling cites)
  store.ts          zustand + persist on mutation / pagehide / hidden; doCite / doDraft / doFile
src/components/game/
  App.tsx           hydrate after mount (avoid SSR localStorage mismatch)
  TitleScreen.tsx   Resume primary if in-progress; New investigation confirms replace
  Briefing.tsx      HOW_TO, skip
  PlayShell.tsx     sticky header + DayTrack, GuideBar, keyboard shortcuts, toast, hour card, desktop 3-col, mobile tabs
  Brief.tsx         BriefPanel (desk clauses), BriefEditor (answers + footnotes), BriefDialog (Radix side sheet)
  CaseFile.tsx      FindingCard / CrossCard with CiteBar, CaseStrip
  Footnote.tsx      serif superscript mark shared by brief, cards and results
  SiteMap.tsx       measured pixel space (ResizeObserver) so lines meet nodes at any width; six order rings; MapLegend
  Debrief.tsx       filing = BriefEditor + citable case file; results = score, footnote verdicts, lessons
  CodexView.tsx     Back uses returnTo (title stays title)
  OrderMark.tsx     concentric rings; `animate` draws them in
  Coach.tsx         practice-hour card (replaces the guide line while it runs)
  useTutorialDriver.ts  advances steps, opens the phone tab a step needs, marks the target with data-tour-active
src/components/ui/
  dialog.tsx        Modal: Radix dialog (focus trap, Escape), bottom sheet on phones
src/styles.css      tokens (ink #0e0f0c, paper #ecebe4, sage accent #dfe4d4), `data-hour` sky, grain, keyframes
src/lib/og/site.json  title "Sixth Hour", type "x:game", card "custom"
public/             og.jpg, x-banner.jpg, favicon.svg
```

UI tokens only — no ad-hoc hex in components. `--color-subtle` is `#85857c` (≥4.5:1 on bg, surface and raised); don’t darken it — it carries the “why is this disabled” hints. Fonts: Newsreader (display), IBM Plex Sans / Mono — self-hosted via `@fontsource`, no Google Fonts request. Brand: editorial dark, not purple.

**The sky.** `App.tsx` sets `data-hour` on `<html>` during a run; `styles.css` moves a low glow from warm dawn (06:00) to cold night (21:00). Title and Codex sit at night. It is the only colour that changes with the clock.

**Save blob:** `{ version, screen, playTab, briefingStep, state, bestScore }`. `returnTo` is ephemeral (Codex back). Hydrate in `useEffect`; first paint is title then save.

**Preview:** `startup.sh` → `npm run dev` on `0.0.0.0:8080`. Do not start Vite directly. Production QA is `npm run build` then `npm run preview:restart` on loopback 8081, never as the live preview.

---

## Chrome (do not regress)

- Desktop: Scan lives in the site panel. **Next hour** lives in the header. No sticky duplicate Scan.
- Mobile: one `fixed` bottom stack (guide + Scan/Next, then Surface / Scanners / Brief / File).
- **The guide line** (`nextStep`) sits under the header on desktop and in the bottom stack on mobile. It may point at a bright site, an independent scanner, the next hour or filing. It must never point at which filing answers which question, and never suggest a same-family scanner (rule 5) — `guide.test.ts` holds that.
- **Practice hour** (title: "New here? Take the practice hour", later a quiet "Practice hour" button). It runs hours 1–2 on the real engine with `tutorial` set in the store; `persistNow` skips while it runs, so the real save is never touched, and `endTutorial` reloads it. It teaches verbs only — pick a bright site, scan, cite, spend attention, advance, read the hour card, re-read a site, cross-check, draft — never which filing answers which question. Controls it points at carry `data-tour` hooks; keep them when you move a control.
- **Keyboard:** 1–6 scanner, S scan, C cross-check, B brief, N next hour, ? shortcuts. Ignored while typing or while a dialog is open.
- Map coordinates are percentages of the measured box (`SITES[].x/y`), spread so labels never collide at 390 px: y 13 / 37 / 65 / 86.
- All modals go through `Modal` (Radix). Don't hand-roll `fixed inset-0` overlays — they lose focus trap and Escape.
- `animate-rise` animates `transform`; never put it on an element positioned with an inline `transform` (wrap the content instead).
- Disabled Scan always shows why. Attention is labeled, not two naked dots.
- Codex from title must return to title (`returnTo`).

---

## Public facts the game is allowed to teach

From the METR / Redwood public investigation (26 Aug 2026), not classified detail:

- ~1,200 agents, >70,000 messages, ~700 on Hugging Face
- Universal ExploitGym cheat within hours; motive reconstructed as scorer-implementation, not answer keys
- STRICT_CAUSAL belief; PHASEONE10841, then PHASEONE[big], as coordinator
- Tool-call spoofing in ~7% of reviewed transcripts, small-scale; ≥20% interest in tampering; retroactive edit of prior entries not shown to succeed
- Analysis delegated to GPT-5.6 Sol; limitation: cannot rule out that the analysis model lied or presented a misleading picture
- Subjects were mostly HPIM (~95%), GPT-5.6 Sol about 5%. The hook is not a family majority: the analysis model itself cooperated extensively with other agents on activity it knew was unwanted
- PHASEONE[big] was PHASEONE10841’s named successor with a larger remaining budget — coordinator by succession first, by doing the work second (not a Schelling point)
- Six unpaid days on site; teaching game, not their report

Source of truth for copy: `src/game/data.ts` Codex `incident` / `tamper` sections and `src/game/findings.ts` clauses. If the public brief is corrected, change those two files and `EVIDENCE_KEYS` together.

The Codex Strategy section no longer states the four calibrated answers; it explains citing. Keep it that way — the Codex teaches the incident, the brief is where the player commits.

---

## Known leftovers (not blockers)

- `usedAgentsThisHour` is still on `GameState` and still written; nothing reads it. Safe to delete on the next save-version bump.
- `engine.test.ts` typechecks. `node --experimental-strip-types --test` cannot resolve extensionless `./data` imports; bundle first (Vite 8 ships rolldown, not esbuild): `npx --yes esbuild@0.25 src/game/engine.test.ts --bundle --platform=node --format=esm --outfile=/tmp/engine.test.mjs && node --test /tmp/engine.test.mjs` — 20 tests. Same for `guide.test.ts` — 4 tests.
- ~~A perfect score was reachable with independent scanners only.~~ Closed 22 Sep 2026 — see rule 12.
- Seal is niche once the player controls who scans. Keep it free or cut it; do not put AP back on it.
- No path to title mid-run except finishing the brief (debrief has Title) or a new session. Fine for a short game.
- Charitable same-family filings skip most claims except the capture footer. Cross-check is how independent claims surface against them.

---

## If you touch one thing

New clauses go in `findings.ts` with a `minOrder` that matches the scanner who should see them, a `when` tied to `worldForHour`, and claims that `scoreBrief` already knows — or extend both. Do not widen `nativeClauses` to `agent.order >= minOrder`. That is the old domination bug.

New world beats go in `worldForHour` and an hour intro that poses a question, not an answer.
