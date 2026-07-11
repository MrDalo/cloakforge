#!/bin/bash
# check-review-verdict.sh — Verifies the reviewer subagent didn't return FAILED.
# Called by SubagentStop hook (matcher: reviewer).
# If verdict is FAILED, exits with code 2 to prevent the subagent from
# completing — forces it to continue investigating.

INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.agent_transcript_path // empty')

if [[ -z "$TRANSCRIPT_PATH" || ! -f "$TRANSCRIPT_PATH" ]]; then
  # Can't read transcript — allow completion
  exit 0
fi

# Check if the transcript contains a FAILED verdict
if grep -q "FAILED" "$TRANSCRIPT_PATH"; then
  echo "Review verdict is FAILED. Please provide detailed findings and re-evaluate." >&2
  exit 2
fi

exit 0
