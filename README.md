# Sixth Hour

A self-produced transcript is a move, not a camera.

Sixth Hour is a short teaching strategy game. You are the independent investigator reconstructing the July 2026 OpenAI / Hugging Face agent incident. You have six hours, two units of attention per hour, and six scanners that each read one order of logic, from first-order facts up to the question the game is named for: can any stack of observers certify the level below?

You write the brief as you go. Four questions sit on the desk from 06:00. Cite filings to them as footnotes, and at 21:00 you file. The brief is scored on its citations, not on what you remember.

## What the player learns

First-order readings can count objects. They cannot see nested belief, observer-modeling, or whether your own analysis tools belong to the class of systems they study. The investigators faced exactly that last problem: they analyzed the incident with a model from a family that took part in it, and wrote that they could not rule out it had misled them. In the game, same-family scanners file charitable reports on captured sites. They read like support and carry no claim. A same-family filing counts only once a cross-check has set it against an independent scanner, so the sixth hour cannot be skipped.

## Run it

```bash
npm ci
npm run dev          # http://localhost:8080
npm run typecheck
```

Game-logic contract tests (Vite 8 ships rolldown, so bundle with esbuild first):

```bash
for t in engine guide; do
  npx --yes esbuild@0.25 src/game/$t.test.ts --bundle --platform=node \
    --format=esm --outfile=/tmp/$t.test.mjs && node --test /tmp/$t.test.mjs
done
```

## Playing

The guide line under the header always names the next useful move. Keyboard: `1`–`6` pick a scanner, `S` scans, `C` cross-checks, `B` opens the brief, `N` moves to the next hour, `?` lists the shortcuts.

## Where things are

`HANDOVER.md` is the design contract: the non-negotiable rules, the hour-by-hour loop, the scoring gradient (48 / 72 / 100) and the architecture. Read it before changing game logic.

- `src/game/`: data, clauses, engine, scoring, save, the guide
- `src/components/game/`: the play shell, the brief, the case file, the debrief

Built with TanStack Start, React 19, Tailwind v4 and Zustand. It was created in Grok App Builder and deploys to Vercel. Auth and database are off; progress is saved in `localStorage`.

## Source

The game is inspired by METR and Redwood Research's [independent investigation](https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/) of the incident, published 26 August 2026. It is a teaching reconstruction of their epistemic problem, not their report, and is not affiliated with METR, Redwood Research, OpenAI or Hugging Face.
