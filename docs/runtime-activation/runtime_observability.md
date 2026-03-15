# Runtime Observability & Diagnostic Signals
# PrintPrice OS — Multi-Region Runtime Activation

Observability for runtime governance ensures that operators can identify, debug, and resolve regional synchronization issues and authority conflicts in real-time.

## 1. Federated Runtime Metrics

The following metrics are now emitted by the `MetricsService` (via Prometheus):

| Metric Name | Type | Labels | Description |
| :--- | :--- | :--- | :--- |
| `ppos_runtime_policy_decisions_total` | Counter | `action`, `decision`, `mode`, `region_id` | Total allow/deny decisions by the runtime resolver. |
| `ppos_region_sync_lag_seconds` | Gauge | `region_id` | Current synchronization lag reported by heartbeat tracking. |
| `ppos_governance_rejections_total` | Counter | `reason`, `tenant_id` | Standard governance rejections (merged with runtime blocks). |

## 2. Structured Logging

Every runtime governance block is logged with high-cardinality metadata for deep-dive analysis:

```json
{
  "level": "WARN",
  "msg": "[FEDERATION-BLOCK] Action 'policy_publish' denied: non_authoritative_region",
  "action": "policy_publish",
  "mode": "NORMAL",
  "region_id": "US-PPOS-1",
  "reason": "non_authoritative_region",
  "restriction_source": "PolicyAuthorityResolver",
  "timestamp": "2026-03-15T16:50:00Z"
}
```

## 3. Diagnostics Endpoints

All integrated services surface governance state via their `/diagnostics` or `/ready` endpoints:

### Example: `GET /ready` (Preflight Service)
```json
{
  "status": "READY",
  "governance": {
    "mode": "NORMAL",
    "region_id": "US-PPOS-1",
    "authority_status": "non_authoritative",
    "sync_lag_seconds": 45,
    "cache_status": "FRESH"
  }
}
```

### Example: `GET /api/federation/health/overview` (Control Plane)
Provides a global view of all regional health summaries, exposing which regions are currently operating in `DEGRADED` or `ISOLATED` modes.

## 4. Alerting Guidance

Recommended alerts for runtime governance:

* **Critical: `ppos_region_sync_lag_seconds > 1800`** - Region entering `STALE` mode.
* **Warning: `ppos_runtime_policy_decisions_total{decision="DENIED"} > 10/min`** - High rate of governance rejections.
* **Critical: `ppos_runtime_policy_decisions_total{mode="ISOLATED"}`** - Region has entered failover isolation.
