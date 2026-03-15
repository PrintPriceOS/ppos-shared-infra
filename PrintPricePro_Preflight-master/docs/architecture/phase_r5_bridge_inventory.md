# Phase R5 — Bridge Inventory

This inventory documents all compatibility bridges currently residing in the Product App (`PrintPricePro_Preflight-master`) that act as transitional shims to the canonical PrintPrice OS repositories.

## 1. Inventory List

| Bridge Name | Path in Product App | Canonical Destination | Bridge Type | Risk | Readiness |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Policy Engine Bridge** | `services/policyEngine.js` | `ppos-governance-assurance/src/policyEngine.js` | Delegation Adapter | Medium | `REMOVE_AFTER_IMPORT_UPDATE` |
| **Platform Kernel Bridge** | `kernel/index.js` | `ppos-core-platform/src/kernel/index.js` | Re-export shim | Low | `REMOVE_NOW` |
| **Job Manager Bridge** | `services/jobManager.js` | `ppos-core-platform/src/registry/jobManager.js` | Delegation Adapter | Low | `REMOVE_NOW` |
| **Printer Auth Bridge** | `middleware/printerAuth.js` | `ppos-core-platform/src/middleware/printerAuth.js` | Middleware Shim | Medium | `REMOVE_AFTER_IMPORT_UPDATE` |
| **Connect Route Bridge** | `routes/connect.js` | `ppos-control-plane/src/routes/connect.js` | Route Delegation | Medium | `REMOVE_AFTER_IMPORT_UPDATE` |
| **Reservations Route Bridge** | `routes/reservations.js` | `ppos-core-platform/src/routes/reservations.js` | Route Delegation | Low | `REMOVE_NOW` |

## 2. Details

### 2.1 Policy Engine Bridge
*   **Purpose**: Allows V2 Preflight routes to evaluate policies using the extracted engine.
*   **Consumers**: `routes/preflightV2.js`, `services/internal/reportCore.js`.
*   **Removal Strategy**: Update imports in consumers to point to `@ppos/governance-assurance` (or relative path).

### 2.2 Platform Kernel Bridge
*   **Purpose**: Legacy path for initial monolith kernel calls.
*   **Consumers**: None found in primary code.
*   **Removal Strategy**: Safe to delete.

### 2.3 Job Manager Bridge
*   **Purpose**: Delegated job state transitions.
*   **Consumers**: None found in primary code (Job processing moved to OS).
*   **Removal Strategy**: Safe to delete.

### 2.4 Printer Auth Bridge
*   **Purpose**: Legacy path for printer-facing authentication in `server.js`.
*   **Consumers**: `server.js`.
*   **Removal Strategy**: Update `server.js` to point to canonical location.

### 2.5 Connect / Reservations Bridges
*   **Purpose**: Maintain `/api/connect` and `/api/reservations` endpoints at the Product App IP.
*   **Consumers**: `server.js`.
*   **Removal Strategy**: Cut over `server.js` mounts or remove if endpoints should be accessed via the OS directly.
