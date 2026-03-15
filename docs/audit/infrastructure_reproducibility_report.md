# Infrastructure Reproducibility Report

## Overview
This report evaluates the ability of the PrintPrice OS ecosystem to be deployed on a clean machine without manual intervention or reliance on undocumented server state.

## Hardcoded Paths & Environment Assumptions

| Component | Assumption | Risk Level | Finding |
| :--- | :--- | :--- | :--- |
| **CORS Configuration** | Hardcoded origins in `server.js`. | ⚠️ Medium | Includes `localhost:3000` and `preflight.printprice.pro`. Needs environment-based configuration. |
| **Ghostscript Resolver** | Assumes `gswin64c` on Windows and `gs` on Linux. | ⚠️ Medium | Fails if the system binary is named differently (e.g., `gs.exe` or `gswin32c`) or not in PATH. |
| **Temp Directories** | Hardcoded `/tmp/ppos-preflight` in Dockerfiles. | ✅ Low | Standard practice in Linux containers, but requires manual creation on non-Docker Windows environments. |
| **Monorepo Linking** | Scripts in `ppos-build-orchestrator` assume specific relative sibling paths. | ⚠️ Medium | Requires the entire directory structure provided in the bootstrap script to be intact. |

## Filesystem & Storage Audit
- **Automatic Directory Creation**: `server.js` automatically creates `uploads-v2-temp` using `fs.mkdirSync(v2TempDir, { recursive: true })`. This is good for reproducibility.
- **Absolute Paths**: No critical absolute paths (e.g., `C:\Users\...`) were found in runtime code. All paths use `path.join(__dirname, ...)` or are resolved via environment variables.

## Port & Networking Assumptions
- **Default Ports**:
    - Product BFF: `8080`
    - Preflight Service: `3001`
    - Control Plane: `5173` (Vite) / `3002` (API)
- **Port Conflicts**: Multiple services running on the same host may conflict if not containerized.
- **Database Connection**: Assumes `mysql` and `redis` hosts are resolvable (either via `localhost` or Docker network alias).

## Hidden Dependencies Detected
- **Ghostscript**: Required system binary. Not bundled with the repo.
- **FFMPEG/ImageMagick**: While mentioned in some docs, no active runtime references were found in the current codebase (safe for now).
- **Python**: Some PDF tools may require Python for advanced processing, but none were detected in the primary `package.json` manifest.

## Remediation Plan
1. **Externalize CORS Origins**: Move `allowedOrigins` to a `CORS_ORIGINS` environment variable.
2. **Unified Path Management**: Create a `ppos-shared-infra` package to handle platform-agnostic path resolution (temp dirs, binary paths).
3. **Environment-driven Ports**: Ensure every service strictly respects the `PORT` variable with no hardcoded fallbacks to shared ports.
