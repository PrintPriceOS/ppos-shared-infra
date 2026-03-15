# Phase R4.B — Reservation Surface Extraction Report

**Status:** COMPLETED
**Date:** 2026-03-14
**Canonical Repo**: `ppos-core-platform`

## 1. Summary
Extracted the residual capacity reservation logic from the Product App and relocated it to the `ppos-core-platform` repository.

## 2. Extracted Components

| Component | Previous Path | New Path | Bridge Status |
| :--- | :--- | :--- | :--- |
| **Reservations API** | `routes/reservations.js` | `ppos-core-platform/src/routes/reservations.js` | THIN_BRIDGE |

## 3. Implementation Details
*   **Ownership**: Reservations are now explicitly owned by the Core Platform.
*   **Bridge**: A compatibility bridge exists in `routes/reservations.js` in the Product App, although the route was unmounted in the primary `server.js` (cleaning up latent dead code).

## 4. Validation
*   [x] File moved to `ppos-core-platform/src/routes/`.
*   [x] Bridge created in `PrintPricePro_Preflight-master/routes/`.
*   [x] No regressions in Product App bootstrap.
