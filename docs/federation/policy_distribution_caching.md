# Policy Distribution & Caching — PrintPrice OS

## 1. Distribution Flow
Policies are distributed using the **FSS Transport Layer**:
1. `GLOBAL_HUB` signs a `PolicyPublished` event.
2. `OutboxRelay` broadcasts the signed envelope.
3. Regional `FSSReceiver` verifies the signature and stores it in the Inbox.
4. `ReplayEngine` applies the policy to the **Regional Policy Cache**.

## 2. The Regional Policy Cache
Every region maintains a local, high-performance cache of the global policy state.

### Cache Entry Structure
```json
{
  "policy_id": "sla-standard-v5",
  "policy_version": 5,
  "authority_region": "EU-PPOS-1",
  "signature": "...",
  "fetched_at": "2026-03-15T10:00:00Z",
  "valid_until": "2026-03-16T10:00:00Z",
  "status": "FRESH"
}
```

## 3. Cache Status Rules
- **FRESH**: Recently synchronized; used for all governance checks.
- **STALE**: Past the heartbeat window but before the hard expiration. Triggers warnings in the Control Plane.
- **EXPIRED**: Past hard expiration. Region must enter **Emergency Restrictive Mode**.
- **REVOKED**: Policy was explicitly invalidated by the hub.

## 4. Staleness Invariant
A region MUST NOT use a `STALE` policy to grant new capabilities that were previously forbidden. If synchronization is lost, the region defaults to the last known "Safe Restricted State".
