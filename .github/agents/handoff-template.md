---
name: handoff-template
description: "Template for agent-to-agent handoff context"
user-invokable: false
disable-model-invocation: true
---

# Handoff Template

Use this format when handing off context between agents:

```markdown
## Handoff: [Source Agent] → [Target Agent]

### Task
[What needs to be done]

### Context
- **Files modified:** [list]
- **Files to modify:** [list]
- **Decisions made:** [key decisions]
- **Open questions:** [unresolved items]

### Constraints
- [Any constraints or requirements]

### Acceptance Criteria
- [ ] [Specific, verifiable criteria]
```
