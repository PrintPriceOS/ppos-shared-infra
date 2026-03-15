# Runtime Decision Surface Audit
# PrintPrice OS — Multi-Region Runtime Activation

This document identifies the critical execution surfaces where runtime governance, regional authority, and policy cache freshness must be enforced.

## 1. Action Classification Matrix

| Action Name | Primary Service | Normal Mode | Degraded Mode | Authority Region Only | Fresh Policy Cache Required | Emergency Lockdown Effect |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Job Intake** | Preflight Service | ALLOWED | ALLOWED | NO | NO | ALLOWED (Local Only) |
| **Job Execution (Standard)** | Preflight Worker | ALLOWED | ALLOWED | NO | NO (Grace Period) | ALLOWED |
| **Job Execution (Risky)** | Preflight Worker | ALLOWED | BLOCKED | NO | YES | BLOCKED |
| **Policy Publication** | Control Plane | ALLOWED | BLOCKED | YES | YES | BLOCKED |
| **Printer Onboarding** | Control Plane | ALLOWED | BLOCKED | YES | YES | BLOCKED |
| **Global Mutation** | Control Plane | ALLOWED | BLOCKED | YES | YES | BLOCKED |
| **Cross-Region Event Pub** | Federation | ALLOWED | BLOCKED | NO | YES | BLOCKED |
| **Health Summary Pub** | Shared Infra | ALLOWED | ALLOWED | NO | NO | ALLOWED |
| **Quarantine Decision** | Worker/Service | ALLOWED | ALLOWED | NO | NO | ALWAYS ALLOWED |
| **Admin Diagnostics** | All Services | ALLOWED | ALLOWED | NO | NO | ALLOWED |

## 2. Decision Surface Definitions

### 2.1 Preflight Service Intake
* **Action:** `POST /analyze`, `POST /autofix`
* **Constraint:** If the region is in `EMERGENCY_RESTRICTIVE` mode, intake may be restricted to specific high-priority tenants or local-only paths.
* **Degraded Behavior:** Continue accepting jobs to prevent upstream backpressure, but flag them as "Degraded Execution".

### 2.2 Preflight Worker Execution
* **Action:** PDF Analysis, Autofix Subprocess execution.
* **Constraint:** Workers must check if the job "risky" profile matches the current `RestrictionOverlay`.
* **Degraded Behavior:** Block executions that require real-time validation against a central authority if communication is lost.

### 2.3 Control Plane Mutations
* **Action:** `POST /api/governance/policy`, `POST /api/federation/register-printer`
* **Constraint:** **Strict Authority Check.** Only the designated Authority Region can mutate global state.
* **Degraded Behavior:** Switch to READ_ONLY_POLICY mode. Deny all mutation requests with `STALE_REGION_ERROR`.

### 2.4 Federated Event Publication (FSS)
* **Action:** Sending events to the Outbox for propagation.
* **Constraint:** Block global event types (e.g., `PolicyUpdated`) if not in an authoritative state.
* **Degraded Behavior:** Buffer non-critical events, drop or quarantine critical authority-dependent events.

## 3. Runtime Modes Summary

| Mode | Authority | Staleness | Effect |
| :--- | :---: | :---: | :--- |
| **NORMAL** | Yes/No | Fresh | All local and global actions allowed (per RBAC). |
| **DEGRADED** | No | Stale | Block global mutations; allow local job continuity. |
| **READ_ONLY_POLICY** | No | Stale | Explicitly block all policy changes; treat cache as immutable. |
| **EMERGENCY_RESTRICTIVE** | Any | Any | Apply restrictive overlay; block all but essential safety actions. |
| **ISOLATED** | No | Critical | Treat region as standalone; block all outbound federation. |

## 4. Implementation Path

1. **Integrated Guard:** Every controller/handler identified above must call `RuntimePolicyResolver.isActionAllowed(action)`.
2. **Deterministic Response:** Rejections must return 403 or 503 with a structured `GovernanceDecision` payload.
3. **Audit Log:** Every governance decision (allowed or denied) must be emitted to the `governance_audit` table.
