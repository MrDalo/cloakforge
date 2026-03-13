---
name: dispatch
description: 'Decompose a complex task into scoped, minimal work units and dispatch them to specialized subagents (frontend, backend, tester, reviewer, docs) for parallel or sequential execution. Use when: (1) implementing a full feature that spans multiple layers (UI + API + server), (2) a task is too large for a single context window, (3) parallel work is possible and would save time, (4) you want structured task briefs with explicit file scopes and negative constraints, (5) coordinating work across multiple concerns while maintaining state in PROJECT_STATE.md. Usage: /dispatch <task description>'
disable-model-invocation: true
argument-hint: 'task description'
allowed-tools:
  - Read
  - Bash(git *)
  - Bash(ls *)
  - Grep
  - Glob
---

# /dispatch

Decompose a user request into scoped, minimal work units for subagents.

## Principles

- **One agent, one task** — never give a subagent more than one concern
- **Minimal context** — specify exactly which files to read, not "figure it out"
- **Negative constraints** — tell each agent what's OUT of scope
- **Structured output** — require each agent to write to `.claude/state/TASK_LOG.md`
- **Parallel when independent** — frontend + backend can run in parallel if they don't share files

## Process

1. **Understand** — read `$ARGUMENTS`, determine which layers are affected (UI, hooks, API, server, schemas, tests, docs) and dependencies between them
2. **Check state** — read `PROJECT_STATE.md`, tail `TASK_LOG.md`, grep `DECISIONS.md` for related context
3. **Decompose** — create task briefs:

   ```markdown
   ## Task Brief: <title>

   **Agent**: frontend | backend | tester | reviewer | docs
   **Priority**: P0 (blocking) | P1 (important) | P2 (nice-to-have)
   **Depends on**: <other task title> | None

   ### TASK

   <1-2 sentence description>

   ### FILES

   - Read: <exact file paths for context>
   - Create/Modify: <exact file paths to change>

   ### CONSTRAINTS

   - Do NOT modify files outside <scope>
   - <other negative constraints>

   ### SUCCESS CRITERIA

   - <measurable outcome>
   - Zero lint warnings, zero type errors

   ### OUTPUT

   Write summary to `.claude/state/TASK_LOG.md`.
   ```

4. **Execution order** — group into phases:
   - Phase 1 (parallel): independent tasks
   - Phase 2 (sequential): dependent tasks
   - Phase 3: tester
   - Phase 4: reviewer
   - Phase 5: docs (if architecture changed)

5. **Present plan** — show decomposed tasks, parallel opportunities, estimated complexity. Ask: "Execute this plan?"
6. **After execution** — update `PROJECT_STATE.md` with feature progress, new issues, new branches

## Rules

- Never send more than 3 files as read context to a single subagent
- Always include negative constraints
- Always require structured output in TASK_LOG.md
- Fail fast — `npm run lint:nowarn && npx tsc --noEmit` between phases
- Max 5 files per task — decompose further if larger
