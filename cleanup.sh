#!/bin/bash
# Comprehensive Empty File and Folder Cleanup Script

echo "🔍 Starting comprehensive workspace cleanup..."
echo "=============================================="

# Initialize counters
EMPTY_FILES_REMOVED=0
EMPTY_FOLDERS_REMOVED=0
EFFECTIVELY_EMPTY_REMOVED=0
DEV_ARTIFACTS_REMOVED=0

# Function to safely remove a file
safe_remove_file() {
    local file="$1"
    local reason="$2"
    
    if [[ -f "$file" ]]; then
        echo "🗑️  Removing file: $file ($reason)"
        rm "$file"
        return 0
    fi
    return 1
}

# Function to safely remove a directory
safe_remove_dir() {
    local dir="$1"
    local reason="$2"
    
    if [[ -d "$dir" ]]; then
        echo "📂 Removing directory: $dir ($reason)"
        rmdir "$dir" 2>/dev/null
        return $?
    fi
    return 1
}

echo "1️⃣  Finding completely empty files (0 bytes)..."
echo "------------------------------------------------"

# Find truly empty files
while IFS= read -r -d '' file; do
    # Skip protected files and directories
    case "$file" in
        */.gitkeep|*/.gitignore|*/.env*|*/package-lock.json|*/yarn.lock|*/pnpm-lock.yaml)
            continue
            ;;
        */tsconfig.tsbuildinfo|*/.next/*|*/node_modules/*|*/.git/*|*/.qodo/*|*/.vscode/*|*/coverage/*|*/dist/*)
            continue
            ;;
    esac
    
    if safe_remove_file "$file" "0 bytes"; then
        ((EMPTY_FILES_REMOVED++))
    fi
    
done < <(find . -type f -size 0c \
    -not -path "./.next/*" \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" \
    -not -path "./.qodo/*" \
    -not -path "./.vscode/*" \
    -not -path "./coverage/*" \
    -not -path "./dist/*" \
    -print0 2>/dev/null)

echo ""
echo "2️⃣  Finding development artifacts..."
echo "-----------------------------------"

# Remove development artifacts
artifacts=(
    "tsconfig.tsbuildinfo"
    "clean_mcp_output.py" 
    "cleaned_output.md"
    ".DS_Store"
    "*.log"
    "*.tmp"
    "*.temp"
    "*~"
    "*.swp"
    "*.swo"
    "*.bak"
    "*.orig"
    "Thumbs.db"
)

for pattern in "${artifacts[@]}"; do
    find . -name "$pattern" -type f \
        -not -path "./.git/*" \
        -not -path "./node_modules/*" \
        -not -path "./.next/*" 2>/dev/null | while read -r file; do
        
        if [[ -f "$file" ]]; then
            if safe_remove_file "$file" "development artifact"; then
                ((DEV_ARTIFACTS_REMOVED++))
            fi
        fi
    done
done

echo ""
echo "3️⃣  Finding empty directories..."
echo "-------------------------------"

# Remove empty directories (multiple passes to handle nested empty dirs)
for pass in {1..5}; do
    echo "   Pass $pass/5..."
    
    find . -type d -empty \
        -not -path "./.git/*" \
        -not -path "./node_modules/*" \
        -not -path "./.next/*" \
        -not -path "./.qodo/*" \
        -not -path "./.vscode/*" \
        -not -path "./coverage/*" \
        -not -path "./dist/*" \
        -not -path "./public" \
        -not -path "./src" \
        -not -path "./docs" \
        -not -path "./scripts" \
        -not -path "." 2>/dev/null | while read -r dir; do
        
        # Skip if it's a protected directory
        case "$dir" in
            "./public"|"./src"|"./docs"|"./scripts"|"./app"|"./components"|"./lib"|"./hooks"|"./types")
                continue
                ;;
            */.*|*/.git|*/.vscode|*/.next|*/.qodo|*/node_modules|*/coverage|*/dist)
                continue
                ;;
        esac
        
        if [[ -d "$dir" ]]; then
            if safe_remove_dir "$dir" "empty directory"; then
                ((EMPTY_FOLDERS_REMOVED++))
            fi
        fi
    done
done

echo ""
echo "4️⃣  Finding duplicate or temporary files..."
echo "------------------------------------------"

# Find common duplicate patterns
duplicates=(
    "*.backup"
    "*.copy"
    "*-copy.*"
    "*Copy.*" 
    "*.duplicate"
    "*-duplicate.*"
    "*.old"
    "*-old.*"
    "*.new"
    "*-new.*"
    "untitled*"
    "Untitled*"
)

for pattern in "${duplicates[@]}"; do
    find . -name "$pattern" -type f \
        -not -path "./.git/*" \
        -not -path "./node_modules/*" \
        -not -path "./.next/*" 2>/dev/null | while read -r file; do
        
        if [[ -f "$file" ]]; then
            echo "🔄 Found potential duplicate: $file"
            read -p "Remove this file? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if safe_remove_file "$file" "duplicate/temporary file"; then
                    ((DEV_ARTIFACTS_REMOVED++))
                fi
            fi
        fi
    done
done

echo ""
echo "6️⃣5️⃣  Finding large empty or nearly empty files..."
echo "-----------------------------------------------"

# Find files that are suspiciously small for their type
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss" -o -name "*.json" \) \
    -size -10c \
    -not -path "./.next/*" \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" 2>/dev/null | while read -r file; do
    
    if [[ -f "$file" ]]; then
        size=$(wc -c < "$file" 2>/dev/null || echo "0")
        lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        
        echo "📋 Small file found: $file ($lines lines, $size bytes)"
        echo "   Content:"
        head -3 "$file" 2>/dev/null | sed 's/^/   > /' || echo "   > (binary or unreadable)"
        
        if [[ $size -le 5 ]]; then
            if safe_remove_file "$file" "extremely small file"; then
                ((EFFECTIVELY_EMPTY_REMOVED++))
            fi
        fi
    fi
done

echo ""
echo "6️⃣  Final cleanup - removing any remaining empty directories..."
echo "-------------------------------------------------------------"

# Final pass for empty directories
find . -type d -empty \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./.qodo/*" \
    -not -path "./.vscode/*" \
    -not -path "./coverage/*" \
    -not -path "./dist/*" \
    -not -path "./public" \
    -not -path "./src" \
    -not -path "./docs" \
    -not -path "./scripts" \
    -not -path "." 2>/dev/null | while read -r dir; do
    
    if [[ -d "$dir" ]]; then
        if safe_remove_dir "$dir" "empty directory (final pass)"; then
            ((EMPTY_FOLDERS_REMOVED++))
        fi
    fi
done

echo ""
echo "📊 CLEANUP SUMMARY"
echo "=================="
echo "✅ Empty files removed: $EMPTY_FILES_REMOVED"
echo "✅ Effectively empty files removed: $EFFECTIVELY_EMPTY_REMOVED"
echo "✅ Development artifacts removed: $DEV_ARTIFACTS_REMOVED"
echo "✅ Empty directories removed: $EMPTY_FOLDERS_REMOVED"
echo ""

TOTAL_REMOVED=$((EMPTY_FILES_REMOVED + EFFECTIVELY_EMPTY_REMOVED + DEV_ARTIFACTS_REMOVED + EMPTY_FOLDERS_REMOVED))

if [[ $TOTAL_REMOVED -gt 0 ]]; then
    echo "🎉 Workspace cleaned! Removed $TOTAL_REMOVED items total."
    echo ""
    echo "📋 Verification steps:"
    echo "1. Check if build still works:"
    echo "   npm run build"
    echo ""
    echo "2. Check TypeScript compilation:"
    echo "   npm run type-check"
    echo ""
    echo "3. Run linting:"
    echo "   npm run lint:nowarn"
    echo ""
    echo "4. If everything looks good, commit:"
    echo "   git add -A"
    echo "   git commit -m \"🧹 Remove empty files, folders, and artifacts\""
else
    echo "✨ Workspace is already clean!"
fi

echo ""
echo "🔍 Final workspace overview:"
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "./.next/*" \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" | wc -l | xargs echo "   TypeScript/JavaScript files:"

find . -type d \
    -not -path "./.next/*" \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" | wc -l | xargs echo "   Directories:"

echo ""
echo "✅ Comprehensive cleanup completed!"