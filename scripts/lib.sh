#!/usr/bin/env bash

# PrintPrice OS Common Library
# Shared functions for setup and orchestration

log()  { echo "[INFO]  $*"; }
warn() { echo "[WARN]  $*"; }
err()  { echo "[ERROR] $*" >&2; }

check_node() {
    local required=$1
    local current=$(node -v | sed 's/^v//' | cut -d. -f1)
    if (( current < required )); then
        err "Node.js $required+ required. Found v$current"
        return 1
    fi
    return 0
}

find_gs() {
    if command -v gs >/dev/null 2>&1; then echo "gs"; return 0; fi
    if command -v gswin64c >/dev/null 2>&1; then echo "gswin64c"; return 0; fi
    return 1
}
