# Phase R2 — Extraction Implementation Plan

## R2.A — Governance Extraction
**Destination**: `ppos-governance-assurance`

### Sequence
1.  **Preparation**: Initialize `ppos-governance-assurance` structure if needed.
2.  **Move Policies**: Move `policies/` directory to `ppos-governance-assurance/data/policies`.
3.  **Move Engine**: Move `services/policyEngine.js` to `ppos-governance-assurance/src/engine/policyEngine.js`.
4.  **Move Scripts**: Move `scripts/governance-check.js` to `ppos-governance-assurance/src/tools/governance-check.js`.
5.  **Bridge Creation**: Create `services/policyEngine.js` as a thin adapter in the Product App.
6.  **Validation**: Verify that the preflight UI still works using the bridge.

## R2.B — Kernel Extraction
**Destination**: `ppos-core-platform`

### Sequence
1.  **Move Kernel**: Move `kernel/` directory to `ppos-core-platform/src/kernel`.
2.  **Move Registry**: Move/Split `services/jobManager.js` to `ppos-core-platform/src/registry/jobManager.js`.
3.  **Move Simulation**: Move `scripts/simulate-autonomous-jobs.js` to `ppos-core-platform/src/simulators/simulate-autonomous-jobs.js`.
4.  **Update Imports**: Update all references to `../kernel` to use `@ppos/core-platform`.
5.  **Validation**: Verify job submission flow.

## Rollback Plan
*   If extraction fails, restore files from `backups/` or Git history.
*   Bridges can be reverted to original source logic if cutover is unstable.
