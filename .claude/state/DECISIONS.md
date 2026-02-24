# Architecture Decisions

> Non-obvious decisions and their rationale. Read on-demand when context is needed.
> Each entry explains WHY something was built the way it was — not HOW.

## Format

```
### ADR-NNN: <Title>
- **Date**: YYYY-MM-DD
- **Status**: Accepted | Superseded by ADR-NNN | Deprecated
- **Context**: What problem or question prompted this decision?
- **Decision**: What was decided?
- **Rationale**: Why this approach over alternatives?
- **Consequences**: What trade-offs does this create?
```

---

### ADR-001: Hybrid Client/Server Transaction Model

- **Date**: 2025-01-01
- **Status**: Accepted
- **Context**: Solana dApp needs to build transactions server-side but keep private keys client-side.
- **Decision**: Server prepares unsigned transactions via private RPC; client signs with wallet adapter and sends.
- **Rationale**: Privacy-first (no keys on server), performance (private RPC avoids rate limits), security (server validates before building).
- **Consequences**: Requires serialization/deserialization between client and server. API routes must never require signatures.

### ADR-002: 5-Layer Tool Architecture

- **Date**: 2025-01-01
- **Status**: Accepted
- **Context**: Each Solana tool (token creator, burn, freeze, etc.) needs a consistent structure.
- **Decision**: Every tool follows: Page → Form → Hook → API Route → Server Utility.
- **Rationale**: Predictable patterns reduce cognitive load, enable code generation, and make reviews faster.
- **Consequences**: Some simple tools have more layers than strictly necessary. Trade-off: consistency > minimalism.

### ADR-003: Privacy-First No-Data-Collection

- **Date**: 2025-01-01
- **Status**: Accepted
- **Context**: Users interact with financial assets. Trust requires no tracking.
- **Decision**: No analytics, no cookies, no user data stored server-side. No authentication required.
- **Rationale**: Reduces legal liability, simplifies architecture, builds user trust.
- **Consequences**: No user-specific features (history, favorites). Can't track usage for product decisions.

### ADR-004: React Compiler — No Manual Memoization

- **Date**: 2025-01-01
- **Status**: Accepted
- **Context**: React 19 includes a compiler that auto-optimizes re-renders.
- **Decision**: Ban `useMemo`, `useCallback`, `React.memo` — let the compiler handle it.
- **Rationale**: Less code, fewer bugs from stale closures, compiler is more reliable than manual memoization.
- **Consequences**: Team must not rely on reference equality for non-rendering logic. ESLint enforces this.

### ADR-005: Agent Team Architecture for Claude Code

- **Date**: 2025-02-23
- **Status**: Accepted
- **Context**: Need efficient AI-assisted development that minimizes token cost while maintaining quality.
- **Decision**: Lean orchestrator + scoped subagents + persistent state files + shell hooks for validation.
- **Rationale**: Files as memory (not context), hierarchical summarization, selective loading, fail-fast with zero-token shell scripts.
- **Consequences**: Requires discipline in state file updates. Subagents must write structured outputs to TASK_LOG.md.

### ADR-006: VersionedTransaction (v0) Without Address Lookup Tables

- **Date**: 2025-02-23
- **Status**: Accepted
- **Context**: Batch tools (multisender, freeze, unfreeze) build multiple transactions. The primary benefit of v0 is support for Address Lookup Tables (ALTs) which compress repeated addresses in the 1232-byte MTU. However, ALTs require a separate on-chain create + extend + wait-for-activation flow (~1 slot delay) before they can be referenced.
- **Decision**: Use `VersionedTransaction` (v0) for all batch-capable tools but compile to v0 **without** ALTs for now. Single-operation tools (burn, revoke) remain on legacy `Transaction` with client-side blockhash refresh.
- **Rationale**: v0 without ALTs is functionally equivalent to legacy but provides a migration path for ALTs later. Adding ALTs now would add latency (activation wait), complexity (ALT lifecycle management), and cost (rent for ALT accounts) for marginal size savings at our current batch size of 10 recipients/tx. With 10 SPL recipients, tx size is comfortably within the 1232-byte limit without ALTs.
- **Consequences**: Repeated addresses (wallet, mint, token program, ATA program) are duplicated across instructions within each transaction. When recipient batches grow significantly (>15 SPL recipients/tx), ALTs should be revisited. This decision should be re-evaluated when implementing higher-throughput features.
