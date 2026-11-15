#!/bin/bash
# Packs this repo into a clean zip for an Alignerr/Code Behaviors task upload.
# Strips .git, dependency/build output, and anything that changes model
# behavior (CLAUDE.md, AGENTS.md, .claude/), plus real .env files.
# Produces ~/Desktop/cloakforge-alignerr-<task-slug>.zip
#
# Usage: ./scripts/pack-for-alignerr.sh [task-slug]
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="${1:-task}"
WORKDIR=$(mktemp -d)
EXPORT_DIR="$WORKDIR/cloakforge"
OUT_ZIP="$HOME/Desktop/cloakforge-alignerr-${SLUG}.zip"

echo "Staging a clean copy in $EXPORT_DIR ..."
mkdir -p "$EXPORT_DIR"

rsync -a "$REPO_DIR"/ "$EXPORT_DIR"/ \
  --exclude ".git/" \
  --exclude "node_modules/" \
  --exclude ".next/" \
  --exclude "out/" \
  --exclude "dist/" \
  --exclude "build/" \
  --exclude "coverage/" \
  --exclude ".nyc_output/" \
  --exclude ".turbo/" \
  --exclude ".cache/" \
  --exclude ".vercel/" \
  --exclude "graphify-out/" \
  --exclude ".claude/" \
  --exclude "CLAUDE.md" \
  --exclude "AGENTS.md" \
  --exclude "RTK.md" \
  --exclude "prompt-structure.md" \
  --exclude "scripts/pack-for-alignerr.sh" \
  --exclude ".env" \
  --exclude ".env.local" \
  --exclude ".env.*.local" \
  --exclude ".env.development" \
  --exclude ".env.production" \
  --exclude ".env.test" \
  --exclude ".DS_Store" \
  --exclude "*.log" \
  --exclude "*.tsbuildinfo"

echo
echo "=== Sanity checks on the staged copy ==="

echo "-- Any .git left? --"
find "$EXPORT_DIR" -maxdepth 1 -iname ".git" || echo "none (good)"

echo "-- Any .claude / AGENTS.md / CLAUDE.md left? --"
find "$EXPORT_DIR" -maxdepth 1 \( -iname ".claude" -o -iname "AGENTS.md" -o -iname "CLAUDE.md" \) || echo "none (good)"

echo "-- Any real .env files left (should only see .env.example / .env.template)? --"
find "$EXPORT_DIR" -maxdepth 1 -iname ".env*"

echo "-- .gitignore present? --"
test -f "$EXPORT_DIR/.gitignore" && echo "yes" || echo "MISSING — add one before zipping"

echo "-- Staged size --"
du -sh "$EXPORT_DIR"

echo
echo "=== Zipping ==="
(cd "$WORKDIR" && zip -rq "$OUT_ZIP" cloakforge -x '*.DS_Store')

echo "-- Confirming no .git/ inside the zip --"
if unzip -l "$OUT_ZIP" | grep -q '\.git/'; then
  echo "FAIL: .git found inside zip!"
  exit 1
else
  echo "OK: no .git/ entries"
fi

echo
echo "Done: $OUT_ZIP"
unzip -l "$OUT_ZIP" | tail -20
rm -rf "$WORKDIR"
