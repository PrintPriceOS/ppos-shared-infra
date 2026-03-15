# Recovery Playbooks
# PrintPrice OS — Multi-Region Consistency (v1.7.0)

This document provides structured procedures for recovering regional state in the event of divergence, data loss, or systemic failure.

## 1. Playbook: Regional State Rebuild

**Scenario**: A region has suffered data corruption or its version store is out of sync with the Global Authority.

**Steps**:
1. **Quarantine Inbound Traffic**: Temporarily disable `/fss/relay` to prevent new conflicts (set region to `DEGRADED`).
2. **Clear Local Projections**: Safely wipe the local materializations (e.g., `printer_nodes` cache).
3. **Reset Version Store**: Delete `.runtime/fss-convergence/versions.json`.
4. **Trigger Replay (Full)**:
   ```javascript
   const { ReplayEngine } = require('@ppos/shared-infra');
   const engine = new ReplayEngine();
   await engine.runReplay({ fromStart: true });
   ```
5. **Verify Convergence**: Compare state fingerprints via `DriftInspector`.

## 2. Playbook: Conflict Resolution (Quarantine Drain)

**Scenario**: Events are stuck in `QuarantineStore` due to `STALE_VERSION` or `STALE_EPOCH`.

**Steps**:
1. **Identify Root Cause**: Check `reason_code` in quarantined JSONs.
2. **Handle Stale Version**:
   * If the event is truly old, mark as `REJECTED_PERMANENT`.
   * If the local state is ahead but incorrect, consider a manual `force: true` apply.
3. **Handle Epoch Conflict**: Analyze if a Failover was missed. Re-align `authority_epoch` if necessary.

## 3. Playbook: Global Re-Sync (Snapshot)

**Scenario**: Regional drift is too high for incremental log replay.

**Steps**:
1. **Fetch Authoritative Snapshot**: Download the state dump from the `logical-authority` region.
2. **Inject Snapshot**:
   * Bulk UPSERT data into local stores.
   * Update `ConflictDetector` versions based on the snapshot metadata.
3. **Resync Log**: Resume `ReplayEngine` from the snapshot's event checkpoint.

## 4. Playbook: Fast Replay Recovery

**Scenario**: System restart requiring quick consistency check.

**Steps**:
1. **Run Fast Replay**:
   ```javascript
   await replayEngine.runReplay({ fastMode: true }); // Skips crypto checks for sealed logs
   ```
2. **Monitor Backlog**: Watch `ppos_fss_outbox_pending_total` to ensure synchronization catch-up.
