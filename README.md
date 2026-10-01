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
  Dockerfile         Playwright 1.60 (Node 24, full Chromium), Python 3, ffmpeg, OpenCode
  runner/            OpenCode model configuration
  tools/bin/
    tgnew            scaffold a Vite + TypeScript + Three.js game
    tgserve          serve dist/ in the background (start, stop, status)
    tgcheck          the gate: build, serve, capture declared states, check evidence, optional playtest
  skills/
    threejs-game-workflow/         the bench method: scope, playable-first order, evidence manifest, gate, report
    threejs-game-director/ ...     vendored from majidmanzarpour/threejs-game-skills (MIT)
scripts/
  vendor-threejs-game-skills.sh    re-vendor the pinned upstream skills
```

- Runner: OpenCode. Model: Claude Opus 5.5 through OpenRouter.
- Runtime: Docker. No GPU is assumed; Chromium renders with SwiftShader, so frame rates measured in the runtime are not performance evidence. Draw calls, triangles, and pixel checks are.
- `tgcheck` exiting 0 is the definition of done. The method then requires the agent to open its own screenshots and treat a bad-looking frame as a defect.

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
