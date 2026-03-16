# Worker Execution Integration
# PrintPrice OS — Multi-Region Runtime Activation

The `ppos-preflight-worker` has been integrated with the federated runtime layer to ensure execution compliance across multiple regions.

## 1. Governance Guard Points

The worker now evaluates runtime rules at the start of every job processing cycle.

### 1.1 Pre-Execution Guard (Phase 24.C)
Before allocating local resources or starting the preflight engine, the worker calls `runtimePolicyResolver.isActionAllowed()`.

* **Operation: `analyze`** maps to `local_analyze`.
* **Operation: `autofix`** maps to `local_autofix`.

### 1.2 Execution Decision Matrix

| Region Mode | Action | Result |
| :--- | :--- | :--- |
| **NORMAL** | Any Job | **ALLOWED** |
| **DEGRADED** | Safe Local Job | **ALLOWED** |
| **STALE** | High-Risk Job | **BLOCKED** |
| **ISOLATED** | Local Job | **ALLOWED** (Continuity Mode) |
| **ISOLATED** | Global Dependency Job | **BLOCKED** |
| **EMERGENCY** | Restricted Job | **BLOCKED** (Immediate Rejection) |

## 2. Fail-Safe Behavior

If the `RuntimePolicyResolver` denies an action, the worker:
1. Logs a `[FEDERATION-BLOCK]` warning.
2. Throws a `Federated Runtime Restriction` error.
3. BullMQ markers the job as failed (or retries based on strategy).
4. No local resources (CPU/Memory/Subprocesses) are initialized for the blocked job.

## 3. Observability

Workers include the following metadata in their audit logs:
* `execution_mode`: The mode at the time of execution (e.g., `DEGRADED`).
* `region_id`: The ID of the executing region.
* `governance_reason`: The specific reason for allow/deny decisions.

This ensures that "split-brain" behaviors or regional isolation issues are immediately visible in the central control plane logs once connectivity is restored.
