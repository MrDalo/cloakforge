# 📚 CloakForge Documentation Hub

> **Complete documentation for building with CloakForge**

## 🎯 Essential Documentation

### Core Guides (Start Here!)

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design, tech stack, and patterns
   - Vision and goals
   - Tech stack overview
   - Provider architecture
   - Project structure
   - Design patterns

2. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Setup, workflows, and code standards
   - Quick start guide
   - Development workflow
   - Code quality standards
   - Testing strategies
   - Git workflow

3. **[TOOLING.md](./TOOLING.md)** - Tool implementation guide
   - Architecture patterns
   - Layer-by-layer implementation
   - Tool configuration system
   - Reference implementations

4. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Error handling and debugging
   - Error handling system
   - Common issues and solutions
   - Debugging strategies
   - Logging best practices

---

## 📖 Quick Links

### Getting Started

- **New to CloakForge?** → Start with [README](../README.md)
- **Setting up environment?** → See [DEVELOPMENT.md](./DEVELOPMENT.md#quick-start)
- **Building a new tool?** → Follow [TOOLING.md](./TOOLING.md)

### Common Tasks

- **Understanding the codebase** → [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Fixing bugs** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Code review checklist** → [DEVELOPMENT.md](./DEVELOPMENT.md#quality-gates)
- **Adding components** → [ARCHITECTURE.md](./ARCHITECTURE.md#design-patterns)

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
