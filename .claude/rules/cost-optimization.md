---
globs: '.claude/**/*.md'
description: Cost-conscious development patterns to minimize token usage while maximizing output quality
---

# Cost Optimization Rules

## Core Principle
**Every token costs money and degrades quality past threshold.** Optimize for minimal context, maximum productivity.

## Pre-LLM Validation (Zero Token Cost)

### Shell-First Strategy
```bash
# Before any agent dispatch:
npm run lint:nowarn && npx tsc --noEmit

# Before reviewer agent:
npm test

# Before docs agent:
git status --porcelain | wc -l  # Count changed files
```

### Validation Gates
- **Lint errors** → fix with shell tools, not LLM
- **Type errors** → address with TypeScript compiler, not LLM
- **Test failures** → run specific tests, debug with logs first
- **Build failures** → check build output, resolve dependencies first

## Context Minimization Strategies

### 1. **File Loading Discipline**
- **1-3 files maximum** per agent task
- **Exact file paths** — no exploratory "figure out the structure"
- **Pattern references** — point to existing code, don't copy/paste into brief
- **State files first** — read PROJECT_STATE.md before exploring

### 2. **Negative Constraints (Critical)**
Always specify what agents should NOT do:
```markdown
### CONSTRAINTS
- Do NOT modify files outside src/components/pages/
- Do NOT explore src/lib/solana/ or src/app/api/
- Do NOT create new common components
- Do NOT read more than 3 files for context
```

### 3. **Structured Outputs Only**
- **TASK_LOG.md entries** — not prose responses
- **Bullet point summaries** — not detailed explanations
- **File lists** — not descriptions of what was changed
- **Result status** — SUCCESS | PARTIAL | BLOCKED

## Agent Task Sizing

### Right-Sized Tasks ✅
- Create one API route
- Build one component
- Write tests for one function
- Update one documentation section

### Wrong-Sized Tasks ❌
- "Fix all the failing tests" (too broad)
- "Understand the codebase" (exploration)
- "Review everything" (massive context)
- "Figure out what's wrong" (debugging without scope)

## Memory Management

### State-Driven Development
```markdown
# Instead of exploring:
1. Read .claude/state/PROJECT_STATE.md
2. Read .claude/state/TASK_LOG.md (last 5 entries)
3. Read .claude/state/DECISIONS.md (relevant sections)

# Never:
- Load full conversation transcripts
- Explore directory structures
- Read "to understand the project"
```

### Context Hierarchy
1. **Current state** → `.claude/state/` files
2. **Conventions** → `.claude/rules/` files
3. **Architecture** → `docs/` files (on-demand only)
4. **Implementation** → `src/` files (specific paths only)

## Token-Efficient Patterns

### 1. **Reference-Based Briefs**
```markdown
# Instead of:
"Use this pattern: [500 lines of code copied]"

# Use:
"Follow pattern in src/app/api/solana/burn-tokens/route.ts"
```

### 2. **Shell Command Chains**
```bash
# Combine validation steps:
npm run lint:nowarn && npx tsc --noEmit && npm test:silent

# Check status before dispatch:
git status --porcelain && git branch --show-current
```

### 3. **Batched Operations**
- Group similar tasks for single agent
- Parallel independent work
- Sequential dependent work only

## Quality vs Cost Trade-offs

### High-Value, Low-Cost
- ✅ Shell command validation
- ✅ Pattern references
- ✅ State file updates
- ✅ Scoped agent tasks

### Low-Value, High-Cost
- ❌ Exploratory codebase reading
- ❌ Verbose explanations in responses
- ❌ "Understanding" tasks
- ❌ Open-ended debugging

## Metrics to Track

### Cost Indicators
- **Files read per task** — target: 1-3
- **Agent response length** — target: structured format only
- **Context loading** — only relevant files
- **Retry rates** — well-scoped tasks succeed first try

### Quality Indicators
- **Zero lint warnings** — shell validation success
- **Zero type errors** — TypeScript validation success
- **Test coverage** — measured after implementation
- **Architecture compliance** — reviewer agent validation

## Emergency Patterns

### When Tasks Fail
1. **Scope reduction** — split into smaller tasks
2. **Context minimization** — fewer files, clearer constraints
3. **Pattern clarification** — point to specific examples
4. **Shell debugging** — validate environment before retry

### When Context Explodes
1. **Stop immediately** — don't continue with bloated context
2. **Reset to state files** — start from known good state
3. **Re-scope task** — smaller, more focused work unit
4. **Use different agent** — if current agent accumulated too much context

## Cost-Optimized Workflows

### Feature Development
```
1. Read PROJECT_STATE.md (orchestrator)
2. Shell validation (orchestrator)
3. Scoped task dispatch (1-3 files each)
4. TASK_LOG.md updates (agents)
5. Integration validation (shell commands)
6. State update (orchestrator)
```

### Bug Fixing
```
1. Shell commands to reproduce bug
2. Logs analysis (not code exploration)
3. Minimal context agent dispatch
4. Test-driven fix validation
5. State update with lessons learned
```

### Code Review
```
1. Shell validation first (lint/type/test)
2. Specific file scope only
3. Pattern compliance check
4. Security audit (targeted)
5. Brief summary (not detailed explanation)
```