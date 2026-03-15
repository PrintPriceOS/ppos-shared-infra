# Repository Extraction Program Plan

## R1 — Workspace Normalization (Quick Wins)
- **Goal**: Resolve repo nesting and visibility.
- **Actions**:
  - Move `ppos-control-plane` to root `c:\Users\KIKE\Desktop\PrintPricePro_Preflight-master (7)\`.
  - Move `ppos-printer-agent` to root.
  - Remove redundant `ppos-build-orchestrator` if it exists as a duplicate.
  - Update `bootstrap` scripts to reflect new sibling structure.

## R2 — Kernel & Contract Extraction
- **Goal**: Move core platform brain to its canonical home.
- **Actions**:
  - Migrate `kernel/` contents to `ppos-core-platform/src/kernel`.
  - Replace local relative imports in Product App with `@ppos/core-platform` (linked via npm/yarn).

## R3 — Governance Decoupling
- **Goal**: Remove policy execution from Product App runtime.
- **Actions**:
  - Extract `services/policyEngine.js` and `policies/` to `ppos-governance-assurance`.
  - Introduce an API bridge: Product App calls OS for policy checks instead of running them locally.

## R4 — Federation Runtime Extraction
- **Goal**: Detach printer-facing logic.
- **Actions**:
  - Move `routes/connect.js` and `routes/reservations.js` to `ppos-control-plane` or `ppos-core-platform`.
  - Ensure printer agents talk to the OS, not the Product App.

## R5 — Infrastructure Serialization
- **Goal**: Standardize shared utilities.
- **Actions**:
  - Refactor `services/db.js` into a proper package in `ppos-shared-infra`.
  - Update all repositories to consume `@ppos/shared-infra`.

## R6 — Final Cleanup
- **Goal**: Purge all non-product artifacts.
- **Actions**:
  - Remove empty `workers/` directory.
  - Delete `registry.__mirror`.
  - Sanitize `package.json` dependencies.
