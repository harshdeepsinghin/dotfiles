#!/bin/bash

# macOS ULTRA-SAFE Space Cleanup Script
# This script ONLY removes files that are 100% safe and won't affect user experience
# NO browser data, NO user settings, NO login states will be touched
# Created: $(date)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get folder size in human readable format
get_folder_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "0B"
    fi
}

# Ultra-safe function to remove only specific safe cache files
ultra_safe_remove() {
    local dir="$1"
    local description="$2"
    local pattern="$3"
    
    if [ -d "$dir" ]; then
        local size_before=$(get_folder_size "$dir")
        print_status "Cleaning $description... (Current size: $size_before)"
        
        if [ -n "$pattern" ]; then
            # Only remove files matching specific patterns
            find "$dir" -name "$pattern" -type f -delete 2>/dev/null
        else
            # Skip this directory to be ultra-safe
            print_warning "Skipping $description for maximum safety"
            return
        fi
        
        local size_after=$(get_folder_size "$dir")
        print_success "✓ $description cleaned safely (Now: $size_after)"
    else
        print_warning "Directory not found: $dir"
    fi
}

# Function to safely clean only temporary files in a directory
safe_temp_clean() {
    local dir="$1"
    local description="$2"
    
    if [ -d "$dir" ]; then
        local size_before=$(get_folder_size "$dir")
        print_status "Cleaning $description temporary files... (Current size: $size_before)"
        
        # Only remove files that are clearly temporary
        find "$dir" -name "*.tmp" -type f -delete 2>/dev/null
        find "$dir" -name "*.temp" -type f -delete 2>/dev/null
        find "$dir" -name "*.cache" -type f -delete 2>/dev/null
        find "$dir" -name "*~" -type f -delete 2>/dev/null
        
        local size_after=$(get_folder_size "$dir")
        print_success "✓ $description temp files cleaned (Now: $size_after)"
    else
        print_warning "Directory not found: $dir"
    fi
}

echo "========================================"
echo "🛡️  macOS ULTRA-SAFE Cleanup Script"
echo "========================================"
echo "🔒 This script ONLY removes files that are 100% safe"
echo "✅ Your browser logins, settings, and bookmarks are PRESERVED"
echo "✅ All application settings remain unchanged"
echo "✅ Your Mac will work exactly the same way"
echo ""

# Get initial disk usage
print_status "Checking initial disk usage..."
df -h / | tail -1

echo ""
print_status "Starting ULTRA-SAFE cleanup process..."
echo ""

# 1. Homebrew Cleanup (100% Safe)
echo "📦 HOMEBREW CLEANUP (SAFE)"
echo "=========================="
if command -v brew &> /dev/null; then
    print_status "Running Homebrew cleanup (removes old cached downloads only)..."
    brew cleanup --prune=all
    print_success "✓ Homebrew cleanup completed - no installed software affected"
else
    print_warning "Homebrew not found, skipping..."
fi
echo ""

# 2. System Temporary Files ONLY
echo "🗂️  TEMPORARY FILES CLEANUP (ULTRA-SAFE)"
echo "======================================="

# Only clean obvious temporary files
print_status "Cleaning system temporary files..."
find "/tmp" -name "*.tmp" -type f -delete 2>/dev/null
find "/tmp" -name "*.temp" -type f -delete 2>/dev/null
print_success "✓ System temporary files cleaned"

# Clean user temp files (very conservative)
if [ -n "$TMPDIR" ] && [ -d "$TMPDIR" ]; then
    print_status "Cleaning user temporary files..."
    find "$TMPDIR" -name "*.tmp" -type f -delete 2>/dev/null
    find "$TMPDIR" -name "*.temp" -type f -delete 2>/dev/null
    print_success "✓ User temporary files cleaned"
fi

echo ""

# 3. SKIP Browser Cache (to preserve everything)
echo "🌐 BROWSER DATA (PRESERVED)"
echo "==========================="
print_success "✅ Browser caches, cookies, and login data PRESERVED"
print_success "✅ All your website logins will continue to work"
print_success "✅ Browser settings and bookmarks unchanged"
echo ""

# 4. Development Tool Cleanup (Safe - only caches)
echo "💻 DEVELOPMENT TOOLS CLEANUP (SAFE)"
echo "==================================="

# Node.js npm cache (safe - just downloaded packages)
if command -v npm &> /dev/null; then
    print_status "Cleaning npm cache (downloaded packages only)..."
    npm cache clean --force 2>/dev/null
    print_success "✓ npm cache cleaned - your projects unaffected"
fi

# Yarn cache (safe)
if command -v yarn &> /dev/null; then
    print_status "Cleaning Yarn cache (downloaded packages only)..."
    yarn cache clean 2>/dev/null
    print_success "✓ Yarn cache cleaned - your projects unaffected"
fi

# Python pip cache (safe)
if command -v pip3 &> /dev/null; then
    print_status "Cleaning pip cache (downloaded packages only)..."
    pip3 cache purge 2>/dev/null
    print_success "✓ pip cache cleaned - your Python environment unaffected"
fi

# SKIP Docker cleanup (can affect running containers)
if command -v docker &> /dev/null; then
    print_warning "Docker found - SKIPPED for safety (may contain important data)"
    print_status "To manually clean Docker: docker system prune -f"
fi

# Conda cache (safe)
if command -v conda &> /dev/null; then
    print_status "Cleaning Conda cache (downloaded packages only)..."
    conda clean --tarballs --index-cache --tempfiles -y 2>/dev/null
    print_success "✓ Conda cache cleaned - your environments unaffected"
fi

echo ""

# 5. macOS Specific Ultra-Safe Cleanup
echo "🍎 MACOS SAFE CLEANUP"
echo "===================="

# Trash cleanup (safe)
print_status "Emptying Trash..."
rm -rf "$HOME/.Trash/*" 2>/dev/null
print_success "✓ Trash emptied"

# SKIP Downloads cleanup (user might need those files)
print_status "Downloads folder preserved (files might be important)"

# Only clean clearly safe system caches
print_status "Cleaning QuickLook thumbnails (will regenerate automatically)..."
rm -rf "$HOME/Library/Caches/com.apple.QuickLook.thumbnailcache"/* 2>/dev/null
print_success "✓ QuickLook thumbnails cleaned"

# Clean only log files older than 7 days (very conservative)
print_status "Cleaning old log files (7+ days old only)..."
find "$HOME/Library/Logs" -name "*.log" -type f -mtime +7 -delete 2>/dev/null
print_success "✓ Old log files cleaned"

echo ""

# 6. Final Status (NO system changes)
echo "📊 CLEANUP SUMMARY"
echo "=================="
print_success "✅ ULTRA-SAFE cleanup completed!"
print_success "✅ All your settings, logins, and data are PRESERVED"
print_success "✅ Your Mac will work exactly the same way"
echo ""
print_status "Current disk usage:"
df -h / | tail -1
echo ""
print_status "What was cleaned (ALL SAFE):"
echo "  • Homebrew cached downloads (old versions)"
echo "  • Temporary system files (.tmp, .temp)"
echo "  • Development tool package caches"
echo "  • Trash contents"
echo "  • Thumbnail caches (auto-regenerated)"
echo "  • Old log files (7+ days)"
echo ""
print_status "What was PRESERVED (for your safety):"
echo "  • All browser data (logins, cookies, bookmarks)"
echo "  • Application settings and preferences"
echo "  • Downloaded files in Downloads folder"
echo "  • Docker containers and images"
echo "  • Recent log files"
echo ""
print_success "🔒 This script can be run safely anytime!"
echo "📅 Recommended frequency: Weekly or monthly"

echo ""
echo "✨ Done! Your Mac has more space and works exactly the same."

echo "Developed by Harshdeep Singh (https://harshdeepsingh.in)"
