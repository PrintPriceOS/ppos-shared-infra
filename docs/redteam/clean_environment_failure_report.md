# Red Team Report: Clean Environment Failure

## Audit Objective
Simulate the deployment of PrintPrice OS on a virgin machine with zero pre-configuration to identify "Hidden Friction" and deployment blockers.

## Test Scenario: "The Day Zero Disaster"
1. `git clone` all repositories.
2. `npm install` in each directory.
3. `node server.js` or `npm start`.

## Simulation Results

| Step | Status | Failure Point | Root Cause |
| :--- | :--- | :--- | :--- |
| **1. Repository Cloning** | ✅ Success | N/A | Repositories are accessible. |
| **2. Dependency Installation** | 🛑 Fatal | `ppos-governance-assurance` | **MISSING package.json**. Repository cannot be installed or used as a module. |
| **3. Build Process** | 🛑 Fatal | `ppos-printer-agent` | **MISSING package.json**. Cannot initiate build. |
| **4. Service Startup** | 🛑 Fatal | `ppos-shared-infra` | **MISSING .env**. No fallback for `DATABASE_URL` in strict mode; fallback to `localhost` fails silently. |
| **5. Runtime Execution** | 🛑 Critical | `ppos-preflight-engine` | **MISSING Ghostscript**. The binary `gs` is not present on clean machines. |

## Hidden Assumptions Exposed
1. **Assumed Sibling Paths**: `db.js` in the legacy app assumes `../../ppos-shared-infra/packages/data/db` exists. If a developer clones only the legacy repo, it fails with `MODULE_NOT_FOUND`.
2. **Ghostscript Presence**: The system assumes `gs` (Linux) or `gswin64c` (Windows) is globally available in the PATH. There is no automated installer or check during the `npm install` phase.
3. **Manual Folder Creation**: While some services create folders at runtime, others expect `uploads/` or `temp/` to exist by default.
4. **Git Identity**: The bootstrap process assumes a pre-configured git user. On a clean machine, `git commit` fails, stalling the materialization script.

## Critical Blockers
- **Distribution Gap**: 2 out of 11 repositories are effectively "dead code" because they lack the required Node.js manifests to be installed.
- **Environment Fragility**: Using specific absolute paths like `C:\Users\KIKE\...` in `.env` makes the system non-reproducible on any other machine.

## Remediation Plan
- **Standardize Manifests**: Ensure every repo has a valid `package.json`.
- **Docker-First Boot**: Replace manual Node start with a `docker-compose up --build` that encapsulates Ghostscript and other OS dependencies.
- **Relativize Paths**: Use `path.resolve(__dirname, '../../')` instead of hardcoded strings for inter-repo references.
