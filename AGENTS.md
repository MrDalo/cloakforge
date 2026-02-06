# Agent Team

This project uses a GitHub Copilot agent team for AI-assisted development. The team follows a **Conductor-delegate** orchestration pattern optimized for a privacy-first Solana Web3 application.

## How to Use

Invoke `@Conductor` in Copilot Chat for any multi-step task. It will:
1. **Plan** — analyze the codebase and create an implementation plan
2. **Implement** — delegate to specialist agents for each piece
3. **Review** — run automated code review before completion
4. **Commit** — create conventional commits with clear messages

For single-step tasks, invoke any user-invokable agent directly (e.g., `@Plan` for planning).

## Agent Team

| Agent | Role | User-invokable |
|-------|------|-----------------|
| **Conductor** | Orchestrates the full dev lifecycle | Yes |
| **Plan** | Research, analysis, implementation planning | Yes |
| **architect_agent** | System design, ADRs, hybrid client/server model | No (subagent) |
| **frontend_agent** | Next.js App Router pages, React components, hooks | No (subagent) |
| **backend_agent** | API routes, server-side Solana logic | No (subagent) |
| **test_agent** | Testing strategy, QA validation | No (subagent) |
| **review_agent** | Code review, quality gates | No (subagent) |
| **ci_cd_agent** | CI/CD pipelines, release automation | No (subagent) |
| **docs_agent** | Documentation updates (existing docs only) | No (subagent) |
| **ui_ux_agent** | UX flows, accessibility, design review | No (subagent) |

## Skills

Skills in `.github/skills/` provide domain knowledge to all agents:

| Skill | Domain |
|-------|--------|
| `code-review` | Structured review checklist and severity levels |
| `testing-strategy` | TDD patterns, test pyramid, coverage guidance |
| `frontend-patterns` | Next.js 16 App Router, React 19, component design |
| `solana-patterns` | SPL tokens, transaction building, wallet integration |
| `git-workflow` | Conventional commits, branching, PR templates |
| `performance` | Bundle optimization, Solana RPC, Core Web Vitals |
| `security-audit` | OWASP checklist, Web3 security, wallet safety |
| `accessibility` | WCAG 2.1 AA, semantic HTML, keyboard navigation |

## Prompt Files

Reusable slash commands in `.github/prompts/`:

| Prompt | Usage | Description |
|--------|-------|-------------|
| `/new-feature` | `@Plan` | Plan and implement a new feature end-to-end |
| `/new-tool` | `@Plan` | Create a new Solana tool following TOOLING.md patterns |
| `/fix-bug` | `@Conductor` | Diagnose and fix a bug systematically |
| `/review-code` | Any agent | Review current changes for quality and security |
| `/refactor` | `@Conductor` | Safely refactor code while preserving behavior |

## Handoffs

After completing a task, agents offer guided next steps:

- **Plan** → "Start Implementation" → Conductor
- **Conductor** → "Review Changes" → review_agent
- **Conductor** → "Write Tests" → test_agent
- **Conductor** → "Update Docs" → docs_agent

## Source-of-Truth Order

1. `docs/` (ARCHITECTURE, DEVELOPMENT, TOOLING, TROUBLESHOOTING)
2. `src/` (existing patterns)
3. `package.json` (scripts/versions)

**Never** create new `.md` files. Record needs in `shared-context.md` and ask first.

## File Locations

- Agents: `.github/agents/*.agent.md`
- Skills: `.github/skills/<name>/SKILL.md`
- Prompts: `.github/prompts/*.prompt.md`
- Instructions: `.github/copilot-instructions.md`
- Shared Context: `.github/agents/shared-context.md`
- Handoff Template: `.github/agents/handoff-template.md`
- Decisions: `.github/agents/decisions/`
