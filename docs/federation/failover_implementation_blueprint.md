# Failover Implementation Blueprint — PrintPrice OS

## 1. Component Hierarchy

### A. `PolicyAuthorityResolver`
- **Role**: Determines which region has the right to sign policies for a given namespace.
- **Data Source**: `PolicyAuthorityRecord`.

### B. `PolicyCacheManager`
- **Role**: Manages the local TTL, persistent storage, and verification of global policies.
- **Invariants**: Purges expired/revoked cache entries immediately.

### C. `RegionStalenessEvaluator`
- **Role**: Heartbeat monitor that sets the regional "Operation Mode" (NORMAL vs DEGRADED).

### D. `EmergencyRestrictionManager`
- **Role**: Overlay that applies ONLY restrictive rules when in DEGRADED mode.

## 2. Interaction Flow
1. **FSS Inbox** receives a `PolicyPublished` event.
2. **ReplayEngine** calls `PolicyCacheManager.update(event)`.
3. **Manager** calls `PolicyAuthorityResolver.isAuthorized(event.origin_region)`.
4. If authorized, **Manager** verifies signature via `EventSigner.verify`.
5. If valid, cache is updated and the `StalenessEvaluator` resets the heartbeat.

## 3. Storage Dependencies
- **Policy Cache**: JSONL file in `.runtime/governance/cache.jsonl`.
- **Authority Record**: Single JSON file in `.runtime/governance/authority.json`.
- **Staleness State**: In-memory with persistent heartbeat log.

## 4. MVP Implementation Order
1. **Resolver & Cache Manager**: Enable basic authority checks.
2. **Staleness Evaluator**: Implement the mode-switching logic.
3. **Emergency Restriction Manager**: Implement the restrictive overlay hooks.
