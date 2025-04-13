# macOS Dotfiles Configuration

This repository contains my personalized macOS development environment setup, including configuration files, scripts, and utilities to quickly restore my workflow on a new machine (if needed).

## Features

### Terminal & Shell
- **Fish shell** with custom functions and aliases
- **iTerm2 profile** with customized colors and settings
- Useful shell functions for:
  - YouTube music/video playback (`ytm`, `ytuhd`, `ytfhd`)
  - Amazon searches (`amazon`)
  - Quick script creation (`bpsh`, `bppy`)
  - Calculator (`calc`)
  - And many more (ps: will create dedicated repo soon for my personalized functions...)

### Development Environment
- Git configured with SSH signing
- Custom paths for development folders


## Installation

### Prerequisites

1. Homebrew installed:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. SSH keys set up in `~/.ssh/` (id_rsa and id_rsa.pub)

### Quick Setup

Run the script:
   ```bash
   bash <(curl -fsSL https://raw.githubusercontent.com/harshdeepsinghin/dotfiles/refs/heads/main/macOS/scripts/setup.sh)
   ```

This will:
- Install all required packages from packages.txt
- Configure Git with your SSH keys
- Set up configurations and download wallpapers
- Symlink all configuration files to their proper locations

## Manual Setup (Optional)

If you prefer to set up components individually:

### 1. Install Packages

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/harshdeepsinghin/dotfiles/refs/heads/main/macOS/scripts/stems/install-packages.sh)
```

### 2. Configure Git

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/harshdeepsinghin/dotfiles/refs/heads/main/macOS/scripts/stems/git-setup.sh) ok
```

### 3. Set Up Configurations

The main `setup.sh` script handles:
- Creating necessary directories
- Downloading wallpapers
- Setting up Fish shell configuration
- Configuring Zed editor
- Creating symlinks for all config files

## Custom Functions

Some notable custom Fish shell functions:

- `gitpush "commit message"` - Stages, commits with message, and pushes
- `whatis "query"` - Searches multiple sources for information
- `wavdl "song name"` - Downloads audio as WAV from YouTube
- `helpbash` - Searches for Bash how-to guides
- `anonyt "query"` - Anonymous YouTube search in Brave
- `clipgpt` - Opens ChatGPT with clipboard content

## Wallpapers

The setup script automatically downloads a curated wallpaper collection to `~/Pictures/wallpapers/`.

## Maintenance

To update your dotfiles:

1. Make changes to the files in this repository
2. Commit and push the changes
3. The symlinks will ensure your live environment stays in sync

## Notes

- The `EyeSpace.app` is a custom Automator application (location: `misc/EyeSpace.app`)
- Some paths are hardcoded to `~/gitrepos/` - adjust if you use a different location
- The setup assumes a macOS environment with Homebrew available

## License

This setup is free to use and modify. If you find it useful, consider starring the repository!

Dhanyavaad!