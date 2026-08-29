#!/usr/bin/env bash
# install.sh — LightningOCR one-shot installer
#
# What this script does:
#   1. Validates prerequisites (Python ≥3.10, Swift CLI tools)
#   2. Creates a Python venv inside daemon/
#   3. Installs Python dependencies (pix2text, opencv, etc.)
#   4. Compiles the Swift native helpers (vision-ocr, clipboard-image)
#   5. Copies compiled binaries to native/bin/ for dev convenience
#   6. Creates the logs/ directory
#   7. Installs and loads the launchd LaunchAgent
#   8. Runs the model warm-up script (triggers first-time model download)
#   9. Installs Raycast extension npm dependencies
#
# Run from the lightOCR directory:
#   chmod +x scripts/install.sh
#   ./scripts/install.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
BLU='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLU}▶${NC}  $*"; }
ok()    { echo -e "${GRN}✓${NC}  $*"; }
warn()  { echo -e "${YLW}⚠${NC}  $*"; }
die()   { echo -e "${RED}✗${NC}  $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Resolve install directory (absolute path to lightOCR/)
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DAEMON_DIR="$INSTALL_DIR/daemon"
NATIVE_DIR="$INSTALL_DIR/native"
RAYCAST_DIR="$INSTALL_DIR/raycast"
SCRIPTS_DIR="$INSTALL_DIR/scripts"
LOGS_DIR="$INSTALL_DIR/logs"
VENV="$DAEMON_DIR/.venv"
LAUNCHD_LABEL="com.lightningocr.daemon"
PLIST_SRC="$SCRIPTS_DIR/com.lightningocr.daemon.plist"
PLIST_DST="$HOME/Library/LaunchAgents/$LAUNCHD_LABEL.plist"

echo ""
echo -e "${BLU}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLU}  LightningOCR — Installer${NC}"
echo -e "${BLU}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
info "Install directory: $INSTALL_DIR"
echo ""

# ---------------------------------------------------------------------------
# 1. Prerequisites
# ---------------------------------------------------------------------------
info "Checking prerequisites…"

# Python
PYTHON=""
for py in python3.12 python3.11 python3.10 python3; do
    if command -v "$py" &>/dev/null; then
        VER="$("$py" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
        MAJOR="${VER%%.*}"
        MINOR="${VER##*.}"
        if [ "$MAJOR" -ge 3 ] && [ "$MINOR" -ge 10 ]; then
            PYTHON="$py"
            break
        fi
    fi
done

[ -n "$PYTHON" ] || die "Python ≥3.10 is required. Install it from https://python.org"
ok "Python: $($PYTHON --version)"

# Swift
command -v swift &>/dev/null || die "Swift CLI tools not found. Install Xcode or run: xcode-select --install"
ok "Swift: $(swift --version 2>&1 | head -1)"

# Node (for Raycast extension)
if command -v node &>/dev/null; then
    ok "Node: $(node --version)"
    HAS_NODE=1
else
    warn "Node.js not found — Raycast extension npm install will be skipped."
    HAS_NODE=0
fi

echo ""

# ---------------------------------------------------------------------------
# 2. Python venv
# ---------------------------------------------------------------------------
info "Setting up Python virtual environment…"
if [ ! -d "$VENV" ]; then
    "$PYTHON" -m venv "$VENV"
    ok "Created venv at $VENV"
else
    ok "Venv already exists at $VENV"
fi

VENV_PY="$VENV/bin/python"
VENV_PIP="$VENV/bin/pip"

"$VENV_PIP" install --upgrade pip --quiet
echo ""

# ---------------------------------------------------------------------------
# 3. Python dependencies
# ---------------------------------------------------------------------------
info "Installing Python dependencies (this may take a few minutes)…"
"$VENV_PIP" install -r "$DAEMON_DIR/requirements.txt"
ok "Python dependencies installed."
echo ""

# ---------------------------------------------------------------------------
# 4. Compile Swift helpers
# ---------------------------------------------------------------------------
info "Compiling Swift native helpers…"
(
    cd "$NATIVE_DIR"
    swift build -c release --quiet
)
ok "Swift helpers compiled."

# Copy binaries to native/bin/ and raycast/assets/bin/
mkdir -p "$NATIVE_DIR/bin" "$RAYCAST_DIR/assets/bin"
cp "$NATIVE_DIR/.build/release/vision-ocr"     "$NATIVE_DIR/bin/vision-ocr"
cp "$NATIVE_DIR/.build/release/clipboard-image" "$NATIVE_DIR/bin/clipboard-image"
cp "$NATIVE_DIR/.build/release/vision-ocr"     "$RAYCAST_DIR/assets/bin/vision-ocr"
cp "$NATIVE_DIR/.build/release/clipboard-image" "$RAYCAST_DIR/assets/bin/clipboard-image"
chmod +x "$NATIVE_DIR/bin/vision-ocr" "$NATIVE_DIR/bin/clipboard-image" "$RAYCAST_DIR/assets/bin/vision-ocr" "$RAYCAST_DIR/assets/bin/clipboard-image"
ok "Binaries copied to native/bin/ and raycast/assets/bin/"
echo ""

# ---------------------------------------------------------------------------
# 5. Create logs directory
# ---------------------------------------------------------------------------
mkdir -p "$LOGS_DIR"
ok "Logs directory: $LOGS_DIR"

# ---------------------------------------------------------------------------
# 6. Install launchd LaunchAgent
# ---------------------------------------------------------------------------
info "Installing launchd LaunchAgent…"

# Substitute __INSTALL_DIR__ placeholder.
mkdir -p "$HOME/Library/LaunchAgents"
sed "s|__INSTALL_DIR__|$INSTALL_DIR|g" "$PLIST_SRC" > "$PLIST_DST"
ok "Plist installed: $PLIST_DST"

# Unload any existing instance, then load.
launchctl unload "$PLIST_DST" 2>/dev/null || true
launchctl load -w "$PLIST_DST"
ok "LaunchAgent loaded: $LAUNCHD_LABEL"
echo ""

# ---------------------------------------------------------------------------
# 7. Wait briefly, then run warm-up
# ---------------------------------------------------------------------------
info "Waiting 2s for daemon to start…"
sleep 2

info "Running model warm-up (may download Pix2Text models — ~1–2 GB on first run)…"
warn "This step may take several minutes on the first install."
echo ""

"$VENV_PY" "$SCRIPTS_DIR/warmup.py" || warn "Warm-up encountered errors — check logs at $LOGS_DIR"

echo ""

# ---------------------------------------------------------------------------
# 8. Raycast extension npm install
# ---------------------------------------------------------------------------
if [ "$HAS_NODE" -eq 1 ] && [ -d "$RAYCAST_DIR" ]; then
    info "Installing Raycast extension npm dependencies…"
    (cd "$RAYCAST_DIR" && npm install --silent)
    ok "npm dependencies installed."
    echo ""
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo -e "${GRN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GRN}  LightningOCR installed successfully!${NC}"
echo -e "${GRN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Daemon socket:  /tmp/lightningocr.sock"
echo "  Daemon logs:    $LOGS_DIR/daemon.stdout.log"
echo "  Daemon status:  launchctl list $LAUNCHD_LABEL"
echo ""
echo "  To stop the daemon:   launchctl unload $PLIST_DST"
echo "  To start the daemon:  launchctl load -w $PLIST_DST"
echo ""
echo "  Next step:"
if [ "$HAS_NODE" -eq 1 ]; then
    echo "    cd raycast && npm run dev"
    echo "    Then add the extension in Raycast (⌘⇧X → Add Script Directory)."
else
    echo "    Install Node.js, then: cd raycast && npm install && npm run dev"
fi
echo ""
