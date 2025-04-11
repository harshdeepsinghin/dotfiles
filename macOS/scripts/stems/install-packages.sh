#!/bin/bash

# Path to the file containing package names
PACKAGE_FILE="packages.txt"

# Check if the file exists
if [[ ! -f "$PACKAGE_FILE" ]]; then
    echo "Package list file not found!"
    exit 1
fi

# Read the file and install packages using brew
while read -r package; do
    # Skip empty lines and comments
    [[ -z "$package" || "$package" =~ ^# ]] && continue

    echo "Installing $package..."
    brew install "$package"
done < "$PACKAGE_FILE"