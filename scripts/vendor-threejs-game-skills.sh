#!/usr/bin/env bash
# Vendor the pinned production subset of majidmanzarpour/threejs-game-skills
# (MIT) into the threejs-game Workbench. Skills are copied untouched, including
# their scripts, references, and the Vite scaffold under threejs-gameplay-systems.
# Codex metadata (agents/openai.yaml) is dropped: this bench has one runner.
#
# The three generator skills (3d, image, audio) are left out on purpose. They
# call paid provider APIs with keys this bench does not declare; v1 is
# procedural-only so a run is reproducible and benchmarkable.
#
# usage: scripts/vendor-threejs-game-skills.sh [commit]
set -euo pipefail

COMMIT=${1:-8286774b22a2566bf894dbc825825c16921866af}
SKILLS=(threejs-game-director threejs-gameplay-systems threejs-aaa-graphics-builder threejs-game-ui-designer threejs-debug-profiler threejs-qa-release)
ROOT=$(cd "$(dirname "$0")/.." && pwd)
DEST="$ROOT/.workbenches/threejs-game/skills"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

git clone -q https://github.com/majidmanzarpour/threejs-game-skills "$WORK/src"
git -C "$WORK/src" checkout -q "$COMMIT"

for skill in "${SKILLS[@]}"; do
    rm -rf "${DEST:?}/$skill"
    cp -R "$WORK/src/skills/$skill" "$DEST/$skill"
    rm -rf "$DEST/$skill/agents"
    cp "$WORK/src/LICENSE" "$DEST/$skill/LICENSE"
done

cat > "$DEST/threejs-game-director/NOTICE.md" <<NOTICE
Vendored from https://github.com/majidmanzarpour/threejs-game-skills at
${COMMIT} (MIT). Skills: ${SKILLS[*]}. Files are unmodified except that each
skill's agents/ directory (Codex metadata) is removed and LICENSE and this
notice are added. Not vendored: threejs-3d-generator, threejs-image-generator,
threejs-audio-generator.
NOTICE
echo "vendored ${#SKILLS[@]} skills at ${COMMIT:0:7} into $DEST"
