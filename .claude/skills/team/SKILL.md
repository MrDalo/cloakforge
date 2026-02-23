---
name: team
description: 'Toggle agent teams on or off for parallel Claude instances. Usage: /team on, /team off, or /team (status)'
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
