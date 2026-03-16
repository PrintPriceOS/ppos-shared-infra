# Staleness-Based Execution Gates
# PrintPrice OS — Multi-Region Runtime Activation

Execution gates are runtime enforcement points that react to the synchronization health of a region. These gates ensure that stale or isolated regions do not corrupt global state or propagate inconsistent data.

## 1. Thresholds and Modes

| Status | Sync Lag Threshold | Operating Mode | Federated Behavior |
| :--- | :--- | :--- | :--- |
| **HEALTHY** | < 5 minutes | `NORMAL` | Full bi-directional federation; global mutations allowed. |
| **WARNING** | 5 - 30 minutes | `DEGRADED` | Allow local actions; emit warnings; buffer non-critical events. |
| **STALE** | 30m - 2 hours | `STALE` | **Block global mutations**; allow safe local intake/execution. |
| **ISOLATED**| > 2 hours | `ISOLATED` | **Block all outbound federation**; local safety-only mode. |

## 2. Gate Enforcement Rules

### 2.1 Healthy Mode
* All normal operations are permitted subject to standard RBAC and Authority checks.
* Region is considered "In-Sync".

### 2.2 Degraded Mode (Warning)
* **Goal:** Maintain throughput while flagging potential drift.
* **Effect:** Emit `REGIONAL_SYNC_LAG` telemetry.
* **Effect:** Throttle non-critical background synchronization tasks.

### 2.3 Stale Mode
* **Goal:** Prevent "split-brain" divergence.
* **Restriction:** Deny all actions requiring `Authority Region` role (even if this is the authority region).
* **Restriction:** Force `READ_ONLY_POLICY` mode on all governance lookups.
* **Continuity:** Allow local preflight `analyze` and `autofix` to proceed.

### 2.4 Isolated Mode (Failover)
* **Goal:** Contain the failure and operate as a standalone island.
* **Restriction:** Block all outbound FSS event publication (Quarantine mode).
* **Restriction:** Deny any action requiring a fresh global policy cache.
* **Restriction:** Block new printer onboarding or printer-agent heartbeats.

## 3. Recovery Logic

Transitioning back to a "lower" staleness mode requires:
1. **Successful Sync:** Reception of a fresh `GlobalPolicyBundle`.
2. **Heartbeat Restoration:** `RegionStalenessEvaluator` receives a timestamp < 5m old.
3. **Manual Override:** Operators can force-clear isolation via the Control Plane if network health is verified manually.
