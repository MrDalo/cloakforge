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

else
    echo "ℹ️ No staged changes to validate"
fi

echo "🚀 Pre-commit hook completed successfully"