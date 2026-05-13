#!/usr/bin/env bash
set -euo pipefail

echo "====================================================================="
echo "PrintPrice OS — Industrial Preflight Fleet Build Script"
echo "Hardening Production Containers with Persistent Forensic Tooling"
echo "====================================================================="

# 1. Build Base Hardened Layer
echo "[BUILD] Building common hardened base image layer..."
docker build -t ppos/preflight-base:production -f recipes/base/Dockerfile .

# 2. Build Preflight Service Production Image
echo "[BUILD] Building ppos/preflight-service:production..."
docker build -t ppos/preflight-service:production -f recipes/ppos-preflight-service/Dockerfile ..

# 3. Build Preflight Worker Production Image
echo "[BUILD] Building ppos/preflight-worker:production..."
docker build -t ppos/preflight-worker:production -f recipes/ppos-preflight-worker/Dockerfile ..

echo "====================================================================="
echo "[SUCCESS] Production images compiled successfully."
echo "Validation check commands can now be run to ensure tooling persistence."
echo "====================================================================="
