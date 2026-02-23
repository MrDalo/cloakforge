#!/bin/bash
# check-task-log.sh — Verifies coding subagents wrote their summary to TASK_LOG.md.
# Called by SubagentStop hook (matcher: frontend|backend|tester|docs).
# Only warns — does not block completion.

INPUT=$(cat)
AGENT_NAME=$(echo "$INPUT" | jq -r '.agent_name // empty')
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.agent_transcript_path // empty')

if [[ -z "$AGENT_NAME" ]]; then
  exit 0
fi

TASK_LOG="$CLAUDE_PROJECT_DIR/.claude/state/TASK_LOG.md"

if [[ ! -f "$TASK_LOG" ]]; then
  exit 0
fi

# Check if the task log was modified recently (within last 60 seconds)
if [[ "$(uname)" == "Darwin" ]]; then
  LAST_MOD=$(stat -f %m "$TASK_LOG" 2>/dev/null || echo 0)
else
  LAST_MOD=$(stat -c %Y "$TASK_LOG" 2>/dev/null || echo 0)
fi

NOW=$(date +%s)
DIFF=$((NOW - LAST_MOD))

if [ $DIFF -gt 60 ]; then
  echo "{\"systemMessage\": \"Reminder: The $AGENT_NAME agent did not write a summary to .claude/state/TASK_LOG.md. Please add a structured summary of what was done.\"}"
fi

exit 0
