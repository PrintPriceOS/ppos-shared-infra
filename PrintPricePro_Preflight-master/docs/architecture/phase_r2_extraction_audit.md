# Phase R2 — Extraction Audit

## Overview
This audit identifies residues of Kernel and Governance logic within the Product App (`PrintPricePro_Preflight-master`) and classifies them for extraction to their canonical repositories.

## Extraction Classifications

| Item | Current Path | Responsibility | Boundary Violation | Destination Repo | Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Platform Kernel** | `kernel/` | Core domain objects, contracts, and canonical report assembly. | Core platform brain logic in Product App. | `ppos-core-platform` | `MOVE_TO_PPOS_CORE_PLATFORM` |
| **Policy Definitions** | `policies/` | JSON rule definitions for print production. | Governance data definition in Product App. | `ppos-governance-assurance` | `MOVE_TO_PPOS_GOVERNANCE_ASSURANCE` |
| **Policy Engine** | `services/policyEngine.js` | Logic for evaluating print policies and technical rules. | Governance decision runtime in Product App. | `ppos-governance-assurance` | `MOVE_TO_PPOS_GOVERNANCE_ASSURANCE` |
| **Job Management** | `services/jobManager.js` | Job lifecycle, task queuing, and status management. | Partially violates "job registry kernel" boundary. | `ppos-core-platform` | `MOVE_TO_PPOS_CORE_PLATFORM` (with bridge) |
| **Governance Check** | `scripts/governance-check.js`| Scripts for verifying governance state. | Governance tool in Product App. | `ppos-governance-assurance` | `MOVE_TO_PPOS_GOVERNANCE_ASSURANCE` |
| **Autonomous Jobs** | `scripts/simulate-autonomous-jobs.js`| Orchestration simulation. | Kernel-level simulation in Product App. | `ppos-core-platform` | `MOVE_TO_PPOS_CORE_PLATFORM` |

## Classification Legend

*   `MOVE_TO_PPOS_GOVERNANCE_ASSURANCE`: Extract to Governance repository.
*   `MOVE_TO_PPOS_CORE_PLATFORM`: Extract to Core Platform repository.
*   `KEEP_IN_PRODUCT_APP`: Purely UI/UX or product-side adapter logic.
*   `THIN_BRIDGE_REQUIRED`: Requires a compatibility adapter in Product App.
*   `DELETE_LEGACY`: Logic is redundant or replaced by platform services.

## Risk Analysis

*   **Policy Engine Extraction**: High risk. The Product App depends on `policyEngine.js` for realtime preflight feedback in the UI. A bridge or client-side SDK is mandatory.
*   **Job Management Extraction**: Medium-High risk. The local database interactions for jobs are currently centralized in `jobManager.js`.
*   **Kernel Extraction**: Low-Medium risk. Mostly data structures and mappers, but requires updating imports across the workspace.

## Required Bridges

1.  `services/policyEngine.js` -> Will be replaced by a bridge to `@ppos/governance` (shared or service).
2.  `services/jobManager.js` -> Will remain as a product-side adapter for local job state, but core "Platform Brain" logic will be moved.
