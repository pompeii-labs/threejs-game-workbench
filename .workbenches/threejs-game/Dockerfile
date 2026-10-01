# Runtime image for the threejs-game Workbench.
#
# Base: Microsoft's Playwright image ships Node 24, the full Chromium build
# (the canvas inspector launches channel "chromium"), and every system library
# Chromium needs. The Playwright version matches the one the vendored scaffold
# pins, so a game's own @playwright/test finds these browsers. On top: Python 3
# for the scaffold and evidence checker, ripgrep for OpenCode skill discovery,
# the pinned OpenCode runner, the vendored skills at a stable path, and the
# bench tools (tgnew, tgcheck).
#
# The standard requires images to tolerate an arbitrary numeric user, a
# read-only root filesystem, and writable state only beneath the temporary
# HOME the engine provides. Everything installs under /opt, /usr/local, and
# /ms-playwright as world-readable files; npm caches beneath HOME.

FROM mcr.microsoft.com/playwright:v1.60.0-noble

ARG OPENCODE_VERSION=1.18.26

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 ripgrep ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g opencode-ai@${OPENCODE_VERSION} \
    && chmod -R a+rX "$(npm root -g)" /ms-playwright

# Bun is installed here because the runtime's /tmp and HOME are noexec and the
# root filesystem is read-only: nothing can be installed at run time.
ARG BUN_VERSION=1.3.11
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/* \
    && case "$(dpkg --print-architecture)" in \
        amd64) bun_arch=x64 ;; \
        arm64) bun_arch=aarch64 ;; \
        *) echo "unsupported architecture" >&2; exit 1 ;; \
    esac \
    && curl -fsSL -o /tmp/bun.zip "https://github.com/oven-sh/bun/releases/download/bun-v${BUN_VERSION}/bun-linux-${bun_arch}.zip" \
    && unzip -j /tmp/bun.zip "bun-linux-${bun_arch}/bun" -d /usr/local/bin \
    && chmod a+rx /usr/local/bin/bun \
    && rm /tmp/bun.zip \
    && bun --version

COPY skills/ /opt/threejs-game/skills/
COPY tools/ /opt/threejs-game/tools/
RUN chmod -R a+rX /opt/threejs-game \
    && chmod a+x /opt/threejs-game/tools/bin/* \
    && ln -s /opt/threejs-game/tools/bin/* /usr/local/bin/

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    CI=1

WORKDIR /workspace
