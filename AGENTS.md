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

This project also supports **Claude Code** (Anthropic). The setup lives in `.claude/` and follows a **lean orchestrator + scoped subagents** architecture optimized for token efficiency and quality.

### Design Principles

Based on these core tenets (see [conversation context](https://claude.ai/share/fceb26ee-9c7d-4275-982e-c63b09d79829)):

1. **Context = money + quality degradation** — Keep each agent's context small, focused, and relevant
2. **Files as memory, not context** — Persistent state in `.claude/state/` instead of conversation history
3. **Hierarchical summarization** — Sub-agents write structured summaries; orchestrator reads summaries only
4. **Structured output contracts** — Every agent returns defined format (not prose)
5. **Negative constraints** — Tell agents what's OUT of scope (cheaper than explaining everything to do)
6. **Lean orchestrator** — Main session routes and plans; delegates implementation to subagents
7. **Fail-fast with shell scripts** — Hooks run lint/type-check with zero LLM tokens
8. **Selective loading** — Each agent loads only what it needs

### Key Differences from Copilot

| Copilot                           | Claude Code                       | Notes                                         |
| --------------------------------- | --------------------------------- | --------------------------------------------- |
| `@Conductor` orchestrates         | Main conversation orchestrates    | Claude handles orchestration natively         |
| 7 agents                          | 5 subagents                       | frontend, backend, reviewer, tester, docs     |
| `.github/copilot-instructions.md` | `.claude/CLAUDE.md`               | Lean project memory (~75 lines)               |
| `.github/skills/*/SKILL.md`       | `.claude/skills/*/SKILL.md`       | Same content, Claude Code frontmatter         |
| `.github/prompts/*.prompt.md`     | `.claude/skills/*/SKILL.md`       | Action skills with `disable-model-invocation` |
| Manual lint by agent              | Automatic hooks (zero LLM tokens) | PostToolUse, Stop, SubagentStop               |
| Same model everywhere             | `sonnet` + `sonnet` subagents     | All Sonnet for maximum cost efficiency        |
| No persistent state               | `.claude/state/` files            | PROJECT_STATE, TASK_LOG, DECISIONS            |

### Claude Code Architecture

```
.claude/
├── CLAUDE.md                    # Project memory (~75 lines, loads every session)
│                                # Sections: Orchestrator Behavior, Cost Consciousness,
│                                # Context, Commands, Conventions, Anti-Patterns,
│                                # Key Directories, Persistent State, Docs, Source-of-Truth
├── settings.json                # Hooks + model config (sonnet main + sonnet subagents)
├── state/                       # Persistent memory (files, not context)
│   ├── PROJECT_STATE.md         # Current sprint, features, issues, branches
│   ├── TASK_LOG.md              # Structured task summaries (hierarchical memory)
│   └── DECISIONS.md             # Architecture decision records (ADRs)
├── agents/
│   ├── frontend.agent.md        # UI specialist (scope: src/app/, src/components/, src/hooks/)
│   ├── backend.agent.md         # API + Solana specialist (scope: src/app/api/, src/lib/solana/)
│   ├── reviewer.agent.md        # Read-only code review (scope: changed files only)
│   ├── tester.agent.md          # Testing specialist (scope: __tests__/ files only)
│   └── docs.agent.md            # Documentation specialist (scope: docs/*.md only)
├── hooks/
│   ├── lint-changed.sh          # Auto-lint after Write|Edit (zero tokens)
│   ├── quality-gate.sh          # Lint + type-check before Stop (zero tokens)
│   ├── check-review-verdict.sh  # Verify reviewer verdict (zero tokens)
│   └── check-task-log.sh        # Remind agents to log work (zero tokens)
├── rules/
│   ├── frontend.md              # Path: src/app/**, src/components/**
│   ├── backend.md               # Path: src/app/api/**, src/lib/solana/**
│   ├── solana.md                # Path: src/lib/solana/**, src/hooks/solana/**
│   ├── testing.md               # Path: **/*.test.{ts,tsx}
│   └── docs.md                  # Path: docs/**
└── skills/
    ├── code-review/             # Knowledge skill (28 lines)
    ├── testing-strategy/        # Knowledge skill (30 lines)
    ├── frontend-patterns/       # Knowledge skill (39 lines)
    ├── solana-patterns/         # Knowledge skill (41 lines)
    ├── git-workflow/            # Knowledge skill
    ├── performance/             # Knowledge skill
    ├── security-audit/          # Knowledge skill
    ├── accessibility/           # Knowledge skill
    ├── dispatch/                # Action: /dispatch — decompose task into subagent work units
    ├── new-feature/             # Action: /new-feature (no @docs preload)
    ├── new-tool/                # Action: /new-tool (no @docs preload)
    ├── fix-bug/                 # Action: /fix-bug (no @docs preload)
    ├── review-code/             # Action: /review-code → forks to reviewer
    ├── refactor/                # Action: /refactor
    ├── optimize/                # Action: /optimize (no @docs preload)
    ├── scaffold/                # Action: /scaffold — generate boilerplate
    ├── commit/                  # Action: /commit — conventional commit
    ├── pr/                      # Action: /pr — generate PR description
    ├── status/                  # Action: /status — project health dashboard
    ├── init/                    # Action: /init — onboard to project
    ├── test-file/               # Action: /test-file → forks to tester
    └── team/                    # Action: /team on|off (agent teams toggle)
```

### Persistent State (Files as Memory)

The key innovation: state lives in files, not in any agent's context. This scales indefinitely and keeps costs predictable.

| File               | Purpose                                    | Updated by                  | Read by                         |
| ------------------ | ------------------------------------------ | --------------------------- | ------------------------------- |
| `PROJECT_STATE.md` | Current sprint, features, issues, branches | Main session                | All agents (on-demand)          |
| `TASK_LOG.md`      | Structured summaries of completed tasks    | Subagents (after each task) | Main session (before planning)  |
| `DECISIONS.md`     | Architecture decision records (ADRs)       | Main session                | Agents needing context on "why" |

**Flow**: Subagent completes work → writes to TASK_LOG → main session reads summary → updates PROJECT_STATE → next task dispatched with fresh context.

### Orchestration Model

```
User Request
    │
    ▼
Main Session (lean orchestrator)
    │
    ├─ 1. Read .claude/state/ for context
    ├─ 2. /dispatch — decompose into scoped tasks
    ├─ 3. Approval Gate (user confirms plan)
    │
    ▼
Implementation Phases
    ├──► @frontend + @backend (parallel if independent)
    │         │
    │         ▼ (each writes to TASK_LOG.md)
    ├──► @tester (write tests for new code)
    │         │
    │         ▼
    └──► @reviewer (quality gate)
              │
              ▼
         APPROVED? ──No──► Fix cycle (max 2)
              │
             Yes
              │
              ▼
         /commit (conventional commit)
              │
              ▼
         Update PROJECT_STATE.md
              │
              ▼
         @docs (if architecture changed)
```

### Context Cost by Feature

| Feature         | When it loads             | What loads                                    | Cost per request                            |
| --------------- | ------------------------- | --------------------------------------------- | ------------------------------------------- |
| **CLAUDE.md**   | Session start             | Full content (~75 lines)                      | Every request                               |
| **State files** | On-demand (file read)     | Only what's requested                         | Only when read                              |
| **Skills**      | Session start + when used | Descriptions at start, full content when used | Low (descriptions every request)\*          |
| **MCP servers** | Session start             | All tool definitions and schemas              | Every request                               |
| **Subagents**   | When spawned              | Fresh context with specified skills           | Isolated from main session                  |
| **Hooks**       | On trigger                | Nothing (runs externally)                     | **Zero**, unless hook returns systemMessage |

> \* Set `disable-model-invocation: true` in a skill's frontmatter to hide it from Claude until manually invoked. This reduces context cost to **zero** for action skills.

**This project's cost profile:**

- `CLAUDE.md` — ~75 lines (lean, every request, no `@docs/` preloads)
- 3 state files — zero cost until read on-demand (persistent memory)
- 8 knowledge skills — descriptions only until needed (~few hundred tokens)
- 13 action skills — zero cost until manually invoked (`disable-model-invocation: true`)
- 5 path rules — only loaded when working on matching file paths
- 4 hooks — zero tokens (lint, type-check, verdict check, task log check)
- 5 subagents — isolated context, scoped skills, structured outputs, write to TASK_LOG
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

- **Task decomposition**: `/dispatch <task>` — structured breakdown into subagent work units
- **Implementation**: Just describe what you want — rules auto-activate by file path
- **Review**: `/review-code` — forks to reviewer subagent
- **Testing**: `/test-file <path>` — forks to tester subagent
- **Features**: `/new-feature` or `/new-tool`
- **Scaffolding**: `/scaffold tool|component|hook|api <name>`
- **Health**: `/status` — project health dashboard
- **Commit**: `/commit` — conventional commit with quality checks
- **PR**: `/pr [target-branch]` — generate PR description
- **Agent Teams**: `/team on` to enable parallel agents, `/team off` to disable
- **Onboarding**: `/init` — project overview for a new session

### Links

## Multi-agent system

https://code.visualstudio.com/docs/copilot/customization/custom-agents

## Skills marketplace

https://skillsmp.com/

## Github Everything for Claude Code

https://github.com/affaan-m/everything-claude-code

## Claude code context

https://code.claude.com/docs/en/features-overview
