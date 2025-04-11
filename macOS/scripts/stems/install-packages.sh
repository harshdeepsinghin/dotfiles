#!/bin/bash

# URL to the package list
PACKAGE_URL="https://raw.githubusercontent.com/harshdeepsinghin/dotfiles/refs/heads/main/macOS/misc/stems/packages.txt"

# Fetch and install packages using brew
curl -fsSL "$PACKAGE_URL" | while read -r package; do
    # Skip empty lines and comments
    [[ -z "$package" || "$package" =~ ^# ]] && continue

    echo "Installing $package..."
    brew install "$package"
done
