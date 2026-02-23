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
