# Phase R4 — Ownership Decisions

## 1. Middleware: `printerAuth.js`
*   **Decision**: **`ppos-core-platform`**
*   **Rationale**: While it is used by the Control Plane for onboarding, its primary runtime role is protecting the dispatch/offer handshake (Core Platform). Placing it in Core makes it available to both the platform runtime and the control plane as a shared security component.

## 2. Routes: `connect.js`
*   **Decision**: **`ppos-control-plane`**
*   **Rationale**: This file manages the "Administrative Lifecycle" of a printer (onboarding, profile, machine registry). These are classic Control Plane responsibilities.

## 3. Routes: `reservations.js`
*   **Decision**: **`ppos-core-platform`**
*   **Rationale**: Reservations are a side-effect of the Matchmaking and Dispatch loop, which belongs to the Platform Kernel.

## 4. Split Requirements
*   **None immediate**. The files will be moved whole. Any cross-repository service dependencies (e.g., `connect.js` calling a core service) will be handled via the sibling-repo integration workspace.
