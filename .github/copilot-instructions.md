# CloakForge AI Instructions

## VS Code Baseline

- **Minimum VS Code**: 1.110+
- **Copilot Chat**: keep extension updated (security fixes were shipped in 1.110.1)
- **Primary mode**: Agent mode (Edit mode is deprecated)

## Session Targets (Local vs Copilot CLI)

- **Local session**: best for interactive work, frequent clarifications, and quick supervision loops.
- **Copilot CLI session**: best for long-running autonomous work, orchestration across parallel tasks, and work that should continue when VS Code closes.
- For multi-step implementation, start in **Local** to clarify scope, then hand off to **Copilot CLI** for background execution when context is stable.
- For parallel implementation, prefer **Copilot CLI + Worktree isolation** to reduce branch/workspace interference.

## 🏗 Project Context

- **Stack**: Next.js 16 (App Router), React 19, TypeScript 5+, Tailwind 4 + shadcn/ui, @solana/web3.js + @solana/kit.
- **State**: TanStack Query (Server), Zustand (Client), React Hook Form 8 + Zod 4.
- **Dev Server**: Runs on **port 3001** (`npm run dev`).
- **Docs**: `docs/{ARCHITECTURE,DEVELOPMENT,TOOLING,TROUBLESHOOTING}.md` are the source of truth. **NEVER** create new `.md` files.

## ✅ Accuracy First (Reduce Hallucination)

- When unsure, read the relevant doc or code before acting.
- Prefer existing patterns in src/ over inventing new ones.
- Use package.json as the source of truth for scripts/versions.
- If docs and code disagree, follow the docs and flag the mismatch.

## Routing Rules (Simple vs Complex)

- **Simple tasks (<= 3 files, clear scope)**: execute directly, no mandatory planning phase.
- **Complex tasks (4+ files, multi-layer, unclear dependencies)**: use orchestration (Plan -> implement phases -> review).
- **Unclear requirements**: ask one targeted clarification before planning.
- **Never over-orchestrate** straightforward edits.

## Cost and Quality Gates

- Run shell validation before major delegation: `npm run lint:nowarn && npx tsc --noEmit`.
- Use small subagent scopes (1-3 files) with explicit negative constraints.
- Prefer pattern references over broad codebase exploration.
- Keep outputs structured: changed files, result status, follow-ups.

## 🔎 Source-of-Truth Order

1. docs/{ARCHITECTURE,DEVELOPMENT,TOOLING,TROUBLESHOOTING}.md
2. src/ (existing patterns)
3. package.json (scripts/versions)

## 🏛 Architecture & Patterns

- **Hybrid Model**: Client signs transactions; Server (Private RPC) prepares/validates them.
- **Server Logic**: Located in `src/lib/solana/server-side/` (e.g., `createTokenCreationTransaction.ts`).
- **Client Logic**: Hooks in `src/hooks/solana/` orchestrate flows (validate balance -> API call -> sign -> send).
- **Components**: Check `src/components/common/` FIRST (e.g., `InfoTooltip`, `ExplorerLink`, `WalletConnectionButton`).
- **Utilities**: Import from `@/lib/solana` (barrel file). **NEVER** use `src/lib/solana/utils.ts` directly.

## 💻 Coding Conventions

- **Linting**: Zero warnings policy. Run `npm run lint:nowarn`.
- **Solana**:
  - Use `LAMPORTS_PER_SOL` from `@solana/web3.js`.
  - Use `isValidSolanaAddress` from `@/lib/solana`.
  - Server-side ops MUST use `rpcPrivateEndpoint`.
- **Error Handling**: Use `AppError` / `SolanaError` from `@/lib/errors`. Use `handleError()` for messages.
- **Logging**: Use `getLogger({ context: '...' })` from `@/lib/logger/logger`.

## 🚫 Anti-Patterns

- **Do NOT** create duplicate components/utils. DRY is strict.
- **Do NOT** use public RPC endpoints in server-side code.
- **Do NOT** store user data server-side (Privacy-First).
- **Do NOT** use `any`. Strict TypeScript is enforced.

## 🛠 Key Directories

- `src/app/tools/`: Tool pages (e.g., `token-creator`, `freeze-wallets`).
- `src/lib/solana/server-side/`: Transaction preparation logic.
- `src/components/common/`: Reusable UI components.
- `src/lib/schemas/`: Zod validation schemas.

## 🤖 Agent Team

This project uses a multi-agent Copilot team. See `AGENTS.md` for the full roster.

- **User-invokable**: `@orchestrator`, `@Plan`, `@monitor`
- **Subagents** (invoked by orchestrators): `frontend`, `backend`, `test`, `review`, `docs`
- **Skills** in `.github/skills/` provide domain knowledge (loaded on-demand by description match)
- **Prompts** in `.github/prompts/`: `/new-feature`, `/new-tool`, `/fix-bug`, `/review-code`, `/refactor`, `/optimize`, `/orchestrate`, `/agentic-status`

## 🧭 1.110 Agent Workflow

- **Browser tools enabled** in workspace settings for agent-driven UI verification.
- **Auto-approval enabled by default** for speed. Use `/disableAutoApprove` when working near risky shell operations, then re-enable with `/autoApprove`.
- Use `/compact` in long sessions to reduce context pressure.
- Use `/fork` to branch an alternative implementation path without losing the main thread.
- Use the **Agent Debug panel** to inspect loaded prompts/skills/agents and tool-call flow when behavior is unexpected.

## Parallel Orchestration Pattern

- Phase 1 (parallel): independent frontend/backend work.
- Phase 2 (sequential): dependent hooks/tests.
- Phase 3 (quality): `review` gate and optional docs updates.
- Re-run lint/type checks between phases for fail-fast feedback.

## 🔒 Safety With Auto-Approve

- Keep terminal sandboxing enabled in workspace settings.
- Prefer scoped commands and avoid destructive shell operations.
- For security-sensitive changes, run a `review` pass even when edits were auto-approved.
- Never auto-commit; propose commit messages and wait for user confirmation.
