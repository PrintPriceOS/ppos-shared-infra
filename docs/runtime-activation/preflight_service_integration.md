# Preflight Service Integration
# PrintPrice OS — Multi-Region Runtime Activation

The `ppos-preflight-service` has been hardened with runtime governance guards to ensure it behaves correctly during regional failover or isolation.

## 1. Integrated Guards

The following routes now consult the `RuntimePolicyResolver` before execution:

| Route | Action Key | Behavior during Isolation | Behavior during Staleness |
| :--- | :--- | :--- | :--- |
| `POST /analyze` | `local_analyze` | **ALLOWED** | **ALLOWED** |
| `POST /autofix` | `local_autofix` | **ALLOWED** | **ALLOWED** |
| `POST /admin/fss-test/*` | `cross_region_publish` | **BLOCKED** | **BLOCKED** |
| `POST /fss/replicate` | `federated_replication` | **BLOCKED** | **BLOCKED** (Read-Only) |

## 2. Implementation Details

### 2.1 Job Intake Continuity
Standard `analyze` and `autofix` requests are classified as `local_safe` actions. These are allowed even when the region is isolated from the main federation hub, provided no manual emergency lockdown is active.

### 2.2 Error Responses
When a governance block occurs, the service returns a `503 Service Unavailable` (or `403 Forbidden` for emergency lockdowns) with a structured payload:

```json
{
  "ok": false,
  "error": "GOVERNANCE_BLOCK",
  "message": "policy_cache_stale",
  "details": {
    "allowed": false,
    "mode": "DEGRADED",
    "reason": "policy_cache_stale",
    "region_id": "US-PPOS-1",
    "restriction_source": "PolicyCacheManager"
  }
}
```

## 3. Degradation Telemetry
Every governance decision is recorded via the `MetricsService` and emitted to the `governance_audit` table, allowing operators to see real-time impact of regional staleness on service availability.
