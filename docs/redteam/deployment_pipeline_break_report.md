# Red Team Report: Deployment Pipeline Break Test

## Audit Objective
Attempt to break the installation and materialization process to ensure the pipeline is robust against partial successes.

## Pipeline Fragility Points

### 🏗️ Break Test 1: "Partial Registry" (Missing Manifests)
- **Action**: Run `npm install` in the root of the materialization.
- **Result**: **FATAL FAILURE**. npm cannot resolve workspaces because `ppos-governance-assurance` and `ppos-printer-agent` lack a `package.json`.
- **Diagnosis**: The repositories were created but not "initialized" as Node.js packages. This breaks the entire mono-repo build chain.

### 🏗️ Break Test 2: "Lockfile Conflict"
- **Action**: Mixture of `npm` and `pnpm`.
- **Observation**: `ppos-build-orchestrator` says it's materializing with `npx -y create-vite-app`, but the lockfiles often drift.
- **Result**: `node_modules` pollution.
- **Impact**: ⚠️ **Inconsistent behavior between development and CI**.

### 🏗️ Break Test 3: "Ghost-Script Pathing"
- **Observation**: The `Dockerfile` for `preflight-engine` uses `GS_COMMAND=gs`.
- **Result**: If the container base image changes or the path is moved, the entrypoint fails.
- **Diagnosis**: No `CMD ["which", "gs"]` or similar smoke-check exists in the build stage of the Dockerfile.

## Findings
1. **Lack of Build Order**: There is no script that enforces the order of operations (`contracts` -> `infra` -> `rest`).
2.  **Environment Pollution**: The `bootstrap-repos.ps1` script assumes it is running in the user's home directory. If run from a different folder, it creates repos in unexpected locations.
3.  **No "Clean" Command**: There is no script to `WIPE` the environment and re-start. Residual files in `node_modules` or `dist` can cause phantom build errors.

## Remediation Plan
1. **P0: Materialization Manifests**: ADD a default `package.json` to ALL repositories during the bootstrap phase.
2. **P1: Unified Lockfile**: Force the use of `pnpm` across all repositories to manage the workspace efficiently.
3. **P2: Docker Smoke Check**: Add a `RUN gs --version` step to the Dockerfile to "fail fast" during the image build if the binary is missing.
