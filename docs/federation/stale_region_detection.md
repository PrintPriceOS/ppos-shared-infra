# Stale Region Detection — PrintPrice OS

## 1. Detection Mechanism
A region is considered **STALE** when its local policy cache or event stream lags significantly behind the expected global heartbeat.

## 2. Staleness Signals
The `RegionStalenessEvaluator` monitors:
- **`last_heartbeat_at`**: Latest ping from the Global Hub.
- **`max_replication_lag`**: Time elapsed since the last received `PolicyPublished` event.
- **`authority_ttl`**: Remaining validity of the current `PolicyAuthorityRecord`.

## 3. Evaluator State Machine
- **HEALTHY**: Lag < 300s. Normal operations.
- **WARNING**: Lag 300s - 1800s. Alert triggered in Cockpit.
- **STALE**: Lag > 1800s. Region enters `DEGRADED_LOCAL_EXECUTION`.
- **ISOLATED**: Heartbeat lost > 2 hours. Mandatory cross-region disconnect.

## 4. Stale-Gate Execution
Service requests must check the regional health status before proceeding:
```javascript
if (regionHealth.status === 'STALE') {
    // Only allow operations that don't require fresh global state
    return runInRestrictedMode(request);
}
```
This ensures that "ghost" policies from an isolated region don't lead to governance violations.
