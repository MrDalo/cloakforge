---
name: new-feature
description: Plan and implement a new feature end-to-end following CloakForge patterns. Use when the user requests a new feature, page, capability, enhancement, or non-trivial code change that requires systematic implementation across multiple layers (schemas, API, hooks, UI, tests). Triggers on: "add a feature", "implement X", "build Y", "create a page for", "I need Z functionality", or any multi-layer change that touches more than one file. Use new-tool skill instead for standalone Solana tool creation.
---

# /new-feature

Read docs on-demand — only the ones relevant to the feature type:
- `docs/ARCHITECTURE.md` — if feature touches providers, data flow, or system design
- `docs/TOOLING.md` — if feature is or extends a Solana tool (5-layer pattern)
- `docs/DEVELOPMENT.md` — if unsure about conventions or stack specifics

## Step 1: Research (before planning)

1. Search `src/components/common/` — reuse before creating
2. Search `src/hooks/` — does a similar hook exist?
3. Scan `src/app/tools/` for the closest existing tool as a reference
4. Check `src/lib/schemas/apiSchemas.ts` — extend existing schemas, don't create new files
5. Read `.claude/state/PROJECT_STATE.md` to understand active sprint context

## Step 2: Clarify (if ambiguous)

Determine the type of feature:

**Feature involves a Solana transaction?** → Follow new-tool 5-layer pattern
**Feature is UI-only?** → Phases 1 and 2 are schema/hook only; no server utility needed
**Feature adds a new page?** → Needs route + page component + form (if interactive)
**Feature changes existing behavior?** → Identify all affected files before touching anything

Ask **at most one** targeted question if genuinely ambiguous — otherwise proceed directly to planning. Never ask multiple questions before writing code.

## Step 3: Plan (phased)

Always plan before implementing. Phases create natural checkpoints.

See `references/planning-templates.md` for the full template with checklists.

### Phase structure
| Phase | Content | Validate After |
|-------|---------|----------------|
| 1 | Types, Zod schemas, server utilities | `npx tsc --noEmit` |
| 2 | API routes, error handling | `npm run lint:nowarn` |
| 3 | Hooks, components, page integration | `npm run lint:nowarn && npx tsc --noEmit` |
| 4 | Tests, accessibility, final validation | `npm test` |

Determine which phases apply — a UI-only feature skips Phase 2 server work.

## Step 4: Implement

Execute phase by phase. After each phase:
1. Run `npm run lint:nowarn && npx tsc --noEmit`
2. Fix all issues before continuing to next phase
3. Never proceed to Phase N+1 with lint errors from Phase N

### Conventions checklist (per file)
- Import from `@/lib/solana` barrel only (never individual util files)
- Errors: `AppError` / `SolanaError` — never `throw new Error()` at API boundaries
- Logging: `getLogger({ context: '...' })` — never `console.log`
- Server files: `'server-only'` directive + `rpcPrivateEndpoint` from `getServerConfig()`
- No `any`, no `useMemo` / `useCallback` / `React.memo`
- `'use client'` only when component uses hooks, events, or browser APIs

## Step 5: Review

Run before claiming done:
```bash
npm run lint:nowarn && npx tsc --noEmit && npm test
```

If feature touches architecture or docs, update the relevant doc in `docs/`.
Update `.claude/state/PROJECT_STATE.md` and `.claude/state/TASK_LOG.md`.

## Definition of Done

- [ ] All planned files created per phase plan
- [ ] `npm run lint:nowarn` — zero warnings
- [ ] `npx tsc --noEmit` — zero type errors
- [ ] `npm test` — all tests pass
- [ ] Accessible: keyboard navigable, labels on form inputs, no color-only information
- [ ] DRY: no duplicate components (used `src/components/common/` where applicable)
- [ ] Docs updated if architecture changed
- [ ] State files updated (PROJECT_STATE, TASK_LOG)
