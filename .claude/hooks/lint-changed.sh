#!/bin/bash
# lint-changed.sh — Runs ESLint on the file that was just written/edited.
# Called by PostToolUse hook (matcher: Write|Edit). Synchronous.
# Returns lint errors as systemMessage so Claude sees them immediately.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.file // empty')

# Only lint TypeScript/JavaScript files
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs)
    ;;
  *)
    exit 0
    ;;
esac

# Skip if file doesn't exist (was deleted)
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

# Run ESLint on the specific file
RESULT=$(npx eslint --no-warn "$FILE_PATH" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  # Feed lint errors back to Claude via systemMessage
  echo "{\"systemMessage\": \"ESLint errors in ${FILE_PATH}:\\n${RESULT}\"}"
fi

exit 0
