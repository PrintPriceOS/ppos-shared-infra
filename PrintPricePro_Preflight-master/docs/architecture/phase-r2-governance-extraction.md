# Phase R2.A — Governance Extraction Report

**Status:** COMPLETED
**Date:** 2026-03-14
**Canonical Repo:** `ppos-governance-assurance`

## 1. Summary
Extracted all governance-related logic and data from the Product App (`PrintPricePro_Preflight-master`) and relocated them to the `ppos-governance-assurance` repository. This completes a critical boundary enforcement step where the Product App no longer defines or executes its own production policies.

## 2. Extracted Components

| Component | Previous Path | New Path | Bridge Status |
| :--- | :--- | :--- | :--- |
| **Policy Definitions** | `policies/` | `ppos-governance-assurance/policies/` | DELETED (Moved) |
| **Policy Engine** | `services/policyEngine.js` | `ppos-governance-assurance/src/policyEngine.js` | THIN_BRIDGE |
| **ICC Profiles** | `icc-profiles/` | `ppos-governance-assurance/icc-profiles/` | DELETED (Moved) |
| **Governance Check** | `scripts/governance-check.js` | `ppos-governance-assurance/scripts/governance-check.js` | DELETED (Moved) |

## 3. Implementation Details
*   **Thin Bridge**: `services/policyEngine.js` in the Product App now acts as a compatibility adapter that forwards all calls to the canonical implementation in the sibling repository.
*   **Filesystem Cleanup**: The `policies/` and `icc-profiles/` directories were removed from the Product App to prevent state drift.
*   **Dependency Update**: `dependencyChecker.js` was updated to reflect the new boundary.

## 4. Validation Results
*   **Bootstrap**: Product App boots successfully scanning its own `services/` instead of `policies/`.
*   **Policy Loading**: Bridge successfully loads policies from the canonical sibling path.
*   **Integrity**: Governance Engine successfully finds policies and ICC profiles in its new canonical home.

## 5. Rollback Note
To rollback, move the contents of `ppos-governance-assurance/policies` and `ppos-governance-assurance/src/policyEngine.js` back to their original locations in `PrintPricePro_Preflight-master` and restore the original `policyEngine.js` from `backups/`.
