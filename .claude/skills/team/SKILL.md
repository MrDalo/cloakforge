---
name: team
description: 'Toggle agent teams on or off. Usage: /team on, /team off, or /team (status)'
disable-model-invocation: true
argument-hint: 'on | off'
allowed-tools:
  - Bash(jq *)
  - Bash(cat *)
  - Read
  - Write
  - Edit
---

# /team — Toggle Agent Teams

Agent teams allow multiple Claude instances to work in parallel on independent tasks.
This is an **experimental** feature that uses significantly more tokens.

## Current Settings

!`cat .claude/settings.local.json 2>/dev/null || echo '{}'`

## Instructions

Based on the argument provided (`$ARGUMENTS`):

### If `on`:

Update `.claude/settings.local.json` to enable agent teams:

```bash
# Read existing settings or create empty object
SETTINGS=$(cat .claude/settings.local.json 2>/dev/null || echo '{}')

# Merge the agent teams env var
echo "$SETTINGS" | jq '.env = (.env // {}) + {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}' > .claude/settings.local.json
```

Report: "Agent teams **enabled**. Restart your Claude Code session for the change to take effect."

### If `off`:

Update `.claude/settings.local.json` to disable agent teams:

```bash
SETTINGS=$(cat .claude/settings.local.json 2>/dev/null || echo '{}')

# Remove the agent teams env var
echo "$SETTINGS" | jq 'if .env then .env |= del(.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS) else . end' > .claude/settings.local.json
```

Report: "Agent teams **disabled**. Restart your Claude Code session for the change to take effect."

### If empty (no argument):

Check current status and report:

- Read `.claude/settings.local.json`
- Check if `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is set to `"1"`
- Report: "Agent teams are currently **enabled/disabled**."

## Important Notes

- Agent teams require a **session restart** to take effect (env vars load at startup)
- `.claude/settings.local.json` is gitignored — this is a personal preference
- When enabled, Claude can spawn teammate agents for parallel work
- Each teammate is a separate model instance — **significantly more tokens**
- Best for: parallel code review, multi-module refactors, competing debug hypotheses
- Not recommended for: sequential tasks, same-file edits, routine feature work
