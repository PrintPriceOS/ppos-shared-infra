# Failover Coordination Model — PrintPrice OS

## 1. Resilience Philosophy
PrintPrice OS uses an **Autonomous-Safe Failover** model. Regions should continue local production even if the global authority is unreachable, provided they remain within the last known safety bounds.

## 2. Coordination Modes

| Mode | Trigger | System Behavior |
| :--- | :--- | :--- |
| **NORMAL** | Connectivity OK | Full global synchronization and authority-led updates. |
| **DEGRADED_LOCAL** | Hub Unreachable | Local execution continues using cached policies. No new nodes allowed. |
| **PARTITIONED** | Full Isolation | Emergency local restrictions active. No cross-region coordination. |
| **RECOVERY** | Hub Returns | Automated replay and cache reconciliation to reach global coherence. |

## 3. Failover Scenarios

### Scenario A: Global Hub Offline
- Regional nodes continue processing existing jobs.
- New Global Policy updates are blocked.
- Regions enter `DEGRADED_LOCAL` mode after the heartbeat timeout.

### Scenario B: Regional Partition
- The isolated region remains in `EMERGENCY_RESTRICTIVE_MODE`.
- All global-level state modifications are queued for recovery.

## 4. Split-Brain Prevention
No region outside the designated `GLOBAL_HUB` can promote itself to the authority role without an explicit, signed **AuthorityMigrationRecord** signed by the current authority or a quorum-trusted recovery key.
