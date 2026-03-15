#!/usr/bin/env bash
set -Eeuo pipefail

# ============================================================
# PrintPrice OS — Master Setup Script (Industrial Version)
# Linux/macOS
# ============================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$ROOT_DIR/scripts"
LOG_DIR="$ROOT_DIR/.setup-logs"
mkdir -p "$LOG_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$LOG_DIR/setup_${TIMESTAMP}.log"

# ---------- logging ----------
log()  { echo "[INFO]  $*" | tee -a "$LOG_FILE"; }
warn() { echo "[WARN]  $*" | tee -a "$LOG_FILE"; }
err()  { echo "[ERROR] $*" | tee -a "$LOG_FILE" >&2; }
die()  { err "$*"; exit 1; }

trap 'err "Setup failed at line $LINENO. Check $LOG_FILE"' ERR

# ---------- config ----------
REQUIRED_NODE_MAJOR=20
SERVICES=(
  "ppos-shared-infra"
  "ppos-preflight-engine"
  "ppos-preflight-service"
  "ppos-preflight-worker"
  "PrintPricePro_Preflight-master"
)

ENV_FILES=(
  "$ROOT_DIR/.env"
  "$ROOT_DIR/ppos-preflight-engine/.env"
  "$ROOT_DIR/ppos-preflight-service/.env"
  "$ROOT_DIR/ppos-preflight-worker/.env"
  "$ROOT_DIR/PrintPricePro_Preflight-master/.env"
)

# ---------- helpers ----------
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

require_command() {
  local cmd="$1"
  local help_msg="${2:-Install '$cmd' and retry.}"
  command_exists "$cmd" || die "Missing command: $cmd. $help_msg"
}

detect_os() {
  case "$(uname -s)" in
    Linux*)  echo "linux" ;;
    Darwin*) echo "macos" ;;
    *)       echo "unknown" ;;
  esac
}

node_major_version() {
  node -v | sed 's/^v//' | cut -d. -f1
}

find_ghostscript() {
  if command_exists gs; then
    echo "gs"
    return 0
  fi
  if command_exists gswin64c; then
    echo "gswin64c"
    return 0
  fi
  return 1
}

copy_env_if_missing() {
  local target="$1"
  local source="$2"
  if [[ ! -f "$target" ]]; then
    if [[ -f "$source" ]]; then
      cp "$source" "$target"
      log "Created env file: $target"
    else
      warn "No template found for $target (expected $source)"
    fi
  else
    log "Env already exists: $target"
  fi
}

check_package_json() {
  local svc="$1"
  [[ -f "$ROOT_DIR/$svc/package.json" ]] || die "Missing package.json in $svc"
}

install_node_deps() {
  local svc="$1"
  local svc_dir="$ROOT_DIR/$svc"

  [[ -d "$svc_dir" ]] || die "Missing service directory: $svc_dir"
  [[ -f "$svc_dir/package.json" ]] || die "Missing package.json in $svc"

  log "Installing dependencies in $svc"
  cd "$svc_dir"

  if [[ -f package-lock.json ]]; then
    npm ci | tee -a "$LOG_FILE"
  else
    npm install | tee -a "$LOG_FILE"
  fi
}

build_service_if_present() {
  local svc="$1"
  local svc_dir="$ROOT_DIR/$svc"

  cd "$svc_dir"
  if npm run | grep -q " build"; then
    log "Building $svc"
    npm run build | tee -a "$LOG_FILE"
  else
    log "No build script in $svc — skipped"
  fi
}

ensure_dirs() {
  mkdir -p \
    "$ROOT_DIR/.runtime" \
    "$ROOT_DIR/.runtime/tmp" \
    "$ROOT_DIR/.runtime/uploads" \
    "$ROOT_DIR/.runtime/quarantine" \
    "$ROOT_DIR/.runtime/logs"

  log "Runtime directories ensured"
}

render_root_env_defaults() {
  local env_file="$ROOT_DIR/.env"
  [[ -f "$env_file" ]] || return 0

  grep -q "^PPOS_HOME=" "$env_file" || echo "PPOS_HOME=$ROOT_DIR" >> "$env_file"
  grep -q "^PPOS_TEMP_DIR=" "$env_file" || echo "PPOS_TEMP_DIR=$ROOT_DIR/.runtime/tmp" >> "$env_file"
  grep -q "^PPOS_UPLOAD_DIR=" "$env_file" || echo "PPOS_UPLOAD_DIR=$ROOT_DIR/.runtime/uploads" >> "$env_file"
  grep -q "^PPOS_QUARANTINE_DIR=" "$env_file" || echo "PPOS_QUARANTINE_DIR=$ROOT_DIR/.runtime/quarantine" >> "$env_file"

  log "Root env defaults ensured"
}

wait_for_docker_service() {
  local container_name="$1"
  local timeout="${2:-60}"

  log "Waiting for container '$container_name'..."
  local start
  start="$(date +%s)"

  while true; do
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
      log "Container ready: $container_name"
      return 0
    fi

    local now
    now="$(date +%s)"
    if (( now - start > timeout )); then
      die "Timeout waiting for container: $container_name"
    fi
    sleep 2
  done
}

healthcheck_url() {
  local url="$1"
  local name="$2"
  local timeout="${3:-60}"

  log "Health check: $name -> $url"
  local start
  start="$(date +%s)"

  while true; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "Health OK: $name"
      return 0
    fi

    local now
    now="$(date +%s)"
    if (( now - start > timeout )); then
      die "Health check failed for $name ($url)"
    fi
    sleep 2
  done
}

# ---------- setup steps ----------
log "Starting PrintPrice OS industrial setup"
cd "$ROOT_DIR"

OS_NAME="$(detect_os)"
log "Detected OS: $OS_NAME"

require_command "bash"
require_command "npm" "Install Node.js >= 20."
require_command "node" "Install Node.js >= 20."
require_command "docker" "Install Docker Desktop / Docker Engine."
require_command "curl" "Install curl."

NODE_MAJOR="$(node_major_version)"
if (( NODE_MAJOR < REQUIRED_NODE_MAJOR )); then
  die "Node.js v$REQUIRED_NODE_MAJOR+ required. Current: $(node -v)"
fi
log "Node version OK: $(node -v)"

GS_BIN="$(find_ghostscript || true)"
if [[ -z "${GS_BIN:-}" ]]; then
  warn "Ghostscript not found in PATH."
  warn "Linux: apt-get install ghostscript"
  warn "macOS: brew install ghostscript"
  die "Ghostscript is required."
fi
log "Ghostscript OK: $GS_BIN"

for svc in "${SERVICES[@]}"; do
  check_package_json "$svc"
done
log "All required package.json files found"

copy_env_if_missing "$ROOT_DIR/.env" "$ROOT_DIR/.env.example"
copy_env_if_missing "$ROOT_DIR/ppos-preflight-engine/.env" "$ROOT_DIR/ppos-preflight-engine/.env.example"
copy_env_if_missing "$ROOT_DIR/ppos-preflight-service/.env" "$ROOT_DIR/ppos-preflight-service/.env.example"
copy_env_if_missing "$ROOT_DIR/ppos-preflight-worker/.env" "$ROOT_DIR/ppos-preflight-worker/.env.example"
copy_env_if_missing "$ROOT_DIR/PrintPricePro_Preflight-master/.env" "$ROOT_DIR/PrintPricePro_Preflight-master/.env.example"

ensure_dirs
render_root_env_defaults

for svc in "${SERVICES[@]}"; do
  install_node_deps "$svc"
done

for svc in "${SERVICES[@]}"; do
  build_service_if_present "$svc"
done

if [[ -f "$ROOT_DIR/docker-compose.yml" ]]; then
  log "Bringing up Docker services"
  docker compose up -d --build | tee -a "$LOG_FILE"
else
  die "docker-compose.yml not found at root"
fi

# Adjust container names if needed
wait_for_docker_service "ppos-mysql" 90 || true
wait_for_docker_service "ppos-redis" 90 || true

# Adjust endpoints to your actual ports
healthcheck_url "http://localhost:8001/health" "Preflight Engine" 90 || true
healthcheck_url "http://localhost:3000/health" "Preflight Service" 90 || true

log "============================================================"
log "PrintPrice OS setup completed successfully"
log "Log file: $LOG_FILE"
log "Next steps:"
log "  1. Review generated .env files"
log "  2. Run smoke test job"
log "  3. Run PRP / Red Team validation"
log "============================================================"
