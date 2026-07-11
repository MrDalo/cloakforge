# Superpowers Usage Control

## Override Default Superpowers Behavior

**Default Mode: Simple Direct Execution**
- Do NOT automatically invoke superpowers skills
- Implement requests directly without brainstorming, planning, or multi-agent workflows
- Skip extensive documentation, specs, and task tracking for straightforward requests

**Superpowers Only When Requested**
- ONLY use superpowers skills when user explicitly says "use superpowers" in their prompt
- When "use superpowers" is mentioned, follow full superpowers workflow as designed

## This Rule Overrides

This rule takes precedence over the aggressive triggering in:
- `superpowers:using-superpowers` skill's "1% chance" requirement
- Any skill that says superpowers usage is "not negotiable" or "not optional"
- Default brainstorming/planning behavior

## Examples

**Simple Request (no superpowers):**
- "Add a new API endpoint for token validation"
- "Create a UI component for wallet connection"
- "Fix the bug in the authentication flow"

**Complex Request (use superpowers):**
- "Add a new API endpoint for token validation, use superpowers"
- "Plan a complex multi-signature workflow, use superpowers"

## Priority Order
1. **User instructions** (this rule) - highest priority
2. **Superpowers skills** - only when explicitly requested
3. **Default system behavior** - lowest priority