---
globs: '.claude/**/*.md'
description: Advanced multi-agent coordination patterns for optimal Claude Code workflows
---

# Agentic Coordination Rules

## Agent Orchestration Patterns

### 1. **Parallel Execution Strategy**

Execute independent tasks simultaneously:
```
Phase 1 (Parallel):
├── backend: API routes + schemas
├── frontend: components (no API dependency)
└── docs: architecture updates

Phase 2 (Sequential):
├── frontend: hooks using new API
├── tester: comprehensive test suite
└── reviewer: integration audit
```

### 2. **Context Minimization**

- **One file per agent task** — never give agents 10+ files to read
- **Negative constraints** — always specify what NOT to modify
- **Scoped briefs** — 1 feature, 1 layer, 1 component maximum
- **Reference patterns** — point to existing code instead of explaining patterns

### 3. **Quality Gate Orchestration**

```bash
# Between every phase:
npm run lint:nowarn && npx tsc --noEmit

# Before reviewer agent:
npm test

# Before docs agent:
git status --porcelain
```

### 4. **Memory-Driven Coordination**

**Read state, don't explore:**
- PROJECT_STATE.md → current context
- TASK_LOG.md → agent summaries
- DECISIONS.md → architectural choices
- Never load full transcripts

## Task Brief Templates

### Backend Task
```markdown
## Task Brief: Add {feature} API route

**Agent**: backend
**Priority**: P0 (blocks frontend) | P1 (important) | P2 (nice)
**Depends on**: None | {other-task}

### TASK
Create API route for {specific operation} with Zod validation

### FILES
- Read: src/app/api/solana/existing-tool/route.ts (pattern)
- Create: src/app/api/solana/{tool}/route.ts
- Extend: src/lib/schemas/apiSchemas.ts

### CONSTRAINTS
- Do NOT modify files outside src/app/api/, src/lib/schemas/
- Do NOT create new schema files
- Do NOT explore src/components/ or src/hooks/

### SUCCESS CRITERIA
- Returns serialized transaction as base64
- Validates with existing Zod pattern
- Zero lint warnings, zero type errors
```

### Frontend Task
```markdown
## Task Brief: Build {component} UI

**Agent**: frontend
**Priority**: P1
**Depends on**: backend-api-{task}

### TASK
Create page component and form for {specific feature}

### FILES
- Read: src/components/pages/ExistingTool/ (pattern)
- Create: src/app/tools/{tool}/page.tsx
- Create: src/components/pages/{Tool}Page/

### CONSTRAINTS
- Do NOT modify src/app/api/ or src/lib/solana/server-side/
- Do NOT create new common components (check src/components/common/ first)
- Do NOT implement hook logic (separate task)

### SUCCESS CRITERIA
- Uses CustomFormField for inputs
- Includes WalletConnectionButton gate
- Form validates with existing schema
```

## Cost Optimization Rules

### 1. **Token Budget Management**
- **Structured outputs only** — no prose responses
- **Shell validation first** — lint/typecheck before LLM review
- **Minimal context loading** — 1-3 files max per agent
- **Batch similar tasks** — group related work

### 2. **Anti-Patterns to Avoid**
- ❌ "Figure out the codebase" — expensive exploration
- ❌ "Review all the files" — massive context load
- ❌ "Understand the architecture" — read docs/ARCHITECTURE.md instead
- ❌ Open-ended agent tasks — always scope precisely

### 3. **Efficient Delegation**
- **Pre-validate** with shell commands before agent dispatch
- **Use references** instead of copying patterns into briefs
- **Require summaries** — agents write to TASK_LOG.md, not prose responses
- **Fail fast** — abandon tasks that can't be scoped tightly

## Agent Communication Protocol

### Request Format
```markdown
**AGENT**: {agent-name}
**TASK**: {1-line description}
**FILES**: {exact-paths}
**CONSTRAINTS**: {negative-constraints}
**OUTPUT**: TASK_LOG.md entry + file changes
```

### Response Format
```markdown
### [DATE] {type}({scope}): {description}

- **Agent**: {agent-name}
- **Files changed**: {list}
- **Result**: SUCCESS | PARTIAL | BLOCKED
- **Follow-up**: {next-steps} | None
```

## Error Handling

### Agent Task Failures
1. **Blocked tasks** — escalate dependencies to orchestrator
2. **Partial completion** — clearly define what's incomplete
3. **Constraint violations** — agent exceeded scope bounds

### Recovery Patterns
- **Timeout** → reduce task scope and retry
- **Dependency missing** → reorder execution plan
- **Context overflow** → split task across multiple agents
- **Constraint violation** → add negative constraints and retry

## Agent Team Coordination

### Role Definitions
- **Orchestrator** — planning, delegation, state updates
- **Frontend** — UI, components, client-side hooks
- **Backend** — API routes, server utilities, schemas
- **Tester** — test implementation, TDD validation
- **Reviewer** — code quality, security, compliance
- **Docs** — architecture updates, pattern documentation

### Handoff Protocols
- Backend → Frontend: API route ready, schema validated
- Frontend → Tester: UI implemented, ready for test coverage
- Tester → Reviewer: Tests passing, ready for quality audit
- Reviewer → Docs: Code reviewed, architecture changes noted