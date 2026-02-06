# Agent Team

This project uses a GitHub Copilot agent team (VS Code 1.109+) for AI-assisted development. The team follows a **Conductor-delegate** orchestration pattern optimized for a privacy-first Solana Web3 application.

## How to Use

Invoke `@Conductor` in Copilot Chat for any multi-step task. It will:

1. **Plan** — delegate to `Plan` agent to research and create an implementation plan
2. **Approve** — present plan for user approval before proceeding
3. **Implement** — delegate to specialist subagents in parallel where possible
4. **Review** — delegate to `review` subagent for quality gates
5. **Commit** — propose conventional commit, wait for user confirmation

For planning only, invoke `@Plan` directly — it will hand off to `@Conductor` when ready.

## Agent Team

| Agent         | Role                                   | User-invokable | Tools                          |
| ------------- | -------------------------------------- | -------------- | ------------------------------ |
| **Conductor** | Orchestrates full dev lifecycle        | Yes            | All + agent delegation         |
| **Plan**      | Research, analysis, planning           | Yes            | Read-only + architect subagent |
| **architect** | System design, ADRs                    | No (subagent)  | Read-only                      |
| **frontend**  | Next.js pages, React components, hooks | No (subagent)  | Edit + terminal                |
| **backend**   | API routes, Solana server logic        | No (subagent)  | Edit + terminal                |
| **test**      | Testing, TDD, QA                       | No (subagent)  | Edit + terminal                |
| **review**    | Code review, quality gates             | No (subagent)  | Read-only + lint               |
| **ci-cd**     | CI/CD, Docker, pipelines               | No (subagent)  | Edit + terminal                |
| **docs**      | Documentation (existing only)          | No (subagent)  | Edit                           |
| **ui-ux**     | UX flows, accessibility                | No (subagent)  | Read-only                      |

## Skills

Skills in `.github/skills/` provide domain knowledge loaded on-demand based on task context:

| Skill               | Domain                                       | Used By           |
| ------------------- | -------------------------------------------- | ----------------- |
| `code-review`       | Review checklists and severity levels        | review, Conductor |
| `testing-strategy`  | TDD patterns, test pyramid, coverage         | test              |
| `frontend-patterns` | Next.js 16, React 19, component design       | frontend          |
| `solana-patterns`   | SPL tokens, transactions, wallet integration | backend, frontend |
| `git-workflow`      | Conventional commits, branching, PRs         | Conductor         |
| `performance`       | Bundle optimization, RPC, Core Web Vitals    | frontend, review  |
| `security-audit`    | OWASP, Web3 security, wallet safety          | review, backend   |
| `accessibility`     | WCAG 2.1 AA, keyboard nav, screen readers    | ui-ux, frontend   |

## Prompt Files

Reusable slash commands in `.github/prompts/`:

| Prompt         | Agent        | Description                                            |
| -------------- | ------------ | ------------------------------------------------------ |
| `/new-feature` | `@Plan`      | Plan and implement a new feature end-to-end            |
| `/new-tool`    | `@Plan`      | Create a new Solana tool following TOOLING.md patterns |
| `/fix-bug`     | `@Conductor` | Diagnose and fix a bug systematically                  |
| `/review-code` | `@Conductor` | Review current changes for quality and security        |
| `/refactor`    | `@Conductor` | Safely refactor code while preserving behavior         |

## Orchestration Flow

```
User Request
    │
    ▼
@Conductor ──────► @Plan (research + context)
    │                  │
    │                  ▼
    │              @architect (if design needed)
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
    └──► @review (quality gate)
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
         @docs / @ci-cd (if needed)
```

## Handoffs

- **Plan** → "Start Implementation" → Conductor
- **Conductor** delegates to subagents and collects results

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
- Shared Context: `.github/agents/shared-context.md`
- Decisions: `.github/agents/decisions/`
