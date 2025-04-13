#!/bin/bash

TARGET="$HOME/.config/fish/config.fish"
URL="https://raw.githubusercontent.com/harshdeepsinghin/dotfiles/refs/heads/main/macOS/configs/fish/config.fish"

# Create directory if it doesn't exist
mkdir -p "$(dirname "$TARGET")"

# Remove old config if it exists
if [[ -f "$TARGET" ]]; then
    echo "Removing existing config at $TARGET"
    rm "$TARGET"
fi

# Download new config
echo "Downloading new config from $URL"
curl -fsSL "$URL" -o "$TARGET"

fish -c "fish_add_path opt/homebrew/bin/"
fish -c "fish_update_completions"

# Success message
if [[ -f "$TARGET" ]]; then
    echo "✅ config.fish successfully downloaded to $TARGET"
else
    echo "❌ Failed to download config.fish"
    exit 1
fi
