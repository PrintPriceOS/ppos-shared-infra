# FSS Failover & Degraded Mode — PrintPrice OS

## 1. Resilience Philosophy
PrintPrice OS must remain **Operationally Autonomous** even if global coordination is lost. A region partition should not stop local job processing.

## 2. Partition Scenarios

### Scenario A: Global Control Plane (GGR) Offline
- **Status**: Regional nodes continue running with cached policies.
- **Impact**: New organizations cannot be created; global policies cannot be updated.
- **PPOS Behavior**: Proceed with last known trust scores.

### Scenario B: Regional Partition (Isolated Region)
- **Status**: Region loses connection to the Hub and peers.
- **Impact**: Region cannot publish health metrics or receive global updates.
- **PPOS Behavior**:
  - Continue local `PREFLIGHT` and `WORKER` execution.
  - Queue outgoing FSS events in a **Replay Buffer**.
  - Local Governance enforced via local cache.

### Scenario C: Hub Region Failure
- **Status**: `EU-PPOS-1` goes down entirely.
- **Action**: Secondary region (e.g., `US-PPOS-1`) is promoted to **Interim Hub** for sequence number generation.

## 3. Degraded Mode Matrix

| Function | State: Global Sync Down | State: Region Isolated |
| :--- | :--- | :--- |
| **PDF Preflight** | 🟢 Enabled | 🟢 Enabled |
| **Worker Dispatch** | 🟢 Enabled (Local Pool) | 🟢 Enabled (Local Pool) |
| **SLA Enforcement**| 🟡 Limited (Cached) | 🟡 Limited (Cached) |
| **Org Creation** | ❌ Blocked | ❌ Blocked |
| **Failover Routing** | ❌ Blocked | ❌ Blocked (Traffic is localized) |

## 4. Reconnection & Replay
When a partitioned region returns:
1. **Delta Pull**: RSA retrieves missed sequence numbers from the Hub.
2. **Buffer Flush**: RSA signs and pushes all local events queued during the outage.
3. **Consistency Check**: Hub validates that no conflicting `Policy` entries were used.
