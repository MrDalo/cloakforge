---
name: New Tool
description: "Create a new Solana tool following the 5-layer architecture in TOOLING.md"
agent: Plan
---

Plan a new Solana tool for CloakForge. Follow the 5-layer architecture from `docs/TOOLING.md`:

1. **Read `docs/TOOLING.md`** — understand the 5-layer pattern
2. **Study reference implementations** — Token Creator (complex) or Burn Tokens (simple)
3. **Ask clarifying questions** about the tool's functionality
4. **Create a phased plan** covering all 5 layers:
   - Layer 1: Types and schemas (`src/types/`, `src/lib/schemas/`)
   - Layer 2: Server utility (`src/lib/solana/server-side/`)
   - Layer 3: API route (`src/app/api/solana/{tool}/`)
   - Layer 4: Client hook (`src/hooks/solana/`)
   - Layer 5: UI (page + form components)
5. **Include tests** for each layer

The user will describe what Solana tool they want to build.
