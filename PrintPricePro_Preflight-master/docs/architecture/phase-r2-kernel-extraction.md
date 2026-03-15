# Phase R2.B — Kernel Extraction Report

**Status:** COMPLETED
**Date:** 2026-03-14
**Canonical Repo:** `ppos-core-platform`

## 1. Summary
Extracted the Platform Kernel and Job Registry logic from the Product App and relocated them to the `ppos-core-platform` repository. The Product App is now a pure consumer of the platform's core contracts and registry logic.

## 2. Extracted Components

| Component | Previous Path | New Path | Bridge Status |
| :--- | :--- | :--- | :--- |
| **Platform Kernel** | `kernel/` | `ppos-core-platform/src/kernel/` | THIN_BRIDGE |
| **Job Registry** | `services/jobManager.js` | `ppos-core-platform/src/registry/jobManager.js` | THIN_BRIDGE |
| **Autonomous Simulator** | `scripts/simulate-autonomous-jobs.js` | `ppos-core-platform/scripts/simulate-autonomous-jobs.js` | DELETED (Moved) |

## 3. Implementation Details
*   **Kernel Bridge**: `kernel/index.js` in the Product App now proxies all calls to the canonical kernel in `ppos-core-platform`.
*   **Job Registry Bridge**: `services/jobManager.js` acts as a compatibility adapter for local job state management.
*   **Ownership**: Canonical ownership of "Platform Brain" logic is now explicitly in `ppos-core-platform`.

## 4. Validation Results
*   **Contract Integrity**: Canonical report assembly via `kernel` still functions through the bridge.
*   **Job Flow**: Job creation and updates remain functional for the Product BFF.
*   **Local Integration**: Sibling repositories successfully share code via the integration workspace.

## 5. Next Steps
*   Refactor `jobManager.js` to use a gRPC or REST API once `ppos-core-platform` is fully service-oriented.
*   Fully replace local bridge imports with `@ppos/core-platform` package references.
