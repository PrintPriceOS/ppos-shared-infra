# Phase R4 — Compatibility Bridges

The following bridges have been established in the Product App (`PrintPricePro_Preflight-master`) to maintain stability while the client transitions to the new canonical endpoints.

## 1. Middleware: `middleware/printerAuth.js`
*   **Type**: `REEXPORT_DELEGATE`
*   **Canonical Path**: `ppos-core-platform/src/middleware/printerAuth.js`
*   **Purpose**: Protects runtime printer endpoints (`/api/printer-offers`) and legacy `/api/connect` routes.

## 2. Route: `routes/connect.js`
*   **Type**: `REEXPORT_DELEGATE`
*   **Canonical Path**: `ppos-control-plane/src/routes/connect.js`
*   **Purpose**: Maintains the `/api/connect` surface for printer onboarding and registry.

## 3. Route: `routes/reservations.js`
*   **Type**: `REEXPORT_DELEGATE`
*   **Canonical Path**: `ppos-core-platform/src/routes/reservations.js`
*   **Purpose**: Maintains the `/api/reservations` surface for manual capacity management.

## bridge Retirement Plan
These bridges should be removed in **Phase 26** once the Product BFF has been fully refactored to use service-to-service communication or once the front-end has been updated to point directly to the Control Plane / Core Platform IPs.
