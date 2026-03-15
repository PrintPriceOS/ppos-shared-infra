#!/usr/bin/env bash
set -euo pipefail

# PrintPrice OS Healthcheck Script
# Phase R13 - H5 (Deployment Automation)

echo "--- 🏥 PRINTPRICE OS HEALTHCHECK ---"

# 1. Check Preflight Engine
echo -n "[1/3] Preflight Engine (8001)... "
if curl -fsS http://localhost:8001/health >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# 2. Check Preflight Service
echo -n "[2/3] Preflight Service (3000)... "
if curl -fsS http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

# 3. Check Metrics Endpoint
echo -n "[3/3] Metrics Endpoint (3000/metrics)... "
if curl -fsS http://localhost:3000/metrics >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAILED (Check if prom-client is installed and route registered)"
fi

echo "--- HEALTHCHECK COMPLETE ---"
