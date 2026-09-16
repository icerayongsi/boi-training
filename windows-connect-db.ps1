$ErrorActionPreference = "Stop"

# ============================================
# Config
# ============================================

$CloudflareHostname = "boi-tfm-db.kttechsolution.com"
$InstallDir = "$env:USERPROFILE\.mysql-training\bin"
$Cloudflared = "$InstallDir\cloudflared.exe"

# ============================================
# Prepare
# ============================================

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

Write-Host ""
Write-Host "============================================"
Write-Host " Cloudflare MySQL Training"
Write-Host "============================================"
Write-Host ""

# ============================================
# Detect architecture
# ============================================

if ($env:PROCESSOR_ARCHITEW6432 -eq "ARM64" -or
    $env:PROCESSOR_ARCHITECTURE -eq "ARM64") {

    $Arch = "arm64"

} elseif ($env:PROCESSOR_ARCHITECTURE -eq "AMD64") {

    $Arch = "amd64"

} else {

    Write-Host "[ERROR] Unsupported CPU architecture."
    exit 1
}

Write-Host "Architecture : $Arch"
Write-Host "Hostname     : $CloudflareHostname"
Write-Host ""

# ============================================
# Download cloudflared
# ============================================

if (-not (Test-Path $Cloudflared)) {

    Write-Host "[INFO] Downloading cloudflared..."

    if ($Arch -eq "amd64") {
        $Url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    }
    else {
        $Url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-arm64.exe"
    }

    Invoke-WebRequest `
        -Uri $Url `
        -OutFile $Cloudflared

    Write-Host "[OK] cloudflared installed."
}
else {

    Write-Host "[OK] cloudflared already installed."
}

# ============================================
# Version
# ============================================

& $Cloudflared --version

# ============================================
# Port
# ============================================

$DefaultPort = 3306

$InputPort = Read-Host "Local MySQL port [$DefaultPort]"

if ([string]::IsNullOrWhiteSpace($InputPort)) {
    $Port = $DefaultPort
}
else {
    $Port = [int]$InputPort
}

# ============================================
# Check port
# ============================================

while ($true) {

    $Used = Get-NetTCPConnection `
        -LocalPort $Port `
        -State Listen `
        -ErrorAction SilentlyContinue

    if ($null -eq $Used) {
        break
    }

    Write-Host "[WARN] Port $Port is already in use."

    $Port++

    Write-Host "[INFO] Trying port $Port..."
}

# ============================================
# Start
# ============================================

Write-Host ""
Write-Host "============================================"
Write-Host " MySQL Connection"
Write-Host "============================================"
Write-Host ""

Write-Host "Remote:"
Write-Host "  $CloudflareHostname"

Write-Host ""
Write-Host "Local:"
Write-Host "  Host : 127.0.0.1"
Write-Host "  Port : $Port"

Write-Host ""
Write-Host "Node-RED / MySQL:"
Write-Host "  Host = 127.0.0.1"
Write-Host "  Port = $Port"

Write-Host ""
Write-Host "Starting Cloudflare Access..."
Write-Host "Press Ctrl+C to disconnect."
Write-Host ""

& $Cloudflared access tcp `
    --hostname $CloudflareHostname `
    --url "127.0.0.1:$Port"