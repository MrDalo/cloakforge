---
name: orchestrate
description: 'Advanced multi-agent orchestration for complex features. Usage: /orchestrate <feature description>'
disable-model-invocation: false
argument-hint: 'complex feature description'
allowed-tools:
  - Agent
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# /orchestrate

Coordinate complex multi-agent workflows using the orchestrator agent for full-stack features.

## When to Use

- **Complex features** spanning 3+ layers (UI + API + server + schemas + tests)
- **Multi-tool implementations** requiring coordination across tools
- **Architecture changes** needing docs updates
- **Large refactors** affecting multiple components

## Process

1. **Delegate to orchestrator agent** with full feature requirements
2. **Monitor progress** via TASK_LOG.md updates
3. **Coordinate quality gates** (reviewer after each phase)
4. **Update project state** when feature completes

## Usage Example

```bash
/orchestrate "Add batch SPL token transfer tool with CSV upload, transaction batching, and progress tracking"
```

## Orchestrator Agent Responsibilities

- ✅ **Task decomposition** into agent-specific work units
- ✅ **Dependency management** (schema → API → hook → UI)
- ✅ **Parallel execution** coordination (frontend + backend when independent)
- ✅ **Quality gates** integration (reviewer + tester agents)
- ✅ **State persistence** (PROJECT_STATE.md updates)
- ✅ **Memory management** (read summaries, not transcripts)

## Agent Team Workflow

```
Phase 1 (Parallel):
├── backend: schemas + API routes
└── frontend: UI components (independent)

Phase 2 (Sequential):
├── frontend: hooks using new API
├── tester: comprehensive test suite
└── reviewer: security + correctness audit

Phase 3 (Final):
├── docs: architecture updates
└── orchestrator: PROJECT_STATE.md update
```

## Cost Optimization

- **Structured outputs** — all agents write to TASK_LOG.md
- **Negative constraints** — prevent exploration outside scope
- **Minimal context** — 1-3 files max per agent task
- **Fail fast** — lint/typecheck between phases