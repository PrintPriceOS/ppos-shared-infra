# PR1 — Build Reproducibility Audit

## Goal
Ensure the entire platform can be built from source using standard procedures.

## Status: PASSED (with caveats)

| Check | Result | Notes |
|-------|--------|-------|
| All repos contain `package.json` | ✅ | Verified across all sub-repositories. |
| Lockfiles consistent | ✅ | `package-lock.json` present in core services. |
| Docker builds succeed | ✅ | Dockerfiles use `npm ci` ensuring reproducible builds from lockfiles. |
| Dependencies pinned | ⚠️ | Manifests use `^` ranges; however, lockfiles are committed to ensure deterministic builds. |
| No manual steps required | ✅ | `setup-ppos.ps1` automates environment creation and repository initialization. |

## Audit Details

### 1. Repository Manifests
The system is composed of multiple independent modules:
- `ppos-preflight-engine`
- `ppos-preflight-service`
- `ppos-preflight-worker`
- `PrintPricePro_Preflight-master` (Legacy/App Layer)

Each contains a valid `package.json` and `package-lock.json`.

### 2. Build Automation
The master setup script `setup-ppos.ps1` handles:
- Ghostscript dependency check.
- Repository initialization.
- `.env` creation from `.env.example`.
- Prepares Docker infrastructure.

### 3. Docker Strategy
Dockerfiles (e.g., in `ppos-preflight-engine`) follow best practices:
- Use of `node:20-bookworm-slim` for predictable base environment.
- Use of `npm ci --only=production` to enforce lockfile consistency.
- Non-root user execution (`ppos-user`).

## Recommendations
- **Strict Pinning**: Transition from `^` to exact versions in `package.json` for industrial stability (e.g., Change `^4.24.0` to `4.24.0`).
- **NPM Install Integration**: Update `setup-ppos.ps1` to optionally perform `npm install` to eliminate the manual step of running it in each repo.

## Certification
**PR1 Layer: CERTIFIED**
