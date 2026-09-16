#!/usr/bin/env bash

set -e

# ============================================================
# Cloudflare MySQL Training - Unix Installer
# Supports:
#   - Linux x86_64
#   - Linux ARM64
#   - macOS Intel
#   - macOS Apple Silicon
#   - WSL
# ============================================================

CLOUDFLARE_HOSTNAME="boi-tfm-db.kttechsolution.com"

INSTALL_DIR="$HOME/.mysql-training/bin"
CLOUDFLARED="$INSTALL_DIR/cloudflared"

DEFAULT_PORT=3306

# ============================================================
# Helpers
# ============================================================

info() {
    echo "[INFO] $1"
}

ok() {
    echo "[OK] $1"
}

warn() {
    echo "[WARN] $1"
}

error() {
    echo "[ERROR] $1"
}

# ============================================================
# Detect OS
# ============================================================

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
    Linux)
        OS_NAME="linux"
        ;;
    Darwin)
        OS_NAME="darwin"
        ;;
    *)
        error "Unsupported OS: $OS"
        exit 1
        ;;
esac

# ============================================================
# Detect Architecture
# ============================================================

case "$ARCH" in
    x86_64|amd64)
        ARCH_NAME="amd64"
        ;;
    arm64|aarch64)
        ARCH_NAME="arm64"
        ;;
    armv7l)
        ARCH_NAME="arm"
        ;;
    *)
        error "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

echo
echo "=============================================="
echo " Cloudflare MySQL Training"
echo "=============================================="
echo
echo "OS           : $OS_NAME"
echo "Architecture : $ARCH_NAME"
echo "Hostname     : $CLOUDFLARE_HOSTNAME"
echo

# ============================================================
# Check dependencies
# ============================================================

if ! command -v curl >/dev/null 2>&1; then
    error "curl is required."
    exit 1
fi

# ============================================================
# Download URL
# ============================================================

if [ "$OS_NAME" = "darwin" ]; then

    case "$ARCH_NAME" in
        amd64)
            DOWNLOAD_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz"
            ;;
        arm64)
            DOWNLOAD_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz"
            ;;
        *)
            error "Unsupported macOS architecture."
            exit 1
            ;;
    esac

elif [ "$OS_NAME" = "linux" ]; then

    case "$ARCH_NAME" in
        amd64)
            DOWNLOAD_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
            ;;
        arm64)
            DOWNLOAD_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
            ;;
        arm)
            DOWNLOAD_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm"
            ;;
        *)
            error "Unsupported Linux architecture."
            exit 1
            ;;
    esac

fi

# ============================================================
# Install cloudflared
# ============================================================

mkdir -p "$INSTALL_DIR"

if [ -x "$CLOUDFLARED" ]; then

    ok "cloudflared already installed."

else

    info "Downloading cloudflared..."

    TEMP_DIR="$(mktemp -d)"

    trap 'rm -rf "$TEMP_DIR"' EXIT

    if [ "$OS_NAME" = "darwin" ]; then

        curl -fL --progress-bar \
            "$DOWNLOAD_URL" \
            -o "$TEMP_DIR/cloudflared.tgz"

        tar -xzf "$TEMP_DIR/cloudflared.tgz" \
            -C "$TEMP_DIR"

        cp "$TEMP_DIR/cloudflared" "$CLOUDFLARED"

    else

        curl -fL --progress-bar \
            "$DOWNLOAD_URL" \
            -o "$CLOUDFLARED"

    fi

    chmod +x "$CLOUDFLARED"

    ok "cloudflared installed."
fi

# ============================================================
# Verify
# ============================================================

echo

"$CLOUDFLARED" --version

echo

# ============================================================
# Select Port
# ============================================================

read -r -p "Local MySQL port [$DEFAULT_PORT]: " PORT

PORT="${PORT:-$DEFAULT_PORT}"

if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    error "Invalid port."
    exit 1
fi

# ============================================================
# Check Port
# ============================================================

check_port() {

    local PORT_TO_CHECK="$1"

    # Linux
    if command -v ss >/dev/null 2>&1; then
        if ss -lnt 2>/dev/null \
            | awk '{print $4}' \
            | grep -qE ":${PORT_TO_CHECK}$"; then
            return 0
        fi
    fi

    # macOS
    if command -v lsof >/dev/null 2>&1; then
        if lsof -nP \
            -iTCP:"$PORT_TO_CHECK" \
            -sTCP:LISTEN >/dev/null 2>&1; then
            return 0
        fi
    fi

    return 1
}

while check_port "$PORT"; do

    warn "Port $PORT is already in use."

    PORT=$((PORT + 1))

    info "Trying port $PORT..."

done

# ============================================================
# Start Cloudflare Access TCP
# ============================================================

echo
echo "=============================================="
echo " MySQL Connection"
echo "=============================================="
echo
echo "Remote:"
echo "  $CLOUDFLARE_HOSTNAME"
echo
echo "Local:"
echo "  Host : 127.0.0.1"
echo "  Port : $PORT"
echo
echo "Use this in MySQL / Node-RED:"
echo
echo "  Host = 127.0.0.1"
echo "  Port = $PORT"
echo
echo "Starting Cloudflare Access..."
echo
echo "Press Ctrl+C to disconnect."
echo
echo "=============================================="
echo

"$CLOUDFLARED" access tcp \
    --hostname "$CLOUDFLARE_HOSTNAME" \
    --url "127.0.0.1:$PORT"