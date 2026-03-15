# Phase R5 — Bridge Removal Plan

## R5.1 — Low-Risk Dead Path Removal
*   **Target**: `kernel/index.js`, `services/jobManager.js`, `routes/reservations.js`.
*   **Action**: Delete these files as they have no active callers in the Product App code according to the audit.
*   **Impact**: Cleanup of transitional artifacts.

## R5.2 — Medium-Risk Cutover (Imports)
*   **Target**: 
    - `routes/preflightV2.js` (Policy Engine)
    - `services/internal/reportCore.js` (Policy Engine)
*   **Action**: Update `require` statements to use relative paths to the canonical `ppos-governance-assurance` repository.
*   **Impact**: Decouples these components from the local shim and points directly to the canonical source.

## R5.3 — Medium-Risk Cutover (Server/Routes)
*   **Target**: `server.js`.
*   **Action**:
    - Update `printerAuth` middleware requirement.
    - Update `connectRouter` requirement.
*   **Impact**: Ensures the Product App server boots using logic residing in OS repositories.

## R5.4 — Final Bridge Deletion
*   **Action**: Delete `services/policyEngine.js`, `middleware/printerAuth.js`, `routes/connect.js` ONLY after R5.2 and R5.3 are validated.

## Validation Routine
1. `npm start` in Product App.
2. Check `/health` and `/api/ready`.
3. Verify `/api/v2/preflight/policies` still returns data.
4. Verify `/api/connect` (if still needed) or ensuring no crash on boot.
