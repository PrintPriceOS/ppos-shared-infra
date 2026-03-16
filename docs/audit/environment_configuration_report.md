# Environment Configuration Report

## Overview
This report compiles all environment variables used across the PrintPrice OS ecosystem. It identifies required secrets, configuration flags, and infrastructure endpoints.

## Canonical Environment Variables

| Variable Name | Description | Required | Default / Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment (production, development) | Yes | `development` |
| `PORT` | Listening port for the service | Yes | `8080`, `3001` |
| `DB_HOST` | MySQL database host | Yes | `localhost` / `mysql` |
| `DB_USER` | MySQL username | Yes | `ppos_user` |
| `DB_PASS` | MySQL password | Yes | `********` |
| `DB_NAME` | MySQL database name | Yes | `ppos_core` |
| `REDIS_HOST` | Redis host for queues/cache | Yes | `localhost` / `redis` |
| `REDIS_PORT` | Redis port | Yes| `6379` |
| `REDIS_PASSWORD` | Redis password | No | `********` |
| `GS_COMMAND` | Command/Path for Ghostscript | Yes | `gs` (Linux) / `gs.exe` (Win) |
| `PPOS_LOG_LEVEL` | Logging verbosity | No | `info` |
| `API_KEY` | Platform API access key | Yes | `sk_...` |
| `GEMINI_API_KEY` | AI Analysis Engine key | Yes | `AIza...` |
| `PPOS_TEMP_DIR` | Directory for PDF processing | Yes | `/tmp/ppos-preflight` |
| `WORKER_POOL` | Number of concurrent worker threads | No | `4` |
| `TEMPORAL_ADDRESS` | Address for Temporal orchestration | Maybe | `localhost:7233` |

## Repository-Specific Configurations

### `ppos-preflight-engine`
- `GS_COMMAND`: Path to Ghostscript.
- `PPOS_TEMP_DIR`: Workdir for file processing.

### `ppos-preflight-worker`
- `REDIS_HOST`: Used for BullMQ.
- `WORKER_POOL`: Size of the execution bridge.

### `PrintPricePro_Preflight-master` (Legacy)
- `VITE_CONTROL_PLANE_URL`: URL for the management UI.
- `VITE_FEATURE_ADMIN`: Toggle for administrative tools.

## Findings & Discrepancies
1. **Redundant Variables**: Some services use `DB_URL` while others use split `DB_HOST/DB_PORT` variables.
2. **Missing `.env.example`**: `ppos-governance-assurance` and `ppos-printer-agent` lack template configuration files.
3. **Hardcoded Fallbacks**: Several modules have hardcoded fallbacks in `server.js` or `db.js` that might mask configuration errors.

## Remediation Plan
1. **Create centralized `.env.example`** in the root directory.
2. **Synchronize Database naming**: standardizing on `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
3. **Audit Secret Handling**: Ensure `API_KEY` and `GEMINI_API_KEY` are never committed to repositories (checked in Phase 8).
