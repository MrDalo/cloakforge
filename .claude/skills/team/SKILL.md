---
name: team
description: 'Toggle the CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS feature flag on or off in .claude/settings.local.json, enabling or disabling parallel Claude instances (teammates) for the current project. Use when: (1) about to work on a large feature that benefits from parallel review or multi-module refactoring, (2) wanting to disable teammates to reduce token cost for simple sequential tasks, (3) checking whether agent teams are currently enabled before dispatching parallel work, (4) troubleshooting unexpected teammate behavior by toggling off, (5) setting up a fresh dev environment and configuring the agentic workflow preference. Usage: /team on | /team off | /team (check status)'
disable-model-invocation: true
argument-hint: 'on | off'
allowed-tools:
  - Bash(jq *)
  - Bash(cat *)
  - Read
  - Write
  - Edit
---

# /team

Toggle `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` in `.claude/settings.local.json`.

## Actions

### `on`

```bash
SETTINGS=$(cat .claude/settings.local.json 2>/dev/null || echo '{}')
echo "$SETTINGS" | jq '.env = (.env // {}) + {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}' > .claude/settings.local.json
```

Report: "Agent teams **enabled**. Restart session."

### `off`

```bash
SETTINGS=$(cat .claude/settings.local.json 2>/dev/null || echo '{}')
echo "$SETTINGS" | jq 'if .env then .env |= del(.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS) else . end' > .claude/settings.local.json
```

Report: "Agent teams **disabled**. Restart session."

### No argument

Check `.claude/settings.local.json` and report current status.

## Notes

- Requires session restart (env vars load at startup)
- `.claude/settings.local.json` is gitignored (personal preference)
- Each teammate is a separate model instance — **significantly more tokens**
- Best for: parallel review, multi-module refactors
- Not for: sequential tasks, same-file edits
