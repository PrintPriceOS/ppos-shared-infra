# Control Plane Integration
# PrintPrice OS — Multi-Region Runtime Activation

The `ppos-control-plane` now enforces regional authority and staleness gates on all sensitive administrative and federated operations.

## 1. Administrative Guards

A new middleware `requireGovernanceAction(key)` has been added to the control plane to ensure that mutations only occur when and where they are allowed.

### 1.1 Authority-Dependent Actions
The following actions now require the region to be the designated **Authority Region** (e.g., `EU-PPOS-1`) and to have a **Fresh** policy state:

* **Global Mutations:** `quarantineTenant`, `pardonTenant`, `setQueueState`, `flushQueue`, `purgeHistory`.
* **Printer Onboarding:** `registerPrinter`, `addCapability`, `createCredentials`.

### 1.2 Mode-Based Restrictions

| Operating Mode | Mutation Attempt | Result |
| :--- | :--- | :--- |
| **NORMAL (Authority)** | `POST /tenant/quarantine` | **ALLOWED** |
| **NORMAL (Secondary)** | `POST /tenant/quarantine` | **REJECTED** (Non-Authoritative) |
| **DEGRADED (Authority)**| `POST /tenant/quarantine` | **REJECTED** (Region Stale) |
| **READ_ONLY_POLICY** | Any Mutation | **REJECTED** (Stale Region) |
| **EMERGENCY** | Any Mutation | **REJECTED** (Manual Lockdown) |

## 2. API Responses

When a control plane action is blocked by runtime governance, the API returns a deterministic response:

* **Status:** `503 Service Unavailable` (for staleness) or `403 Forbidden` (for authority/emergency).
* **Error Code:** `GOVERNANCE_RUNTIME_BLOCK`.

### Example JSON Payload:
```json
{
  "error": "GOVERNANCE_RUNTIME_BLOCK",
  "message": "This region is currently not allowed to perform this action: non_authoritative_region",
  "mode": "NORMAL",
  "region_id": "US-PPOS-1",
  "decision": {
    "allowed": false,
    "mode": "NORMAL",
    "reason": "non_authoritative_region",
    "region_id": "US-PPOS-1",
    "restriction_source": "PolicyAuthorityResolver"
  }
}
```

## 3. Safe Operations
Read-only operations (e.g., `GET /api/metrics`, `GET /api/governance/policies`, `GET /api/federation/printers`) remain **ALLOWED** in all but the most critical isolation modes, ensuring operators have visibility into the regional state even during outages.
