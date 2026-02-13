#!/bin/bash
# quality-gate.sh — Runs type-check on changed files before Claude stops.
# Called by Stop hook. If type errors exist, exits with code 2 to prevent
# Claude from stopping and feeds errors back via stderr.

# Check if there are any staged or unstaged changes to .ts/.tsx files
CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null | grep -E '\.(ts|tsx)$')

if [[ -z "$CHANGED_FILES" ]]; then
  # No TypeScript changes — allow stop
  exit 0
fi

# Run TypeScript type-check
TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
TSC_EXIT=$?

if [ $TSC_EXIT -ne 0 ]; then
  echo "Type errors found in changed files. Fix before finishing:" >&2
  echo "$TSC_OUTPUT" >&2
  exit 2  # Prevents Claude from stopping
fi

exit 0
