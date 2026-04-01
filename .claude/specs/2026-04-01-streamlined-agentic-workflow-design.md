# Streamlined Agentic Workflow - Auto-Approve Patterns Design

**Date**: 2026-04-01
**Type**: Workflow Enhancement
**Status**: Design Phase

## Context

The current agentic workflow in CloakForge has extensive planning phases and approval gates that create friction for medium and large feature development (Categories B & C). The user experiences bottlenecks in:

1. **Plan approval requirements** - having to approve written specs before implementation
2. **Agent-to-agent approval gates** - manual approval needed between each agent phase

For established patterns (new Solana tools, API endpoints, UI components), the user already knows the desired outcome but must go through extensive Q&A and approval cycles designed for ambiguous/complex work.

**Goal**: Reduce planning overhead while maintaining quality for recognized patterns in Solana tool development.

## Solution: Auto-Approve Patterns System

### Pattern Recognition Engine

**Auto-Approved Patterns:**
- `"Add new Solana tool [toolname]"` → 5-layer architecture (Page → Form → Hook → API → Server utility)
- `"Add API endpoint for [operation]"` → Standard API route + schema pattern
- `"Build UI for [existing API]"` → Standard form component + hook integration
- `"Add [field] to [existing tool]"` → Schema extension + form field addition

**Pattern Detection Logic:**
- Request mentions existing tool names from codebase
- Uses standard Solana operations (burn, freeze, mint, transfer)
- References established patterns in `docs/TOOLING.md`
- Follows 5-layer tool architecture

### Workflow Streamlining

**Current Flow:**
```
Brainstorming → Questions → Plan approval → Agent A approval → Agent B approval → Implementation
```

**New Flow for Recognized Patterns:**
```
Quick-feature skill → Pattern detected → Brief summary → Direct implementation → Auto-continue between agents
```

**Quality Gates Maintained:**
- Shell validation (`npm run lint:nowarn && npx tsc --noEmit`) between phases
- Code review agent validates final output
- Testing requirements still apply

### Implementation Components

**New Skill: `/quick-feature`**
- Location: `.claude/skills/quick-feature/skill.md`
- Combines brainstorming + planning for recognized patterns
- Falls back to normal flow if pattern not recognized
- Uses existing agent definitions with modified prompts

**Pattern Templates:**
- `.claude/templates/solana-tool-template.md` → 5-layer implementation guide
- `.claude/templates/api-endpoint-template.md` → Standard API route pattern
- `.claude/templates/ui-component-template.md` → Form + hook integration guide
- `.claude/templates/schema-extension-template.md` → Zod schema update patterns

**Agent Modifications:**
- Update agent prompts to include "auto-continue" for standard patterns
- Add template references to agent briefs instead of detailed explanations
- Remove approval checkpoints for agent-to-agent handoffs in recognized cases

**State File Optimization:**
- Streamline `PROJECT_STATE.md` updates for standard patterns
- Use `TASK_LOG.md` pattern matching to reference similar previous work
- Reference existing implementations rather than planning from scratch

## Files to Modify

**Create:**
- `.claude/skills/quick-feature/skill.md` (new streamlined skill)
- `.claude/templates/solana-tool-template.md`
- `.claude/templates/api-endpoint-template.md`
- `.claude/templates/ui-component-template.md`
- `.claude/templates/schema-extension-template.md`

**Modify:**
- `.claude/skills/superpowers:brainstorming/skill.md` (add pattern detection mode)
- `.claude/agents/frontend.agent.md` (add auto-continue instructions)
- `.claude/agents/backend.agent.md` (add auto-continue instructions)
- `.claude/agents/orchestrator.agent.md` (add pattern recognition logic)

**Reference Existing:**
- `docs/TOOLING.md` (existing patterns to template)
- `src/app/api/solana/` (existing API patterns)
- `src/components/pages/` (existing UI patterns)
- `.claude/rules/agentic-coordination.md` (current agent coordination)

## Verification Plan

**Test Scenarios:**
1. **Standard Solana tool request** - "Add new NFT metadata tool"
   - Should auto-detect 5-layer pattern
   - Should skip plan approval
   - Should auto-continue between agents
   - Should produce standard tool architecture

2. **API endpoint request** - "Add API for token burn validation"
   - Should reference existing API patterns
   - Should auto-continue without approval gates
   - Should follow established schema patterns

3. **Non-standard request** - "Build complex multi-signature workflow"
   - Should fall back to manual planning flow
   - Should still require approvals and detailed planning
   - Should not attempt auto-approval

**Success Criteria:**
- 50%+ reduction in approval cycles for standard patterns
- Maintained code quality through shell validation gates
- Proper fallback to manual flow for complex/ambiguous work
- All existing quality gates (lint, type check, tests) still enforced

**Rollback Plan:**
- Keep existing skills as backup
- Pattern detection can be disabled by using existing brainstorming skill
- All agent modifications are additive (existing behavior preserved)