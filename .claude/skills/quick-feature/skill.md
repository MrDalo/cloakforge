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
