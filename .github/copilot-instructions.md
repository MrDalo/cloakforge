# CloakForge AI Instructions

## VS Code Baseline

- **Minimum VS Code**: 1.110+
- **Copilot Chat**: keep extension updated (security fixes were shipped in 1.110.1)
- **Primary mode**: Agent mode (Edit mode is deprecated)

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

- **User-invokable**: `@Conductor` (orchestrator), `@Plan` (research & planning)
- **Subagents** (invoked by Conductor): `frontend`, `backend`, `test`, `review`, `docs`
- **Skills** in `.github/skills/` provide domain knowledge (loaded on-demand by description match)
- **Prompts** in `.github/prompts/`: `/new-feature`, `/new-tool`, `/fix-bug`, `/review-code`, `/refactor`

## 🧭 1.110 Agent Workflow

- **Browser tools enabled** in workspace settings for agent-driven UI verification.
- **Auto-approval enabled by default** for speed. Use `/disableAutoApprove` when working near risky shell operations, then re-enable with `/autoApprove`.
- Use `/compact` in long sessions to reduce context pressure.
- Use `/fork` to branch an alternative implementation path without losing the main thread.
- Use the **Agent Debug panel** to inspect loaded prompts/skills/agents and tool-call flow when behavior is unexpected.

## 🔒 Safety With Auto-Approve

- Keep terminal sandboxing enabled in workspace settings.
- Prefer scoped commands and avoid destructive shell operations.
- For security-sensitive changes, run a `review` pass even when edits were auto-approved.
