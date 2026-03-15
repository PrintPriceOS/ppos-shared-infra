# Phase R2 — Canonical Ownership Map

This map defines the canonical repository owner for each module extracted from the Product App.

| Path | Canonical Repo | Reason |
| :--- | :--- | :--- |
| `kernel/` | `ppos-core-platform` | Core domain model and canonical contracts. |
| `policies/` | `ppos-governance-assurance` | Governance rule definitions. |
| `services/policyEngine.js` | `ppos-governance-assurance` | Governance decision runtime. |
| `services/jobManager.js` | `ppos-core-platform` | Job registry and platform-side state. |
| `scripts/governance-check.js` | `ppos-governance-assurance` | Operational governance tooling. |
| `scripts/simulate-autonomous-jobs.js` | `ppos-core-platform` | Platform orchestration simulator. |

## Ownership Principles
1. **Separation of Concerns**: Product App owns UX; OS repos own Logic/Decision-making.
2. **Single Source of Truth**: Policies live in Governance; Dispatch logic lives in Core Platform.
3. **No Drift**: Shared logic must be in shared packages or the OS repositories, not duplicated in Product.
