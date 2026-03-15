# State Application Contracts
# PrintPrice OS — Multi-Region Consistency

This document defines the field-level requirements for events targeting the Federated State Convergence layer.

## 1. Required Envelope Fields (v1.6)

All events must include these headers to be eligible for deterministic convergence:

| Field | Type | Description |
| :--- | :--- | :--- |
| `event_id` | UUID | Unique identifier for idempotency. |
| `event_type` | String | Logic handler identifier (e.g., `PolicyPublished`). |
| `origin_region`| String | Region ID of the publisher. |
| `authority_epoch`| Integer| Current authority era (increments on failover). |
| `state_version` | Integer| Monotonic version of the target entity. |
| `entity_type` | String | Class of object being updated (e.g., `printer`). |
| `entity_id` | String | Unique ID of the object being updated. |
| `occurred_at` | ISO8601| Event generation timestamp. |
| `signature` | Base64 | Ed25519 signature of the above. |

## 2. Decision Logic

The `FederatedStateApplier` returns the following deterministic statuses:

* **`APPLIED`**: Transition successful; local state updated.
* **`SKIPPED_DUPLICATE`**: Event already applied; no change necessary.
* **`REJECTED_CONFLICT`**: Version or Epoch mismatch; potentially stale data.
* **`REJECTED_UNAUTHORIZED`**: Sender lacked permissions.
* **`FAILED`**: Internal error during reducer execution.

## 3. Reducer Idempotency Rules

When implementing new event handlers:
1. **No External Side Effects**: Reducers should only update internal state (DB/Cache). External calls (Email, API) must be handled by non-federated listeners.
2. **Deterministic Sort**: If multiple sub-collections are updated, sort them before persistence.
3. **Atomic Commit**: State update and version increment must be part of the same transaction.
