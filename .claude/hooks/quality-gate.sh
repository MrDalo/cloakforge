#!/bin/bash
# quality-gate.sh — Runs lint + type-check on changed files before Claude stops.
# Called by Stop hook. If errors exist, exits with code 2 to prevent
# Claude from stopping and feeds errors back via stderr.

# Check if any .ts/.tsx files were changed — if not, skip validation entirely
CHANGED_TS=$(git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null | grep -E '\.(ts|tsx)$')

if [[ -z "$CHANGED_TS" ]]; then
  # No TypeScript changes — allow stop
  exit 0
fi

# Run ESLint on changed files only (faster than full project lint)
LINT_OUTPUT=$(npx eslint $CHANGED_TS 2>&1)
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ]; then
  echo "Lint errors found in changed files. Fix before finishing:" >&2
  echo "$LINT_OUTPUT" >&2
  exit 2  # Prevents Claude from stopping
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
