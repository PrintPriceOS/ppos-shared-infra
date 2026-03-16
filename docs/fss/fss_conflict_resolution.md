# FSS Conflict Resolution Model — PrintPrice OS

## 1. Conflict Domains

| Entity | Consistency Model | Resolution Strategy |
| :--- | :--- | :--- |
| **Org Membership** | Strong | **Global Authority Wins**. Only the Genesis region can update specific org roots. |
| **Governance Policies** | Strong | **Sequence Number Wins**. Stale policies are rejected. |
| **Printer Trust** | Eventual | **Monotonic Downgrade**. Any region can flag a printer as suspicious; only the Hub can clear it. |
| **Health Metrics** | Eventual | **LWW (Last Writer Wins)**. Metrics from 10s ago are ignored for new ones. |
| **Routing Prefs** | Single-Writer | **Origin Region Wins**. US region decides US routing. |

## 2. Global Authority Rules (GAR)

For `GLOBAL` entities, we implement a **Deterministic Precedence** model:
1. **Hub Override**: In case of a split-brain between regions, the state in `EU-PPOS-1` (default hub) is considered canonical for organizational metadata.
2. **Signature Validity**: An event with a valid signature from `OriginRegion` beats an unsigned or invalid event, regardless of timestamp.
3. **Causality Tracking**: Each event includes a `parent_event_id`. If a node receives an event with a missing parent, it triggers a **Sync Replay**.

## 3. Conflict Resolution Flow

1. **Detection**: `RSA` receives two different states for `entity_id` with overlapping timestamps.
2. **Verification**: Check signatures and sequence numbers.
3. **Application**:
   - If `GLOBAL_POLICY`: Apply the one with the higher sequence number.
   - If `DYNAMIC_TELEMETRY`: Apply LWW.
   - If `SECURITY_TRUST`: Apply **Pessimistic Merge** (if one region says "suspicious", the node is "suspicious" globally).

## 4. Remediation: Replay & Reconciliation
If a region is partitioned for > 1 hour, it must perform a **Full State Reconciliation** upon reconnection, pulling the latest `GGR Snapshot` and overlaying it on local state.
