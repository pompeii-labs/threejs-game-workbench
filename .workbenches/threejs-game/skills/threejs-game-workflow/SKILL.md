---
name: threejs-game-workflow
description: The bench's method for a Three.js game task - classify scope, the progress file, the playable-first build order, declaring the evidence manifest, the tgcheck gate, and the final report. Load at the start of every task.
---

# Three.js game workflow

## 1. Classify

Read the task and the repository before writing code.

| Scope | Signal | Bar |
|-------|--------|-----|
| New game | empty target or "build a game" | design artifacts, playable loop, full gate |
| Upgrade | "polish", "premium", "less basic", "release-ready" | scorecard before and after, full gate |
| Narrow edit | a named mechanic, HUD element, or bug | affected states only, gate on those |

An empty target starts with `tgnew .` (or `tgnew <dir>` when the task names
a folder). An existing game keeps its stack; read `package.json`, the entry
module, the loop, and any existing test hooks first. If it lacks
`setState`/`setPausedForScreenshot` hooks, add them for the states you need
before declaring captures.

## 2. Progress file

For new games and upgrades, keep `artifacts/game-progress.md`: intent and
constraints, decisions, completed work, remaining defects, next actions.
Update it at each phase boundary. Re-read it if the session resumes.

If your runner has a todo tool, keep that list current as well: mark an item
in progress when you start it and completed in the same step you finish it.
Clients draw the run's progress bar from it, so a list written once and never
updated shows the run stuck at zero.

## 3. Build order

1. Design brief, core loop contract, level plan
   (`threejs-gameplay-systems`). Write them to `artifacts/design.md`.
2. Playable loop with real input, pressure, reward, fail, and fast retry.
   Run the project's build (`bun run build` with a `bun.lock`, else
   `npm run build`) after each increment; a red build is the first thing to
   fix. Keep the simulation separate from rendering from the first increment
   (see Field rules in the bench instructions).
3. One representative scene at the intended camera scale, then content.
4. Graphics in the skill's order: authored forms, materials, lighting,
   effects (`threejs-aaa-graphics-builder`).
5. UI states: gameplay, pause, fail and retry, win, loading, touch when
   mobile is a target (`threejs-game-ui-designer`).
6. Verification (step 4 below), then fix and re-gate.

## 4. Declare, gate, look

Write `artifacts/evidence.json` before the final pass. Format:
`threejs-game-director/references/evidence-manifest.md`. Defaults:

- New game or upgrade: `active-play` on desktop and mobile, plus the fail
  state and one late or stress state.
- Narrow edit: the affected state on the affected viewports.
- Desktop-only only when the task says so.

Start at `runId: "pass-1"`. Then:

```
tgcheck .              # first pass
tgcheck . --next       # every re-gate after a change: fresh runId, fresh reports
```

Keep every command under about 4 minutes. The model's prompt cache expires
after 5 minutes, so one long command makes the next step reprocess the whole
conversation at full price, every time.
`tgcheck` prints how long each step took and warns past 4 minutes. To stay
under:

- Iterate on the fast gate (`tgcheck . --next`, no playtest) while you fix
  build, capture, or evidence problems.
- Run only the playtest sections you are working on:
  `tgcheck . --next --playtest scripts/playtest.mjs --only inventory,loot`.
- Run the full playtest once, as the final gate.
- Never wait on a background job with a long `sleep`. Run the command and
  let it finish, or split it.

Never edit the run ID or delete old passes by hand; `--next` does both jobs.

Read its per-capture lines. Then open every screenshot it wrote. A PASS
with an ugly or wrong frame is a defect: fix it, bump the run ID, gate again.
Stop when the gate passes and the screenshots answer the task. Do not polish
past what the task asked for.

When the task names behaviors (controls, scoring, fail, restart, mobile
input), prove them with a playtest: `scripts/playtest.mjs`, driven by real
key, click, and tap events (`threejs-qa-release/references/playtest-bot.md`).
Contract:

- Read the URL from `process.env.TG_URL`. Never start a server in the script.
- Group checks into named sections. When `process.env.TG_ONLY` is set (a
  comma-separated list from `tgcheck --only`), run only those sections and
  print `SKIP name` for the rest.
- Print one `PASS name` or `FAIL name detail` line per check, write
  `artifacts/playtest-metrics.json`, and exit non-zero on any failure.
- Read game state and DOM in the same `page.evaluate` call. Separate reads
  race the next frame and produce flaky failures.
- Run it through the gate: `tgcheck . --next --playtest scripts/playtest.mjs`.
  A gate with `--only` is a partial check; the final gate runs every section.
- Wait on conditions, not frame counts or durations. Clear text fields with
  `ControlOrMeta+A`. Pointer-lock and mouse tests run in this container only.
- Before the final pass, check that every control's visual response matches
  its effect direction and that no boundary can trap the player.
- Before release, grep the production bundle: no test hooks or cheat globals.

## 5. Report

Write `artifacts/final-evidence.md` for new games and upgrades. The final
message leads with what was built and whether `tgcheck` passed, then the
controls, how to run it (`npm run dev`), the screenshots by path, and what
remains weak or unverified. When the workspace is shared with a macOS or
Windows host, say that the host must reinstall dependencies before running
the project. Scorecard numbers only when the task asked for
premium work, each with one line of evidence.
