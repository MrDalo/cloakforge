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

| Agent         | Role                                   | User-invokable | Tools                  |
| ------------- | -------------------------------------- | -------------- | ---------------------- |
| **Conductor** | Orchestrates full dev lifecycle        | Yes            | All + agent delegation |
| **Plan**      | Research, analysis, planning           | Yes            | Read-only              |
| **frontend**  | Next.js pages, React components, hooks | No (subagent)  | Edit + terminal        |
| **backend**   | API routes, Solana server logic        | No (subagent)  | Edit + terminal        |
| **test**      | Testing, TDD, QA                       | No (subagent)  | Edit + terminal        |
| **review**    | Code review, quality gates, UX audit   | No (subagent)  | Read-only + lint       |
| **docs**      | Documentation (existing only)          | No (subagent)  | Edit                   |

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
| `accessibility`     | WCAG 2.1 AA, keyboard nav, screen readers    | review, frontend  |

## Prompt Files

Reusable slash commands in `.github/prompts/`:

| Prompt         | Agent        | Description                                            |
| -------------- | ------------ | ------------------------------------------------------ |
| `/new-feature` | `@Plan`      | Plan and implement a new feature end-to-end            |
| `/new-tool`    | `@Plan`      | Create a new Solana tool following TOOLING.md patterns |
| `/fix-bug`     | `@Conductor` | Diagnose and fix a bug systematically                  |
| `/review-code` | `@Conductor` | Review current changes for quality and security        |
| `/refactor`    | `@Conductor` | Safely refactor code while preserving behavior         |
| `/optimize`    | `@Conductor` | Audit and optimize performance (bundle, RPC, caching)  |

## Orchestration Flow

```
User Request
    │
    ▼
@Conductor ──────► @Plan (research + context)
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

---

## Claude Code Setup

This project also supports **Claude Code** (Anthropic). The setup lives in `.claude/` and follows a simplified architecture optimized for Claude Code's model.

### Key Differences from Copilot

| Copilot                           | Claude Code                       | Notes                                         |
| --------------------------------- | --------------------------------- | --------------------------------------------- |
| `@Conductor` orchestrates         | Main conversation orchestrates    | Claude handles orchestration natively         |
| 7 agents                          | 2 subagents (reviewer, tester)    | Frontend/backend work uses path-scoped rules  |
| `.github/copilot-instructions.md` | `.claude/CLAUDE.md`               | Lean project memory (<500 lines)              |
| `.github/skills/*/SKILL.md`       | `.claude/skills/*/SKILL.md`       | Same content, Claude Code frontmatter         |
| `.github/prompts/*.prompt.md`     | `.claude/skills/*/SKILL.md`       | Action skills with `disable-model-invocation` |
| Manual lint by agent              | Automatic hooks (zero LLM tokens) | PostToolUse, Stop, SubagentStop               |
| Same model everywhere             | `opusplan` + `sonnet` subagents   | 3-5x cost reduction                           |

### Claude Code Architecture

```
.claude/
├── CLAUDE.md                    # Project memory (loads every session)
├── settings.json                # Hooks + model config
├── agents/
│   ├── reviewer.agent.md        # Read-only code review (sonnet)
│   └── tester.agent.md          # Testing specialist (sonnet)
├── hooks/
│   ├── lint-changed.sh          # Auto-lint after Write|Edit (zero tokens)
│   ├── quality-gate.sh          # Type-check before Stop (zero tokens)
│   └── check-review-verdict.sh  # Verify reviewer verdict (zero tokens)
├── rules/
│   ├── frontend.md              # Path: src/app/**, src/components/**
│   ├── backend.md               # Path: src/app/api/**, src/lib/solana/**
│   ├── solana.md                # Path: src/lib/solana/**, src/hooks/solana/**
│   ├── testing.md               # Path: **/*.test.{ts,tsx}
│   └── docs.md                  # Path: docs/**
└── skills/
    ├── code-review/             # Knowledge skill
    ├── testing-strategy/        # Knowledge skill
    ├── frontend-patterns/       # Knowledge skill
    ├── solana-patterns/         # Knowledge skill
    ├── git-workflow/            # Knowledge skill
    ├── performance/             # Knowledge skill
    ├── security-audit/          # Knowledge skill
    ├── accessibility/           # Knowledge skill
    ├── new-feature/             # Action: /new-feature
    ├── new-tool/                # Action: /new-tool
    ├── fix-bug/                 # Action: /fix-bug
    ├── review-code/             # Action: /review-code → forks to reviewer
    ├── refactor/                # Action: /refactor
    ├── optimize/                # Action: /optimize
    └── team/                    # Action: /team on|off (agent teams toggle)
```

### Context Cost by Feature

Every feature consumes Claude's context window. Understanding the cost helps avoid noisy contexts that degrade performance.

| Feature         | When it loads             | What loads                                    | Cost per request                                 |
| --------------- | ------------------------- | --------------------------------------------- | ------------------------------------------------ |
| **CLAUDE.md**   | Session start             | Full content                                  | Every request                                    |
| **Skills**      | Session start + when used | Descriptions at start, full content when used | Low (descriptions every request)\*               |
| **MCP servers** | Session start             | All tool definitions and schemas              | Every request                                    |
| **Subagents**   | When spawned              | Fresh context with specified skills           | Isolated from main session                       |
| **Hooks**       | On trigger                | Nothing (runs externally)                     | **Zero**, unless hook returns additional context |

> \* Set `disable-model-invocation: true` in a skill's frontmatter to hide it from Claude until manually invoked. This reduces context cost to **zero** for skills you only trigger yourself (all 7 action skills in this project use this).

**How features load:**

- **CLAUDE.md** — Full content loads at session start and stays in every request. Keep under ~500 lines; move reference material to skills.
- **Skills** — Only short descriptions load at start. Full content loads on invocation. Action skills (`disable-model-invocation: true`) cost zero until you `/invoke` them.
- **Subagents** — Get isolated context. Work doesn't consume main context; only the summary returns.
- **Hooks** — Run outside the LLM loop entirely. Zero token cost for deterministic automation.

**This project's cost profile:**

- `CLAUDE.md` — ~60 lines (lean, every request)
- 8 knowledge skills — descriptions only until needed (~few hundred tokens)
- 7 action skills — zero cost until manually invoked (`disable-model-invocation: true`)
- 5 path rules — only loaded when working on matching file paths
- 3 hooks — zero tokens (lint, type-check, verdict check run as shell scripts)
- 2 subagents — isolated context, return summaries only
- 2 project MCP servers — Solana MCP + next-devtools (via `.mcp.json`)
- MCP Tool Search at 5% threshold — defers unused MCP tools, loads on-demand

### MCP Server Optimization

MCP server tool definitions load at session start and stay in **every request**. With many servers, this can crowd the context window and degrade performance.

**Mitigations in this project:**

1. **MCP Tool Search** — Enabled at 5% threshold (`ENABLE_TOOL_SEARCH=auto:5` in `.claude/settings.json`). When MCP tools exceed 5% of context, Claude defers them and discovers relevant tools on-demand via search instead of preloading all definitions.

2. **Project-scoped servers** — Only CloakForge-relevant servers go in `.mcp.json` (checked into git):
   - `solana` — Solana blockchain docs and development
   - `next-devtools` — Next.js 16 dev server integration

3. **User-scoped servers stay separate** — Personal servers (Figma, Chrome DevTools, etc.) stay in your user config (`~/.claude.json`). They're still available but won't pollute the project config.

**Recommendations for your user-level MCP setup:**

| Server          | Action                   | Reason                                      |
| --------------- | ------------------------ | ------------------------------------------- |
| Solana MCP      | ✅ Keep (project-scoped) | Core to CloakForge                          |
| next-devtools   | ✅ Keep (project-scoped) | Next.js 16 dev tools                        |
| com.figma.mcp   | ⚠️ Keep at user scope    | Only needed when working with Figma designs |
| Figma Dev Mode  | ❌ Remove (duplicate)    | Same URL as Figma-local (127.0.0.1:3845)    |
| Figma-local     | ⚠️ Keep one              | Remove duplicate, keep this or Dev Mode     |
| Chrome DevTools | ⚠️ Keep at user scope    | Useful for debugging, not always needed     |
| nuxt            | ❌ Remove                | CloakForge uses Next.js, not Nuxt           |
| primevue        | ❌ Remove                | CloakForge uses shadcn/ui, not PrimeVue     |

To remove irrelevant servers from VS Code:

```
# In Claude Code CLI
claude mcp remove nuxt
claude mcp remove primevue
claude mcp remove "Figma Dev Mode"  # duplicate of Figma-local
```

### Usage

- **Implementation**: Just describe what you want — rules auto-activate by file path
- **Review**: `/review-code` — forks to reviewer subagent
- **Testing**: Ask for `tester` subagent or `/tester`
- **Features**: `/new-feature` or `/new-tool`
- **Agent Teams**: `/team on` to enable parallel agents, `/team off` to disable
