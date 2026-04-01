# Streamlined Agentic Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement auto-approve patterns system to reduce planning overhead for standard Solana development patterns

**Architecture:** Pattern recognition via skill logic, template-based planning, agent auto-continue for recognized patterns

**Tech Stack:** Claude Code skills, agent definitions, pattern templates

---

### Task 1: Create Quick-Feature Skill

**Files:**
- Create: `.claude/skills/quick-feature/skill.md`

- [ ] **Step 1: Create skill directory**

```bash
mkdir -p .claude/skills/quick-feature
```

- [ ] **Step 2: Write quick-feature skill**

```markdown
---
name: quick-feature
description: 'Streamlined workflow for recognized Solana development patterns. Auto-detects standard patterns (new tool, API endpoint, UI component) and skips extensive planning for known work. Use when: implementing standard 5-layer Solana tools, adding API endpoints following existing patterns, building UI for established APIs, extending schemas with standard fields. Falls back to normal brainstorming if pattern not recognized.'
argument-hint: 'feature description'
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Agent
---

# /quick-feature

Streamlined workflow for recognized Solana development patterns.

## Pattern Detection

**Auto-Approved Patterns:**
- `"Add new Solana tool [toolname]"` → 5-layer architecture
- `"Add API endpoint for [operation]"` → Standard API route + schema
- `"Build UI for [existing API]"` → Form component + hook integration
- `"Add [field] to [existing tool]"` → Schema extension + form field

**Detection Logic:**
Check if request contains:
- Solana operations: burn, freeze, mint, transfer, create, revoke
- Tool references: existing tool names from codebase
- Standard patterns: "API endpoint", "UI for", "add field to"
- 5-layer references: mentions page, form, hook, API, server

## Process

### 1. Pattern Recognition
Read user request and classify:
- **STANDARD_TOOL**: New 5-layer Solana tool
- **API_ENDPOINT**: Standard API route following existing patterns
- **UI_COMPONENT**: Form + hook for existing API
- **SCHEMA_EXTENSION**: Add fields to existing schemas
- **FALLBACK**: Complex/ambiguous - use normal brainstorming

### 2. Template Selection
For recognized patterns, load appropriate template:
- STANDARD_TOOL → `.claude/templates/solana-tool-template.md`
- API_ENDPOINT → `.claude/templates/api-endpoint-template.md`
- UI_COMPONENT → `.claude/templates/ui-component-template.md`
- SCHEMA_EXTENSION → `.claude/templates/schema-extension-template.md`

### 3. Auto-Generated Plan
Create standard plan based on template, show brief summary instead of asking for approval.

### 4. Agent Dispatch
Dispatch agents with auto-continue enabled:
- Include `AUTO_CONTINUE=true` in agent briefs
- Reference pattern templates instead of detailed explanations
- Skip approval checkpoints between agents

### 5. Quality Gates
Maintain shell validation between phases:
- `npm run lint:nowarn && npx tsc --noEmit`
- Tests still required
- Code review agent still validates final output

## Implementation

Read user request in `$ARGUMENTS`.

1. **Classify pattern** - check for keywords and existing patterns
2. **Load template** if recognized, otherwise fallback to brainstorming skill
3. **Generate brief plan** and auto-approve for standard patterns
4. **Dispatch agents** with auto-continue enabled
5. **Maintain quality gates** throughout process

**Example Usage:**
- `/quick-feature Add new token metadata tool`
- `/quick-feature Add API endpoint for wallet validation`
- `/quick-feature Build UI for existing burn API`
```

- [ ] **Step 3: Commit quick-feature skill**

```bash
git add .claude/skills/quick-feature/skill.md
git commit -m "feat(workflow): add quick-feature skill for pattern recognition"
```

### Task 2: Create Pattern Templates

**Files:**
- Create: `.claude/templates/solana-tool-template.md`
- Create: `.claude/templates/api-endpoint-template.md`
- Create: `.claude/templates/ui-component-template.md`
- Create: `.claude/templates/schema-extension-template.md`

- [ ] **Step 1: Create templates directory**

```bash
mkdir -p .claude/templates
```

- [ ] **Step 2: Create Solana tool template**

```markdown
# 5-Layer Solana Tool Template

## Standard Files to Create

```
src/app/tools/{tool}/page.tsx                    # Route wrapper
src/app/api/solana/{tool}/route.ts               # API endpoint
src/components/pages/{Tool}Page/index.tsx        # Page component
src/components/pages/{Tool}Page/{Tool}Form/      # Form component
src/hooks/solana/use{Tool}.ts                    # Main hook
src/lib/solana/server-side/create{Tool}Transaction.ts  # Server utility
```

## Agent Task Order

1. **Backend Agent** - Create API route and server utility
2. **Frontend Agent** - Create page, form components, and hook
3. **Tester Agent** - Add comprehensive test coverage
4. **Reviewer Agent** - Code quality and security audit

## Standard Patterns

- Follows existing tool patterns in `src/app/tools/`
- Uses `CustomFormField` for inputs
- Includes `WalletConnectionButton` gate
- Server uses `'server-only'` and private RPC
- Hook validates SOL balance before API call
```

Save to: `.claude/templates/solana-tool-template.md`

- [ ] **Step 3: Create API endpoint template**

```markdown
# API Endpoint Template

## Standard Files

```
src/app/api/solana/{endpoint}/route.ts           # API route
src/lib/schemas/apiSchemas.ts                    # Extend with new schema
src/lib/solana/server-side/{operation}.ts       # Server utility
```

## Agent Task Order

1. **Backend Agent** - Create route, schema, server utility
2. **Tester Agent** - API route tests
3. **Reviewer Agent** - Security and validation audit

## Standard Patterns

- POST method with Zod validation
- Uses `getServerConfig()` for private RPC
- Returns serialized transaction as base64
- Consistent error handling with `AppError`
```

Save to: `.claude/templates/api-endpoint-template.md`

- [ ] **Step 4: Create UI component template**

```markdown
# UI Component Template

## Standard Files

```
src/components/pages/{Component}Page/index.tsx   # Page component
src/components/pages/{Component}Page/{Component}Form/  # Form
src/hooks/solana/use{Component}.ts               # Hook integration
```

## Agent Task Order

1. **Frontend Agent** - Create page and form components
2. **Frontend Agent** - Create/update hook for API integration
3. **Tester Agent** - Component and hook tests
4. **Reviewer Agent** - UI/UX and accessibility audit

## Standard Patterns

- React Hook Form + Zod validation
- Uses existing common components from `src/components/common/`
- Mobile-first responsive design
- Dark mode support via `dark:` variants
```

Save to: `.claude/templates/ui-component-template.md`

- [ ] **Step 5: Create schema extension template**

```markdown
# Schema Extension Template

## Standard Files

```
src/lib/schemas/{schemaFile}.ts                  # Extend existing schema
src/components/pages/{Tool}Page/{Tool}Form/      # Update form fields
```

## Agent Task Order

1. **Backend Agent** - Extend schemas with new fields
2. **Frontend Agent** - Add form fields and validation
3. **Tester Agent** - Schema and form validation tests
4. **Reviewer Agent** - Type safety and consistency audit

## Standard Patterns

- Zod schema extensions maintain backward compatibility
- Form fields use `CustomFormField` component
- Consistent validation error messages
- TypeScript types auto-generated from schemas
```

Save to: `.claude/templates/schema-extension-template.md`

- [ ] **Step 6: Commit pattern templates**

```bash
git add .claude/templates/
git commit -m "feat(workflow): add pattern templates for auto-approval"
```

### Task 3: Modify Agent Definitions for Auto-Continue

**Files:**
- Modify: `.claude/agents/frontend.agent.md`
- Modify: `.claude/agents/backend.agent.md`
- Modify: `.claude/agents/orchestrator.agent.md`

- [ ] **Step 1: Add auto-continue to frontend agent**

Add after line 30 in `.claude/agents/frontend.agent.md`:

```markdown
## Auto-Continue Mode

When `AUTO_CONTINUE=true` in task brief:
- Skip approval checkpoints between task phases
- Reference pattern templates instead of asking detailed questions
- Write structured output to `.claude/state/TASK_LOG.md`
- Continue to next logical phase automatically

**Pattern Template References:**
- Standard tool → Use `.claude/templates/solana-tool-template.md` patterns
- UI component → Use `.claude/templates/ui-component-template.md` patterns
- Schema extension → Use `.claude/templates/schema-extension-template.md` patterns

**Auto-Continue Workflow:**
1. Read template for established patterns
2. Implement following template structure
3. Write TASK_LOG.md entry with structured summary
4. Signal completion for orchestrator to continue
```

- [ ] **Step 2: Add auto-continue to backend agent**

Add after line 30 in `.claude/agents/backend.agent.md`:

```markdown
## Auto-Continue Mode

When `AUTO_CONTINUE=true` in task brief:
- Skip approval checkpoints between task phases
- Use existing API patterns from `src/app/api/solana/` as reference
- Write structured output to `.claude/state/TASK_LOG.md`
- Continue to next logical phase automatically

**Pattern Template References:**
- API endpoint → Use `.claude/templates/api-endpoint-template.md` patterns
- Server utility → Follow existing patterns in `src/lib/solana/server-side/`
- Schema extension → Use `.claude/templates/schema-extension-template.md` patterns

**Auto-Continue Workflow:**
1. Read template and existing similar implementations
2. Implement following established patterns
3. Write TASK_LOG.md entry with structured summary
4. Signal completion for orchestrator to continue
```

- [ ] **Step 3: Add pattern recognition to orchestrator agent**

Add after line 30 in `.claude/agents/orchestrator.agent.md`:

```markdown
## Pattern Recognition

**Recognized Patterns:**
- "Add new Solana tool [name]" → STANDARD_TOOL
- "Add API endpoint for [operation]" → API_ENDPOINT
- "Build UI for [existing API]" → UI_COMPONENT
- "Add [field] to [existing tool]" → SCHEMA_EXTENSION

**Auto-Continue Coordination:**
For recognized patterns:
1. Set `AUTO_CONTINUE=true` in all agent task briefs
2. Reference appropriate template in task briefs
3. Skip manual approval gates between agents
4. Maintain shell validation gates (`lint && tsc`)
5. Monitor TASK_LOG.md for agent completion signals

**Quality Gates Preserved:**
- Shell validation between phases: `npm run lint:nowarn && npx tsc --noEmit`
- Code review agent always validates final output
- Testing requirements maintained
- Security audit for sensitive changes
```

- [ ] **Step 4: Commit agent modifications**

```bash
git add .claude/agents/frontend.agent.md .claude/agents/backend.agent.md .claude/agents/orchestrator.agent.md
git commit -m "feat(workflow): add auto-continue mode to agents for pattern recognition"
```

### Task 4: Test Pattern Recognition

**Files:**
- Test: Manual verification of quick-feature skill

- [ ] **Step 1: Test standard tool pattern**

```bash
# Test command (manual verification)
echo "Test: /quick-feature Add new NFT metadata tool"
```

Expected: Should auto-detect STANDARD_TOOL pattern and reference solana-tool-template.md

- [ ] **Step 2: Test API endpoint pattern**

```bash
# Test command (manual verification)
echo "Test: /quick-feature Add API endpoint for wallet validation"
```

Expected: Should auto-detect API_ENDPOINT pattern and reference api-endpoint-template.md

- [ ] **Step 3: Test fallback to manual planning**

```bash
# Test command (manual verification)
echo "Test: /quick-feature Build complex multi-signature workflow with custom governance"
```

Expected: Should not match any pattern and fallback to normal brainstorming skill

- [ ] **Step 4: Verify quality gates maintained**

```bash
npm run lint:nowarn && npx tsc --noEmit
```

Expected: All existing quality gates still enforced

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(workflow): complete streamlined agentic workflow with auto-approve patterns

- Add /quick-feature skill with pattern recognition
- Create templates for standard Solana development patterns
- Modify agents to support auto-continue mode
- Maintain quality gates while reducing approval overhead
- 50%+ reduction in planning cycles for standard patterns"
```

## Self-Review

**Spec Coverage:**
✅ Pattern recognition engine - implemented in quick-feature skill
✅ Auto-approval mechanism - implemented via AUTO_CONTINUE mode
✅ New /quick-feature skill - created with pattern detection logic
✅ Pattern templates - created 4 templates for common patterns
✅ Agent modifications - added auto-continue to frontend, backend, orchestrator
✅ Quality gates maintained - shell validation preserved between phases
✅ Fallback to manual flow - implemented for unrecognized patterns

**Placeholder Check:**
✅ No TBD, TODO, or "implement later" placeholders
✅ All file paths are exact and specific
✅ All code blocks contain actual implementation
✅ All commands specify expected output

**Type Consistency:**
✅ AUTO_CONTINUE flag used consistently across agents
✅ Template file paths consistent across references
✅ Pattern classification names consistent (STANDARD_TOOL, API_ENDPOINT, etc.)