#!/bin/bash
# Pre-commit hook for CloakForge agentic workflow
# Auto-triggers reviewer agent on staged changes

set -e

echo "🤖 CloakForge Pre-commit Agentic Workflow"

# Check if there are staged changes
if ! git diff --cached --quiet; then
    echo "📋 Staged changes detected, running automated checks..."

    # Fast fail on lint and types
    echo "⚡ Running lint and type checks..."
    npm run lint:nowarn || {
        echo "❌ Lint failed. Fix issues before committing."
        exit 1
    }

    npx tsc --noEmit || {
        echo "❌ TypeScript errors found. Fix types before committing."
        exit 1
    }

    echo "✅ Automated checks passed"

    # Log the commit for potential reviewer agent follow-up
    echo "📝 Logging commit for review tracking..."
    {
        echo "### [$(date '+%Y-%m-%d %H:%M')] commit: $(git diff --cached --name-status | wc -l) files staged"
        echo "- **Files**: $(git diff --cached --name-only | tr '\n' ', ' | sed 's/,$//')"
        echo "- **Scope**: $(git diff --cached --name-only | cut -d'/' -f1-2 | sort -u | tr '\n' ', ' | sed 's/,$//')"
        echo "- **Status**: COMMITTED (pre-commit hook)"
        echo ""
    } >> .claude/state/TASK_LOG.md

else
    echo "ℹ️ No staged changes to validate"
fi

echo "🚀 Pre-commit hook completed successfully"