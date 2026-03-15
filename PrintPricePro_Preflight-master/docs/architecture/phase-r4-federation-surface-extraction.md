# Phase R4.A — Federation Surface Extraction Report

**Status:** COMPLETED
**Date:** 2026-03-14
**Canonical Repos**: `ppos-control-plane`, `ppos-core-platform`

## 1. Summary
Extracted the residual federation-facing surfaces (onboarding and authentication) from the Product App. The Product App no longer owns the security or registration logic for printers.

## 2. Extracted Components

| Component | Previous Path | New Path | Canonical Owner |
| :--- | :--- | :--- | :--- |
| **Printer Auth** | `middleware/printerAuth.js` | `ppos-core-platform/src/middleware/printerAuth.js` | `ppos-core-platform` |
| **Connect API** | `routes/connect.js` | `ppos-control-plane/src/routes/connect.js` | `ppos-control-plane` |

## 3. Implementation Details
*   **Printer Auth**: Moved to `ppos-core-platform` as it is a shareable runtime security component used by both the control plane (onboarding) and the core (live dispatch).
*   **Connect API**: Relocated to `ppos-control-plane`. It manages the administrative lifecycle of printers.
*   **Integrity**: Both files are now thin-bridged in the Product App.

## 4. Validation
*   [x] Product App boots successfully.
*   [x] `/api/connect` routes remain available via the bridge.
*   [x] Internal dependencies for moved files are resolved via relative paths back to the product BFF services.
