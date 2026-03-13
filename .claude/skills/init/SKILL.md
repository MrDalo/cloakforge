---
name: init
description: 'Onboard to CloakForge by scanning the project structure and presenting a concise orientation: stack, architecture, key directories, available tools, agents, skills, and conventions. Use when: (1) starting a new session and needing project context quickly, (2) a new developer or agent needs to understand the codebase, (3) unsure where things live or what patterns to follow, (4) verifying the project is correctly set up before starting work, (5) getting a summary of available slash commands and subagents. Usage: /init'
disable-model-invocation: true
allowed-tools:
  - Read
  - Bash(ls *)
  - Bash(cat *)
  - Bash(wc *)
  - Grep
  - Glob
---

# /init

## Gather Context

```bash
cat package.json | head -5
echo "Node: $(node -v), npm: $(npm -v)"
ls src/app/tools/
ls src/components/common/
ls src/hooks/solana/
ls src/app/api/solana/
ls src/lib/solana/server-side/
ls .claude/agents/
ls .claude/skills/
```

## Present Overview

1. **What**: Privacy-first Solana token management dApp. No data collection.
2. **Stack**: Next.js 16, React 19, TypeScript 5+, Tailwind 4 + shadcn/ui, @solana/web3.js + @solana/kit
3. **Architecture**: Hybrid — client signs transactions, server prepares/validates via private RPC
4. **5-Layer Pattern**: Page → Form → Hook → API Route → Server Utility
5. **Key Directories**: List tools, common components, hooks, API routes, server utilities found
6. **Commands**: `npm run dev` (port 3001), `npm run build`, `npm run lint:nowarn`, `npx tsc --noEmit`, `npm test`
7. **Slash Commands**: List action skills from `.claude/skills/`
8. **Agents**: List from `.claude/agents/`
9. **Conventions**: barrel imports from `@/lib/solana`, AppError/SolanaError, `getLogger()`, no `any`, no memo, check common/ first
10. **Docs**: `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/TOOLING.md`, `docs/TROUBLESHOOTING.md`

End with: "Ready to build. What would you like to work on?"
