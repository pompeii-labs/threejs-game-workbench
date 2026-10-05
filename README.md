# threejs-game Workbench

A [Workbench](https://github.com/pompeii-labs/workbenches) for building playable Three.js browser games and proving they work in a real browser.

Published on [workbenches.dev](https://workbenches.dev) as `pompeii/threejs-game`.

```sh
wb add pompeii/threejs-game
wb run threejs-game --dir ./my-game --task "Build a top-down zombie shooter with waves and mobile controls"
```

The first run builds the runtime image locally, which takes a few minutes.

## What is in the bench

```text
.workbenches/threejs-game/
  workbench.yml
  instructions.md
  Dockerfile         Playwright 1.60 (Node 24, full Chromium), Bun, Python 3, ffmpeg, OpenCode
  runner/            OpenCode model configuration
  tools/bin/
    tgnew            scaffold a Vite + TypeScript + Three.js game
    tgserve          serve the build output in the background (start, stop, status)
    tgplaytest       write the playtest section runner (init) and list sections
    tgcheck          the gate: build, serve, capture declared states, check evidence, optional playtest (--only for sections), timed
  skills/
    threejs-game-workflow/         the bench method: scope, playable-first order, evidence manifest, gate, report
    threejs-game-director/ ...     vendored from majidmanzarpour/threejs-game-skills (MIT)
scripts/
  vendor-threejs-game-skills.sh    re-vendor the pinned upstream skills
```

- Runner: OpenCode. Model: Claude Opus 5.5 through OpenRouter.
- Runtime: Docker. No GPU is assumed; Chromium renders with SwiftShader, so frame rates measured in the runtime are not performance evidence. Draw calls, triangles, and pixel checks are.
- `tgcheck` exiting 0 is the definition of done. The method then requires the agent to open its own screenshots and treat a bad-looking frame as a defect.

## Changes

- **0.2.2**: cheap playtests by contract: `tgplaytest init` writes a section runner (one file per section, `--only` aware, metrics per section); games add `setTimeScale`/`setRenderScale` test hooks so playtests run at 3x game speed and half resolution; random systems get outcome-forcing hooks before their checks; edits and long runs go in separate commands. From the loot-run logs: playtests were 64 of 120 minutes and long commands caused $4.56 of $12.22 in cache rewrites.
- **0.2.1**: keep each command under about 4 minutes so the model's 5-minute prompt cache survives (`tgcheck` times every step, warns past 4 minutes, and runs named playtest sections with `--only`); keep the runner's todo list current, since progress bars are drawn from it.
- **0.2.0**: runtime image with Bun 1.3.11; `tgcheck` and `tgserve` detect bun, `build:test`, and the Vite outDir; reading bench skills and runtime paths no longer prompts for permission; field rules for structure, builds, controls, playtests, and workspaces.
- **0.1.0**: first release.

## Upstream skills

Six production skills are vendored unmodified from [majidmanzarpour/threejs-game-skills](https://github.com/majidmanzarpour/threejs-game-skills) (MIT): director, gameplay systems, graphics, UI, debug/profiler, and QA/release. Each keeps its upstream `LICENSE`; the pinned commit is recorded in `skills/threejs-game-director/NOTICE.md`.

The three asset generator skills (3D, image, audio) are not included. They call paid provider APIs, and this bench is procedural-only so runs are reproducible.

```sh
scripts/vendor-threejs-game-skills.sh [commit]
```

## Verify locally

```sh
wb validate .#threejs-game
wb build .#threejs-game
wb smoke .#threejs-game
```

## License

MIT for the files in this repository outside `skills/threejs-*` (vendored, MIT, see each skill's `LICENSE`).
