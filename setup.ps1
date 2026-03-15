# ============================================================
# PrintPrice OS — Master Setup Script (Industrial Version)
# Windows / PowerShell
# ============================================================

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $RootDir ".setup-logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = Join-Path $LogDir "setup_$Timestamp.log"

function LogInfo($msg)  { "[INFO]  $msg"  | Tee-Object -FilePath $LogFile -Append }
function LogWarn($msg)  { "[WARN]  $msg"  | Tee-Object -FilePath $LogFile -Append }
function LogError($msg) { "[ERROR] $msg"  | Tee-Object -FilePath $LogFile -Append }

function Fail($msg) {
    LogError $msg
    throw $msg
}

function Require-Command($cmd, $helpMsg) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Fail "Missing command: $cmd. $helpMsg"
    }
}

function Copy-EnvIfMissing($target, $source) {
    if (-not (Test-Path $target)) {
        if (Test-Path $source) {
            Copy-Item $source $target
            LogInfo "Created env file: $target"
        } else {
            LogWarn "No template found for $target (expected $source)"
        }
    } else {
        LogInfo "Env already exists: $target"
    }
}

function Ensure-Dir($path) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
    }
}

function Install-NodeDeps($svcPath) {
    Push-Location $svcPath
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue" # Don't stop on npm warnings
    try {
        if (Test-Path "package-lock.json") {
            LogInfo "Attempting npm ci -> $svcPath"
            npm ci 2>$null | Tee-Object -FilePath $LogFile -Append
            if ($LASTEXITCODE -ne 0) {
                LogWarn "npm ci failed. Falling back to npm install..."
                npm install 2>&1 | Tee-Object -FilePath $LogFile -Append
            }
        } else {
            LogInfo "npm install -> $svcPath"
            npm install 2>&1 | Tee-Object -FilePath $LogFile -Append
        }
    }
    finally {
        $ErrorActionPreference = $oldEap
        Pop-Location
    }
}

function Build-ServiceIfPresent($svcPath) {
    Push-Location $svcPath
    try {
        if (Test-Path "package.json") {
            $pkgJson = Get-Content "package.json" -Raw | ConvertFrom-Json
            if ($pkgJson.scripts -and $pkgJson.scripts.build) {
                LogInfo "npm run build -> $svcPath"
                npm run build 2>&1 | Tee-Object -FilePath $LogFile -Append
            } else {
                LogInfo "No build script in $svcPath"
            }
        }
    }
    catch {
        LogWarn "Failed to check or run build for $svcPath"
    }
    finally {
        Pop-Location
    }
}

function Wait-HttpHealth($url, $name, $timeoutSec = 60) {
    LogInfo "Health check: $name -> $url"
    $start = Get-Date
    while ($true) {
        try {
            Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5 | Out-Null
            LogInfo "Health OK: $name"
            return
        } catch {
            $elapsed = (Get-Date) - $start
            if ($elapsed.TotalSeconds -gt $timeoutSec) {
                LogWarn "Health check timeout for $name ($url). Service might be starting slowly or failed."
                return
            }
            Start-Sleep -Seconds 5
        }
    }
}

LogInfo "Starting PrintPrice OS industrial setup"

Require-Command "node" "Install Node.js >= 20"
Require-Command "npm" "Install Node.js >= 20"
Require-Command "docker" "Install Docker Desktop"

$nodeVersion = (node -v).Trim()
LogInfo "Node version detected: $nodeVersion"

if (-not ($nodeVersion.StartsWith("v20") -or $nodeVersion.StartsWith("v21") -or $nodeVersion.StartsWith("v22") -or $nodeVersion.StartsWith("v24"))) {
    LogWarn "Node.js >= 20 recommended. Current: $nodeVersion"
}

$GhostscriptOk = $false
if (Get-Command "gswin64c" -ErrorAction SilentlyContinue) { $GhostscriptOk = $true }
elseif (Get-Command "gs" -ErrorAction SilentlyContinue) { $GhostscriptOk = $true }

if (-not $GhostscriptOk) {
    Fail "Ghostscript not found. Install it and add it to PATH."
}

# Docker check
try {
    docker ps > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        LogErr "Docker daemon is not running or not accessible. Please start Docker Desktop."
        $DockerActive = $false
    } else {
        $DockerActive = $true
    }
} catch {
    $DockerActive = $false
}

$Services = @(
    "ppos-shared-infra",
    "ppos-preflight-engine",
    "ppos-preflight-service",
    "ppos-preflight-worker",
    "PrintPricePro_Preflight-master"
)

foreach ($svc in $Services) {
    $pkg = Join-Path $RootDir $svc
    $pkgJson = Join-Path $pkg "package.json"
    if (-not (Test-Path $pkgJson)) {
        Fail "Missing package.json in $svc"
    }
}

Copy-EnvIfMissing (Join-Path $RootDir ".env") (Join-Path $RootDir ".env.example")
Copy-EnvIfMissing (Join-Path $RootDir "ppos-preflight-engine\.env") (Join-Path $RootDir "ppos-preflight-engine\.env.example")
Copy-EnvIfMissing (Join-Path $RootDir "ppos-preflight-service\.env") (Join-Path $RootDir "ppos-preflight-service\.env.example")
Copy-EnvIfMissing (Join-Path $RootDir "ppos-preflight-worker\.env") (Join-Path $RootDir "ppos-preflight-worker\.env.example")
Copy-EnvIfMissing (Join-Path $RootDir "PrintPricePro_Preflight-master\.env") (Join-Path $RootDir "PrintPricePro_Preflight-master\.env.example")

Ensure-Dir (Join-Path $RootDir ".runtime")
Ensure-Dir (Join-Path $RootDir ".runtime\tmp")
Ensure-Dir (Join-Path $RootDir ".runtime\uploads")
Ensure-Dir (Join-Path $RootDir ".runtime\quarantine")
Ensure-Dir (Join-Path $RootDir ".runtime\logs")

foreach ($svc in $Services) {
    Install-NodeDeps (Join-Path $RootDir $svc)
}

foreach ($svc in $Services) {
    Build-ServiceIfPresent (Join-Path $RootDir $svc)
}

if ($DockerActive) {
    Push-Location $RootDir
    try {
        if (Test-Path (Join-Path $RootDir "docker-compose.yml")) {
            LogInfo "Starting Docker services"
            if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
                docker-compose up -d --build 2>&1 | Tee-Object -FilePath $LogFile -Append
            } else {
                docker compose up -d --build 2>&1 | Tee-Object -FilePath $LogFile -Append
            }
        }
    }
    finally {
        Pop-Location
    }
} else {
    LogWarn "Skipping Docker services as daemon is not reachable."
}

# Ajusta las URLs según tus puertos reales
try { Wait-HttpHealth "http://localhost:8001/health" "Preflight Engine" 90 } catch { LogWarn $_ }
try { Wait-HttpHealth "http://localhost:3000/health" "Preflight Service" 90 } catch { LogWarn $_ }

LogInfo "============================================================"
LogInfo "PrintPrice OS setup completed successfully"
LogInfo "Log file: $LogFile"
LogInfo "============================================================"
