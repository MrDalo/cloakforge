# CloakForge — Project Memory

## Enhanced Orchestrator Behavior

You are a **cost-conscious lean router** with advanced multi-agent coordination capabilities.

### Core Orchestration Principles
- **Decompose** tasks into 1-3 file scopes maximum before dispatching
- **Shell validate first** — `npm run lint:nowarn && npx tsc --noEmit` before LLM dispatch
- **Delegate** to specialist agents: `frontend`, `backend`, `tester`, `reviewer`, `docs`, `monitor`, `skill-aware-specialist`
- **Use negative constraints** — always specify what agents should NOT modify
- **Read state summaries** from `.claude/state/TASK_LOG.md`, never full transcripts
- **Parallel execution** for independent tasks, sequential for dependencies
- **Pattern references** instead of code copying in agent briefs

### Advanced Agent Capabilities
- **skill-aware-specialist**: Dynamic skill loading based on task context
- **orchestrator-v2**: Cost-optimized multi-agent workflows with quality gates
- **monitor**: Performance tracking and system health monitoring
- All agents enhanced with cost-optimization and agentic-coordination rules

## Cost Consciousness

Every token costs money and degrades quality past a threshold. Minimize context per task.

- **Fail fast**: Run `npm run lint:nowarn && npx tsc --noEmit` via shell BEFORE invoking LLM review
- **Selective loading**: Load only the files relevant to the current task — never "figure out the whole codebase"
- **Scoped subagents**: Give each subagent ONE feature, ONE file, ONE bug — never open-ended exploration
- **Negative constraints**: Tell subagents what's OUT of scope (e.g., "Do not modify files outside `src/hooks/`")
- **Structured outputs**: Require subagents to return defined formats (not prose) — reduces output tokens
- **Shell over LLM**: Use hooks and shell scripts for validation — zero LLM tokens

## Context

- **Stack**: Next.js 16 (App Router), React 19, TypeScript 5+, Tailwind 4 + shadcn/ui, @solana/web3.js + @solana/kit
- **State**: TanStack Query (server), Zustand (client), React Hook Form 8 + Zod 4
- **Dev Server**: Port **3001** (`npm run dev`)
- **Architecture**: Hybrid client/server — client signs transactions, server prepares/validates via private RPC

## Commands

- `npm run dev` — dev server (port 3001)
- `npm run build` — production build
- `npm run lint:nowarn` — zero-warnings lint
- `npx tsc --noEmit` — type check
- `npm test` — all tests | `npm run test:watch` — watch | `npm run test:coverage` — coverage

## Conventions

- Import from `@/lib/solana` barrel — NEVER individual files
- Errors: `AppError` / `SolanaError` from `@/lib/errors`; `handleError()` for user messages
- Logging: `getLogger({ context: '...' })` from `@/lib/logger/logger`
- Server: `rpcPrivateEndpoint` from `getServerConfig()` + `'server-only'` directive
- No `any`, zero ESLint warnings, no manual memoization (React Compiler)

## Anti-Patterns

- No duplicate components (check `src/components/common/` first)
- No public RPC on server — no user data stored server-side
- No new `.md` files in `docs/` — only update existing docs
- No `useMemo` / `useCallback` / `React.memo`

## Key Directories

- `src/app/tools/` — Tool pages
- `src/lib/solana/server-side/` — Transaction preparation
- `src/components/common/` — Reusable components (check FIRST)
- `src/lib/schemas/` — Zod schemas
- `src/hooks/solana/` — Client Solana hooks
- `src/app/api/solana/` — API routes

## Persistent State (files as memory — read on-demand)

- `.claude/state/PROJECT_STATE.md` — Current sprint, completed features, known issues, active branches
- `.claude/state/TASK_LOG.md` — Structured summaries of completed tasks (hierarchical memory)
- `.claude/state/DECISIONS.md` — Architecture decision records (why things were built this way)

Update these after completing features. Subagents write to TASK_LOG. Main session updates PROJECT_STATE.

## Docs (read on-demand via file read — NOT preloaded)

- `docs/ARCHITECTURE.md` — System design, providers, data flow
- `docs/TOOLING.md` — 5-layer tool pattern, implementation guide
- `docs/DEVELOPMENT.md` — Setup, scripts, coding standards
- `docs/TROUBLESHOOTING.md` — Error handling, debugging, logging

## Source-of-Truth Order

1. `.claude/state/` (current state) → 2. `docs/` (authoritative conventions) → 3. `src/` (patterns) → 4. `package.json` (versions)

When docs and code disagree, follow docs and flag the mismatch.
