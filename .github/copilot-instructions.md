# CloakForge AI Instructions

## 🏗 Project Context

- **Stack**: Next.js 16 (App Router), React 19, TypeScript 5+, Tailwind 4 + shadcn/ui, @solana/web3.js + @solana/kit.
- **State**: TanStack Query (Server), Zustand (Client), React Hook Form 8 + Zod 4.
- **Dev Server**: Runs on **port 3001** (`npm run dev`).
- **Docs**: Read `docs/{ARCHITECTURE,DEVELOPMENT,TOOLING,TROUBLESHOOTING}.md` for deep dives. **NEVER** create new `.md` files.

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
