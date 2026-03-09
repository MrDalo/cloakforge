---
name: agentic-status
description: 'Monitor agentic workflow status — agent teams, task progress, state health. Usage: /agentic-status'
disable-model-invocation: false
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

# /agentic-status

Monitor the health and status of CloakForge's agentic development workflow.

## What It Checks

### 1. **Agent Teams Configuration**
- ✅ `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` enabled
- ✅ `.claude/settings.local.json` properly configured
- ✅ MCP servers enabled (solana, next-devtools, shadcn)

### 2. **Agent Definitions**
- ✅ All 6 agents present (orchestrator, backend, frontend, tester, reviewer, docs)
- ✅ Proper scope constraints and tool restrictions
- ✅ Skills and rules integration

### 3. **State Management**
- ✅ `.claude/state/` directory structure
- ✅ PROJECT_STATE.md current sprint info
- ✅ TASK_LOG.md recent agent activity
- ✅ DECISIONS.md architectural records

### 4. **Skills Integration**
- ✅ Key orchestration skills (dispatch, orchestrate, team)
- ✅ Domain-specific skills linked to agents
- ✅ Quality gate skills (code-review, security-audit, testing-strategy)

### 5. **Hooks & Automation**
- ✅ Pre-commit hook configuration
- ✅ Git hooks integration
- ✅ Automated validation pipeline

## Output Format

```
🤖 CloakForge Agentic Status Report

📊 AGENT TEAMS
✅ Enabled (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
✅ 6 agents configured
⚠️ [Any issues]

🧠 STATE MANAGEMENT
✅ Current sprint: {branch}
✅ Last agent activity: {timestamp}
✅ {n} active tasks

🔧 SKILLS & HOOKS
✅ {n} skills available
✅ Pre-commit automation
⚠️ [Any issues]

🚨 ISSUES
- [Any problems found]

💡 RECOMMENDATIONS
- [Suggested improvements]
```

## Troubleshooting

### Common Issues
- **Agent teams not working**: Check session restart after enabling
- **State files missing**: Initialize with PROJECT_STATE.md template
- **Skills not loading**: Verify `.claude/skills/` directory structure
- **Hooks not executing**: Check file permissions and git hook installation

### Quick Fixes
```bash
# Re-enable agent teams
echo '{"env":{"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS":"1"}}' > .claude/settings.local.json

# Initialize state if missing
mkdir -p .claude/state
touch .claude/state/{PROJECT_STATE.md,TASK_LOG.md,DECISIONS.md}

# Install git hooks
ln -sf ../../.claude/hooks/pre-commit.sh .git/hooks/pre-commit
```