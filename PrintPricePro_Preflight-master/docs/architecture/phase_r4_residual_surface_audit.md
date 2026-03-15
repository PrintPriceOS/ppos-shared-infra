# Phase R4 — Residual Surface Audit

## 1. Component Classification

| Component | Responsibility | Current Path | Canonical Owner | Classification | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Printer Auth Middleware** | Authenticates Printer Nodes via API Key. | `middleware/printerAuth.js` | `ppos-core-platform` | `MOVE_TO_PPOS_CORE_PLATFORM` | Medium |
| **Printer Connect API** | Printer onboarding, registry, and capacity. | `routes/connect.js` | `ppos-control-plane` | `MOVE_TO_PPOS_CONTROL_PLANE` | Medium |
| **Reservations API** | Manual capacity reservation management. | `routes/reservations.js` | `ppos-core-platform` | `MOVE_TO_PPOS_CORE_PLATFORM` | Low |

## 2. Detailed Audit

### 2.1 `middleware/printerAuth.js`
*   **Actual Behavior**: Validates `x-printer-api-key` against `printer_nodes` table in DB.
*   **Violation**: Product App should not own printer-facing authentication logic.
*   **Dependencies**: `services/db`, `crypto`.
*   **Decision**: Move to `ppos-core-platform`. It is a runtime security boundary.

### 2.2 `routes/connect.js`
*   **Actual Behavior**: Endpoints for partner-side registration and capacity sync.
*   **Violation**: Partner connectivity and configuration belongs to the Control Plane.
*   **Dependencies**: `connectService`, `printerRegistry`, `capacityService`, `printerAuth`.
*   **Decision**: Move to `ppos-control-plane`. This is the printer-side "Control" surface.

### 2.3 `routes/reservations.js`
*   **Actual Behavior**: Endpoints for job-to-printer capacity locking.
*   **Violation**: Reservations are a platform-level orchestration state, not a product feature.
*   **Dependencies**: `reservationService`, `db`.
*   **Decision**: Move to `ppos-core-platform`.

## 3. Extraction Strategy
1.  **Splitting**: No immediate splits required for logic, but `server.js` mounts must be updated.
2.  **Bridges**: Thin bridges will be left in `routes/` to ensure the Product BFF still responds to these legacy paths while they are fully migrated in the client.
