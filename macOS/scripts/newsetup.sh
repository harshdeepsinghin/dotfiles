#!/bin/bash

# ============================================================
# macOS Fresh Setup / Bootstrap Script
#
# Repository:
# https://github.com/harshdeepsinghin/dotfiles
# ============================================================

set -euo pipefail

# ============================================================
# CONFIGURATION
# ============================================================

DOTFILES_REPO="git@github.com:harshdeepsinghin/dotfiles.git"
DOTFILES_DIR="$HOME/gitrepos/dotfiles"

BREWFILE_PATH="$DOTFILES_DIR/Brewfile"
PACKAGE_URL="https://raw.githubusercontent.com/harshdeepsinghin/dotfiles/refs/heads/main/macOS/misc/packages.txt"

WALLPAPER_URL="https://harshdeepsingh.sirv.com/Wallpapers/"
WALLPAPER_DIR="$HOME/Pictures/wallpapers"

CONFIG_DIR="$HOME/.config"

# Leave empty to automatically detect:
# id_ed25519.pub -> id_rsa.pub -> id_ecdsa.pub
SSH_PUBLIC_KEY=""

# ============================================================
# HELPERS
# ============================================================

print_header() {
    printf '\n'
    printf '%s\n' "+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+"
    printf '%s\n' "!!!   $1   !!!"
    printf '%s\n' "+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+"
    printf '\n'
}

print_success() {
    printf '✓ %s\n' "$1"
}

print_warning() {
    printf '⚠ %s\n' "$1"
}

print_error() {
    printf '✗ %s\n' "$1" >&2
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

link_config() {
    local source="$1"
    local destination="$2"

    if [[ ! -e "$source" && ! -L "$source" ]]; then
        print_error "Source does not exist: $source"
        return 1
    fi

    mkdir -p "$(dirname "$destination")"

    rm -rf "$destination"
    ln -s "$source" "$destination"

    print_success "Linked $destination"
}

# ============================================================
# BASIC REQUIREMENTS
# ============================================================

print_header "STARTING MAC SETUP"

if [[ "$(uname)" != "Darwin" ]]; then
    print_error "This script is intended for macOS."
    exit 1
fi

print_success "macOS detected"

if ! command_exists curl; then
    print_error "curl is required."
    exit 1
fi

if ! command_exists git; then
    print_warning "Git is not currently available."
    print_warning "Install Xcode Command Line Tools first."

    xcode-select --install 2>/dev/null || true

    print_error "Run this script again after Command Line Tools are installed."
    exit 1
fi

# ============================================================
# DIRECTORIES
# ============================================================

print_header "CREATING DIRECTORIES"

mkdir -p "$HOME/gitrepos"
mkdir -p "$HOME/Pictures/wallpapers"
mkdir -p "$CONFIG_DIR"
mkdir -p "$HOME/.vim"

print_success "Directories created"

# ============================================================
# HOMEBREW
# ============================================================

print_header "SETTING UP HOMEBREW"

if ! command_exists brew; then
    print_warning "Homebrew is not installed."
    print_warning "Installing Homebrew now..."

    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    if [[ -x "/opt/homebrew/bin/brew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -x "/usr/local/bin/brew" ]]; then
        eval "$(/usr/local/bin/brew shellenv)"
    else
        print_error "Homebrew installation could not be located."
        exit 1
    fi
else
    print_success "Homebrew already installed"
fi

BREW_PREFIX="$(brew --prefix)"

print_success "Homebrew prefix: $BREW_PREFIX"

# ============================================================
# SSH / GITHUB
# ============================================================

print_header "VERIFYING SSH / GITHUB"

if [[ ! -d "$HOME/.ssh" ]]; then
    print_error "~/.ssh does not exist."
    print_error "Configure your GitHub SSH key first."
    exit 1
fi

chmod 700 "$HOME/.ssh"

# Automatically detect a public key if one was not specified.
if [[ -z "$SSH_PUBLIC_KEY" ]]; then
    for key in \
        "$HOME/.ssh/id_ed25519.pub" \
        "$HOME/.ssh/id_rsa.pub" \
        "$HOME/.ssh/id_ecdsa.pub"
    do
        if [[ -f "$key" ]]; then
            SSH_PUBLIC_KEY="$key"
            break
        fi
    done
fi

if [[ -z "$SSH_PUBLIC_KEY" ]]; then
    print_error "No SSH public key found."
    print_error "Expected one of:"
    print_error "  ~/.ssh/id_ed25519.pub"
    print_error "  ~/.ssh/id_rsa.pub"
    print_error "  ~/.ssh/id_ecdsa.pub"
    exit 1
fi

chmod 644 "$SSH_PUBLIC_KEY"

print_success "Using SSH signing key: $SSH_PUBLIC_KEY"

# GitHub normally exits with status 1 after successful authentication,
# so capture the message and inspect it instead of relying on exit status.
SSH_RESULT="$(ssh -T git@github.com 2>&1 || true)"

if ! printf '%s\n' "$SSH_RESULT" | grep -qi "successfully authenticated"; then
    print_error "GitHub SSH authentication failed."
    printf '%s\n' "$SSH_RESULT"
    print_error "Configure your GitHub SSH key and run this script again."
    exit 1
fi

print_success "GitHub SSH authentication works"

# ============================================================
# GIT CONFIGURATION
# ============================================================

print_header "CONFIGURING GIT"

git config --global user.name "Harshdeep Singh"
git config --global user.email "94488766+harshdeepsinghin@users.noreply.github.com"

git config --global gpg.format ssh
git config --global commit.gpgsign true
git config --global user.signingkey "$SSH_PUBLIC_KEY"

print_success "Git identity configured"
print_success "SSH commit signing configured"

# ============================================================
# CLONE / UPDATE DOTFILES
# ============================================================

print_header "SETTING UP DOTFILES"

if [[ -d "$DOTFILES_DIR/.git" ]]; then
    print_success "Dotfiles repository already exists"

    git -C "$DOTFILES_DIR" pull --ff-only
else
    print_warning "Cloning dotfiles repository..."

    git clone "$DOTFILES_REPO" "$DOTFILES_DIR"
fi

print_success "Dotfiles ready at:"
printf '  %s\n' "$DOTFILES_DIR"

# ============================================================
# HOMEBREW PACKAGES
# ============================================================

print_header "INSTALLING PACKAGES"

if [[ -f "$BREWFILE_PATH" ]]; then

    print_success "Brewfile found:"
    printf '  %s\n' "$BREWFILE_PATH"

    brew bundle \
        --file="$BREWFILE_PATH" \
        --no-upgrade

    print_success "Packages installed from Brewfile"

else

    print_warning "No Brewfile found."
    print_warning "Falling back to packages.txt"

    TEMP_PACKAGE_FILE="$(mktemp)"

    curl -fsSL "$PACKAGE_URL" -o "$TEMP_PACKAGE_FILE"

    while IFS= read -r package || [[ -n "$package" ]]; do

        # Remove Windows CR characters.
        package="${package//$'\r'/}"

        # Skip empty lines.
        [[ -z "$package" ]] && continue

        # Skip comments.
        [[ "$package" =~ ^[[:space:]]*# ]] && continue

        # Trim leading/trailing whitespace.
        package="$(printf '%s' "$package" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

        [[ -z "$package" ]] && continue

        printf '\nInstalling: %s\n' "$package"

        # Try formula first.
        if brew install "$package"; then
            print_success "$package installed as formula"
            continue
        fi

        # If formula failed, try cask.
        if brew install --cask "$package"; then
            print_success "$package installed as cask"
            continue
        fi

        print_error "Could not install package: $package"
        rm -f "$TEMP_PACKAGE_FILE"
        exit 1

    done < "$TEMP_PACKAGE_FILE"

    rm -f "$TEMP_PACKAGE_FILE"

    print_success "Packages installed from packages.txt"
fi

# ============================================================
# WALLPAPERS
# ============================================================

print_header "DOWNLOADING WALLPAPERS"

mkdir -p "$WALLPAPER_DIR"

WALLPAPER_LIST="$(mktemp)"

curl -fsSL "$WALLPAPER_URL" \
    | grep -oE 'https://harshdeepsingh\.sirv\.com/Wallpapers/[^"<>[:space:]]+' \
    | sort -u \
    > "$WALLPAPER_LIST" || true

if [[ -s "$WALLPAPER_LIST" ]]; then

    while IFS= read -r wallpaper_url; do

        filename="$(basename "${wallpaper_url%%\?*}")"

        [[ -z "$filename" ]] && continue

        print_success "Downloading $filename"

        curl -fL \
            --retry 3 \
            --retry-delay 2 \
            -o "$WALLPAPER_DIR/$filename" \
            "$wallpaper_url" || {
                print_warning "Failed to download $filename"
            }

    done < "$WALLPAPER_LIST"

else

    print_warning "Could not find wallpapers on the Sirv page."

fi

rm -f "$WALLPAPER_LIST"

print_success "Wallpaper step completed"

# ============================================================
# FISH
# ============================================================

print_header "CONFIGURING FISH"

if command_exists fish; then

    FISH_CONFIG_SOURCE="$DOTFILES_DIR/macOS/configs/fish"
    FISH_CONFIG_DEST="$CONFIG_DIR/fish"

    link_config \
        "$FISH_CONFIG_SOURCE" \
        "$FISH_CONFIG_DEST"

    fish -c "fish_add_path \"$BREW_PREFIX/bin\"" || true

    fish -c "fish_update_completions" || true

    print_success "Fish configured"

else

    print_warning "Fish is not installed; skipping Fish configuration."

fi

# ============================================================
# VIM
# ============================================================

print_header "CONFIGURING VIM"

VIM_SOURCE="$DOTFILES_DIR/macOS/configs/vim/vimrc"
VIM_DEST="$HOME/.vim/vimrc"

if [[ -f "$VIM_SOURCE" ]]; then

    link_config \
        "$VIM_SOURCE" \
        "$VIM_DEST"

else

    print_warning "Vim config not found:"
    printf '  %s\n' "$VIM_SOURCE"

fi

# ============================================================
# NEOVIM
# ============================================================

print_header "CONFIGURING NEOVIM"

NVIM_SOURCE="$DOTFILES_DIR/macOS/configs/nvim"
NVIM_DEST="$CONFIG_DIR/nvim"

if [[ -d "$NVIM_SOURCE" ]]; then

    link_config \
        "$NVIM_SOURCE" \
        "$NVIM_DEST"

else

    print_warning "Neovim config not found:"
    printf '  %s\n' "$NVIM_SOURCE"

fi

# ============================================================
# FASTFETCH
# ============================================================

print_header "CONFIGURING FASTFETCH"

FASTFETCH_SOURCE="$DOTFILES_DIR/macOS/configs/fastfetch"
FASTFETCH_DEST="$CONFIG_DIR/fastfetch"

if [[ -d "$FASTFETCH_SOURCE" ]]; then

    link_config \
        "$FASTFETCH_SOURCE" \
        "$FASTFETCH_DEST"

else

    print_warning "Fastfetch config not found:"
    printf '  %s\n' "$FASTFETCH_SOURCE"

fi

# ============================================================
# AEROSPACE
# ============================================================

print_header "CONFIGURING AEROSPACE"

AEROSPACE_SOURCE="$DOTFILES_DIR/macOS/configs/aerospace"
AEROSPACE_DEST="$CONFIG_DIR/aerospace"

if [[ -d "$AEROSPACE_SOURCE" ]]; then

    link_config \
        "$AEROSPACE_SOURCE" \
        "$AEROSPACE_DEST"

else

    print_warning "AeroSpace config not found:"
    printf '  %s\n' "$AEROSPACE_SOURCE"

fi

# ============================================================
# SYNCPLAY
# ============================================================

print_header "CONFIGURING SYNCPLAY"

SYNCPLAY_SOURCE="$DOTFILES_DIR/macOS/configs/syncplay.ini"
SYNCPLAY_DEST="$CONFIG_DIR/syncplay.ini"

if [[ -f "$SYNCPLAY_SOURCE" ]]; then

    link_config \
        "$SYNCPLAY_SOURCE" \
        "$SYNCPLAY_DEST"

else

    print_warning "Syncplay config not found:"
    printf '  %s\n' "$SYNCPLAY_SOURCE"

fi

# ============================================================
# RAYCAST
# ============================================================

print_header "CONFIGURING RAYCAST"

RAYCAST_SOURCE="$DOTFILES_DIR/macOS/configs/raycast"
RAYCAST_DEST="$CONFIG_DIR/raycast"

if [[ -d "$RAYCAST_SOURCE" ]]; then

    link_config \
        "$RAYCAST_SOURCE" \
        "$RAYCAST_DEST"

else

    print_warning "Raycast config not found:"
    printf '  %s\n' "$RAYCAST_SOURCE"

fi

# ============================================================
# GHOSTTY
# ============================================================

print_header "CONFIGURING GHOSTTY"

GHOSTTY_SOURCE="$DOTFILES_DIR/macOS/configs/ghostty"
GHOSTTY_DEST="$CONFIG_DIR/ghostty"

if [[ -d "$GHOSTTY_SOURCE" ]]; then

    link_config \
        "$GHOSTTY_SOURCE" \
        "$GHOSTTY_DEST"

else

    print_warning "Ghostty config not found:"
    printf '  %s\n' "$GHOSTTY_SOURCE"

fi


# ============================================================
# FINAL CHECKS
# ============================================================

print_header "RUNNING FINAL CHECKS"

printf 'Homebrew: '
if command_exists brew; then
    printf 'OK\n'
else
    printf 'FAILED\n'
fi

printf 'Git: '
if command_exists git; then
    printf 'OK\n'
else
    printf 'FAILED\n'
fi

printf 'Fish: '
if command_exists fish; then
    printf 'OK\n'
else
    printf 'NOT INSTALLED\n'
fi

printf 'Dotfiles: '
if [[ -d "$DOTFILES_DIR" ]]; then
    printf 'OK\n'
else
    printf 'FAILED\n'
fi

printf 'AeroSpace config: '
if [[ -L "$CONFIG_DIR/aerospace" ]]; then
    printf 'OK\n'
else
    printf 'NOT LINKED\n'
fi

printf 'Neovim config: '
if [[ -L "$CONFIG_DIR/nvim" ]]; then
    printf 'OK\n'
else
    printf 'NOT LINKED\n'
fi

printf 'Fish config: '
if [[ -L "$CONFIG_DIR/fish" ]]; then
    printf 'OK\n'
else
    printf 'NOT LINKED\n'
fi

printf 'Raycast config: '
if [[ -L "$CONFIG_DIR/raycast" ]]; then
    printf 'OK\n'
else
    printf 'NOT LINKED\n'
fi

# ============================================================
# DONE
# ============================================================

print_header "ALL SET!"

printf '%s\n' "Your Mac bootstrap is complete."
printf '\n'

printf '%s\n' "Dotfiles:"
printf '  %s\n' "$DOTFILES_DIR"
printf '\n'

printf '%s\n' "Homebrew:"
printf '  %s\n' "$BREW_PREFIX"
printf '\n'

printf '%s\n' "Wallpapers:"
printf '  %s\n' "$WALLPAPER_DIR"
printf '\n'

printf '%s\n' "Recommended next step:"
printf '%s\n' "Restart the Mac once."
printf '\n'

printf '%s\n' "Then verify:"
printf '%s\n' "  - Fish"
printf '%s\n' "  - AeroSpace"
printf '%s\n' "  - Neovim"
printf '%s\n' "  - Fastfetch"
printf '%s\n' "  - Raycast"
printf '%s\n' "  - Git SSH signing"
printf '\n'

printf '%s\n' "+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+"
printf '%s\n' "!!!   SETUP COMPLETE   !!!"
printf '%s\n' "+-+-+-+-+-+-+-+-+-+ +-+-+-+-+-+-+-+-+-+"
printf '\n' 