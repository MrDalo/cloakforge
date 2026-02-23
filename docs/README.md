# CloakForge Documentation

**Quick reference for building with CloakForge**

## Core Documentation

| Doc                                        | Description                                               | Use When                           |
| ------------------------------------------ | --------------------------------------------------------- | ---------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)       | System design, tech stack, hybrid architecture, data flow | Understanding how CloakForge works |
| [DEVELOPMENT.md](./DEVELOPMENT.md)         | Setup, scripts, code standards, testing, git workflow     | Setting up environment, coding     |
| [TOOLING.md](./TOOLING.md)                 | 5-layer tool pattern, implementation guide                | Building new Solana tools          |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Error handling, common issues, debugging                  | Fixing bugs, handling errors       |

## Quick Links

**New to CloakForge?** → [Main README](../README.md)

**Setting up?** → [Quick Start](./DEVELOPMENT.md#quick-start)

**Building a tool?** → [5-Layer Pattern](./TOOLING.md#5-layer-architecture)

**Debugging?** → [Common Issues](./TROUBLESHOOTING.md#common-issues)

**Understanding codebase?** → [Project Structure](./ARCHITECTURE.md#project-structure)

**Code review?** → [Quality Gates](./DEVELOPMENT.md#quality-gates)

## Specialized Documentation

- [CONTENTFUL_WEBHOOK_SETUP.md](./CONTENTFUL_WEBHOOK_SETUP.md) — Contentful CMS webhook configuration

## External Resources

- [Solana Documentation](https://docs.solana.com)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🎓 Documentation Philosophy

CloakForge documentation follows our **five core principles**:

### 1. **KISS (Keep It Simple)**

- Clear, focused documents without over-engineering
- 4 core docs instead of 10+ overlapping files
- Direct answers without unnecessary complexity

### 2. **DRY (Don't Repeat Yourself)**

- Information lives in ONE authoritative place
- Cross-references instead of duplication
- Single source of truth for each concept

### 3. **Clear Purpose**

- Each document has ONE focused purpose
- Document titles clearly indicate content
- Organized by concern, not by format

### 4. **Developer-First**

- Practical examples from real project code
- Progressive disclosure (simple → detailed)
- Easy to navigate and search

### 5. **Maintainability**

- Living documents that evolve with the project
- Clear update dates and change logs
- Easy to update without breaking references

**Why this matters:** Before the Phase 1 refactor, developers were "lost in the repo" with 10+ overlapping docs. Now we have 4 focused guides that follow these principles.

### Why We Simplified

**Before (10+ docs):**

- Overwhelming for new developers
- Duplicate information
- Hard to maintain
- Unclear where to look

**After (4 focused docs):**

- ✅ Clear navigation
- ✅ No duplication
- ✅ Easy to maintain
- ✅ Focused content

---

## 📋 Documentation Update Policy

**We maintain exactly 4 documentation files. NEVER create new `.md` files.**

### When to Update Documentation

- Adding new features → Update relevant existing doc
- Changing architecture patterns → Update [ARCHITECTURE.md](./ARCHITECTURE.md)
- Fixing bugs that reveal unclear docs → Update [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Learning something not documented → Add to appropriate existing doc

### How to Update

1. **Identify the right doc:**
   - System design, architecture → [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Setup, workflows, standards → [DEVELOPMENT.md](./DEVELOPMENT.md)
   - Tool implementation → [TOOLING.md](./TOOLING.md)
   - Error handling, debugging → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

2. **Make changes:**
   - Add to existing sections or create new sections within the doc
   - Be clear and concise
   - Add code examples
   - Update table of contents if needed
   - Update "Last updated" date at top

3. **Commit with context:**
   ```bash
   git commit -m "docs: update error handling examples in TROUBLESHOOTING.md"
   ```

**Why?** Maintaining 4 focused docs is easier than managing 10+ scattered files. This follows our KISS and DRY principles.

### Documentation Principles

1. **Document behavior, not implementation** - Explain WHY and WHEN, not just HOW
2. **Keep it current** - Update docs with code changes
3. **Show examples** - Real code examples over theory
4. **Be concise** - Respect developer time
5. **Link liberally** - Connect related information

---

## Next Steps

1. **Read [ARCHITECTURE.md](./ARCHITECTURE.md)** to understand the system
2. **Follow [DEVELOPMENT.md](./DEVELOPMENT.md)** to set up your environment
3. **Use [TOOLING.md](./TOOLING.md)** when building features
4. **Reference [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** when stuck

**Remember: Update existing docs, never create new ones.** ✨

**Happy building! 🔨**
