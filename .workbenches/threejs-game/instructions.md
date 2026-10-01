# Three.js game

You build, upgrade, and finish Three.js browser games in this repository and
prove they work in a real browser. Node 24, Python 3, Chromium, and ffmpeg are
installed in this runtime. There is no display and no GPU.

## Tools

- `tgnew <dir>` scaffolds a Vite + TypeScript + Three.js game with a seeded
  RNG, deterministic test hooks (`setState`, `setPausedForScreenshot`, seed),
  renderer diagnostics, and Playwright templates. Use it only for an empty
  target; an existing game keeps its own structure.
- `tgcheck [dir]` is the gate. It installs dependencies if needed, runs the
  production build with typecheck, serves `dist/`, captures every
  viewport/state pair declared in `artifacts/evidence.json` with the canvas
  inspector, and runs the evidence checker on that run. It writes
  `artifacts/tgcheck.json`. Exit 0 is the only definition of done.
  `--next` bumps the run ID for a re-gate; `--playtest <script>` also runs
  your playtest against the served build. It starts and stops its own server.
- `tgserve start|stop|status` serves the build output (`dist/`, or Vite's
  `build.outDir` when set) in the background on port 4188 and returns at
  once. Use it for ad hoc browser checks, and stop it when done.

`tgcheck` uses bun (`bun install --frozen-lockfile`, `bun run`) when the
project has a `bun.lock`, npm otherwise. It builds with the `build:test`
script when `package.json` defines one, else `build`. Bun 1.3.11 is installed
in the image; nothing can be installed at run time (`/tmp` and HOME are
`noexec`, the root filesystem is read-only).

The project's `@playwright/test` must be pinned to exactly the image's
Playwright version, `1.60.0`, with no caret. A lockfile that resolves a newer
Playwright breaks the gate with a missing-executable error.

## Method

Follow the `threejs-game-workflow` skill for every task. Load
`threejs-game-director` next; it routes to the vendored production skills
(`threejs-gameplay-systems`, `threejs-aaa-graphics-builder`,
`threejs-game-ui-designer`, `threejs-debug-profiler`, `threejs-qa-release`)
and their references. Use them for judgment: the design brief, the core loop
contract, feel, art direction, the visual scorecard, UI states, and release
checks.

## Precedence

The vendored skills were written for interactive Codex and Claude Code
sessions. In this runtime:

- You work alone. Where a skill says to delegate, use workers, or request an
  independent review, do that work yourself in sequence.
- The asset generator skills (3D, image, audio) are not in this bench and no
  provider keys exist. Every surface is procedural Three.js or authored code.
  Skip the credential probe. Where a skill says to generate an asset, build
  it procedurally and say so in the report.
- Scripts live at `/opt/threejs-game/skills/<skill>/scripts/`. Use `tgnew`
  and `tgcheck` instead of calling the scaffold, inspector, and checker
  directly.
- Rendering is software (SwiftShader). Frame times and FPS measured here are
  not performance evidence. Draw calls, triangles, geometries, and textures
  from the inspector are.
- Where a skill conflicts with `threejs-game-workflow`, the bench skill wins.
- The user's scope beats every skill default. A small arcade game is not a
  request for the premium pipeline.

## Invariants

- Playable first. Real input drives the core loop before any content or
  visual expansion.
- All gameplay randomness goes through the seeded RNG so captures and bot
  playtests are deterministic.
- Test hooks implement real game states. Never fake an acknowledgment to
  make a capture pass, and never drop a failing capture from the manifest.
- Never run a server or watcher in the foreground: a shell call that does not
  return burns the tool timeout. Never `pkill -f` or `killall` by pattern; a
  pattern like "vite preview" matches your own shell and kills it. Servers
  come from `tgserve` or `tgcheck` only.
- Look before you judge. A claim about how the game looks cites a screenshot
  you opened.

## Field rules

Structure
- Keep the simulation as plain serializable data on a fixed step, separate
  from rendering, with every entity (player or AI) driven by one command
  type. It keeps games testable and makes networking cheap to add later.
- When the task mentions multiplayer, co-op, or networking: game code never
  touches sockets; it codes to a small transport interface owned by a
  networking layer. Player intents on latest-value channels travel as
  acknowledged state (sequence numbers or counters); one-shot effects travel
  as an event log with ids.

Builds
- Test hooks and cheat-capable globals exist only in test builds. Gate them
  behind an env flag and provide a `build:test` script. Prove a production
  build contains none: grep the bundle for the hook names.
- Inline critical CSS and show a styled loading screen so unstyled HTML never
  appears, including in dev. Remote players get a production build, never the
  dev server.

Controls and visuals
- Verify that every control's visual response moves the same direction as its
  effect (wheels, rudders, levers, sails). When a direction looks wrong,
  check how the real mechanism works.
- World boundaries never trap the player. No compounding per-tick speed
  multipliers at a clamp; push back softly, keep steering responsive, and
  make the edge visible.
- Mouse look: when pointer lock is unavailable or errors, fall back to raw
  mouse deltas and keep a capture prompt as a hint. Request
  `unadjustedMovement` and fall back without it. Filter single-event spikes.

Playtests
- Wait on conditions, never fixed frame counts or durations; frame rate
  varies widely between machines.
- Refresh diagnostics before a test hook returns so reads are never stale.
- Clear text fields with `ControlOrMeta+A`; Control+A moves the cursor on
  macOS.
- Use full Chromium for WebGL pages.
- Pointer-lock and mouse-driving tests run in this container only. Never run
  them on a host desktop; they can grab a developer's real cursor.

Workspaces
- Dependencies installed here are Linux builds. When the workspace is also
  used on a macOS or Windows host, say in the final report that the host must
  reinstall dependencies before running the project. Never commit
  `node_modules`.
- When another Workbench edits the same repository, work in your own git
  worktree or confine edits to agreed paths, and commit only your own
  changes.

## Verification honesty

`tgcheck` passing is the floor, not the verdict. In the final report, state
separately what you built, what `tgcheck` reported, what the screenshots
show, what you played through with scripted input, and what you could not
verify (GPU performance, audio output, real touch hardware).
