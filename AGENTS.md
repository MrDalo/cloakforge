# Agent Team

This project uses a GitHub Copilot agent team (VS Code 1.110+) for AI-assisted development. The team supports both interactive and autonomous orchestration for a privacy-first Solana Web3 application.

## How to Use

Choose the orchestration mode based on task complexity:

1. **Simple task** (<= 3 files, clear scope): run directly with the active agent, skip heavy planning.
2. **Complex task** (4+ files, multi-layer): invoke `@orchestrator`.
3. **Planning-first task**: invoke `@Plan`, then hand off implementation.

Invoke `@orchestrator` in Copilot Chat for multi-step work. It will:

1. **Plan** — delegate to `Plan` agent to research and create an implementation plan
2. **Approve** — present plan for user approval before proceeding
3. **Implement** — delegate to specialist subagents in parallel where possible
4. **Review** — delegate to `review` subagent for quality gates
5. **Commit** — propose conventional commit, wait for user confirmation

For planning only, invoke `@Plan` directly.

## Session Target Guidance

- **Local**: best for interactive tasks and rapid clarification loops.
- **Copilot CLI**: best for long-running autonomous phases and parallel sessions.
- For heavy parallel work, prefer Copilot CLI with worktree isolation.

## Agent Team

| Agent            | Role                                                | User-invokable | Tools                     |
| ---------------- | --------------------------------------------------- | -------------- | ------------------------- |
| **orchestrator** | Central authority for parallel/sequential execution | Yes            | All + agent delegation    |
| **Plan**         | Research, analysis, planning                        | Yes            | Read-only                 |
| **monitor**      | Agentic workflow and quality status                 | Yes            | Read + terminal + changes |
| **frontend**     | Next.js pages, React components, hooks              | No (subagent)  | Edit + terminal           |
| **backend**      | API routes, Solana server logic                     | No (subagent)  | Edit + terminal           |
| **test**         | Testing, TDD, QA                                    | No (subagent)  | Edit + terminal           |
| **review**       | Code review, quality gates, UX audit                | No (subagent)  | Read-only + lint          |
| **docs**         | Documentation (existing only)                       | No (subagent)  | Edit                      |

## Skills

Skills in `.github/skills/` provide domain knowledge loaded on-demand based on task context:

| Skill               | Domain                                       | Used By              |
| ------------------- | -------------------------------------------- | -------------------- |
| `code-review`       | Review checklists and severity levels        | review, orchestrator |
| `testing-strategy`  | TDD patterns, test pyramid, coverage         | test                 |
| `frontend-patterns` | Next.js 16, React 19, component design       | frontend             |
| `solana-patterns`   | SPL tokens, transactions, wallet integration | backend, frontend    |
| `git-workflow`      | Conventional commits, branching, PRs         | orchestrator         |
| `performance`       | Bundle optimization, RPC, Core Web Vitals    | frontend, review     |
| `security-audit`    | OWASP, Web3 security, wallet safety          | review, backend      |
| `accessibility`     | WCAG 2.1 AA, keyboard nav, screen readers    | review, frontend     |

## Prompt Files

Reusable slash commands in `.github/prompts/`:

| Prompt            | Agent           | Description                                            |
| ----------------- | --------------- | ------------------------------------------------------ |
| `/new-feature`    | `@Plan`         | Plan and implement a new feature end-to-end            |
| `/new-tool`       | `@Plan`         | Create a new Solana tool following TOOLING.md patterns |
| `/fix-bug`        | `@orchestrator` | Diagnose and fix a bug systematically                  |
| `/review-code`    | `@orchestrator` | Review current changes for quality and security        |
| `/refactor`       | `@orchestrator` | Safely refactor code while preserving behavior         |
| `/optimize`       | `@orchestrator` | Audit and optimize performance (bundle, RPC, caching)  |
| `/orchestrate`    | `@orchestrator` | Run multi-agent implementation with dependency routing |
| `/agentic-status` | `@monitor`      | Check workflow health, quality gates, and parallelism  |

## Orchestration Flow

```
User Request
    │
    ▼
@orchestrator ───► @Plan (research + context)
    │                  │
    │◄─────────────────┘ (plan returned)
    │
    ▼
Approval Gate (user confirms plan)
    │
    ▼
Implementation Phase(s)
    ├──► @frontend + @backend (parallel if independent)
    │         │
    │         ▼
    ├──► @test (write tests)
    │         │
    │         ▼
    └──► @review (quality gate + UX audit)
              │
              ▼
         APPROVED? ──No──► Revision cycle (max 2)
              │
             Yes
              │
              ▼
            Commit Gate (user confirms)
              │
              ▼
         @docs (if needed)
```

## Handoffs

- **Plan** → "Start Implementation" → orchestrator
- **orchestrator** delegates to subagents and collects results

## Cost-Conscious Execution

- Run `npm run lint:nowarn && npx tsc --noEmit` before heavy delegation.
- Keep subagent tasks scoped to 1-3 files with explicit out-of-scope constraints.
- Use pattern references instead of broad exploration.
- Prefer structured outputs with status: `SUCCESS`, `PARTIAL`, or `BLOCKED`.

## Source-of-Truth Order

1. `docs/` (ARCHITECTURE, DEVELOPMENT, TOOLING, TROUBLESHOOTING)
2. `src/` (existing patterns)
3. `package.json` (scripts/versions)

**Never** create new `.md` files.

## File Locations

- Agents: `.github/agents/*.agent.md`
- Skills: `.github/skills/<name>/SKILL.md`
- Prompts: `.github/prompts/*.prompt.md`
- Instructions: `.github/copilot-instructions.md`

---

## Tool Boundaries

- **Copilot control plane**: `.github/copilot-instructions.md`, `AGENTS.md`, `.github/agents/`, `.github/prompts/`, `.github/skills/`
- **Claude control plane**: `.claude/CLAUDE.md`, `.claude/agents/`, `.claude/rules/`, `.claude/skills/`
- **Shared source of truth**: `docs/`, then `src/`, then `package.json`
- **Parallel use**: prefer separate git worktrees when running both tools at the same time
