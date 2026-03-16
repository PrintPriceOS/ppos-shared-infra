# Authority-Aware Event Publication
# PrintPrice OS — Multi-Region Runtime Activation

Event publication into the Federated State Sync (FSS) outbox is now governed by runtime authority rules. This prevents non-authoritative regions from inadvertently publishing global state changes.

## 1. Governance Rules for Publication

The `FSSAdapter` now intercepts all `publishGlobalEvent` calls and validates the event name against the current regional mode and authority status.

| Event Name | Logic Guard | Authority Required | Allowed in Stale Mode |
| :--- | :--- | :---: | :---: |
| `PolicyPublished` | `policy_publish` | **YES** | **NO** |
| `PrinterNodeRegistered` | `printer_onboarding` | **YES** | **NO** |
| `RegionHealthSummaryPublished` | `health_status_pub` | **NO** | **YES** |
| `FederatedMatchResult` | `cross_region_publish` | **NO** | **NO** |

## 2. Decision Metadata Enrichment

Every published event now contains a `runtime_governance` object in its envelope. This allows downstream consumers (and the outbox relay) to verify that the publishing region was in a valid state at the time of publication.

### Example FSS Envelope Metadata:
```json
{
  "event_id": "892a...",
  "event_name": "PolicyPublished",
  "origin_region": "EU-PPOS-1",
  "runtime_governance": {
    "mode": "NORMAL",
    "authority": "authoritative",
    "decision": "allowed",
    "reason": "normal_operation"
  },
  "payload": { ... }
}
```

## 3. Publication Blocking

If a publication attempt is denied (e.g., a secondary region trying to publish a policy), the `FSSAdapter`:
1. Blocks the event from reaching the local outbox.
2. Logs a `PUBLISH_DENIED` error.
3. Returns `{ ok: false, error: "Governance publication block..." }`.

This ensures that only "legal" events ever enter the FSS transport layer, significantly reducing the risk of split-brain propagation.

## 4. FSS Compatibility
The `runtime_governance` metadata is preserved throughout the FSS lifecycle, ensuring that even after signed envelope exchange is activated, the governance context remains auditable.
