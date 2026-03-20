const FederatedStateApplier = require('./FederatedStateApplier');
const ReplayEngine = require('./ReplayEngine');
const driftInspector = require('./DriftInspector');
const quarantineStore = require('./QuarantineStore');
const convergenceLedger = require('./ConvergenceLedger');

/**
 * RegionalRecoveryService (Phase v1.8.0)
 * 
 * Automates recovery procedures for regional state convergence.
 */
class RegionalRecoveryService {
    
    /**
     * Executes a full regional state rebuild.
     */
    async fullRebuild(options = {}) {
        console.warn('[RECOVERY] Initializing FULL REBUILD...');
        
        // 1. Wipe local materialized state (if integrated)
        // This usually involves triggering domain-specific 'wipe' events or clearing DBs
        
        // 2. Trigger Replay from start
        const engine = new ReplayEngine();
        await engine.runReplay({ force: true, fromStart: true });
        
        console.log('[RECOVERY] Full Rebuild Completed.');
        return { status: 'COMPLETED', fingerprint: driftInspector.generateStateDigest().state_fingerprint };
    }

    /**
     * Retries apply for all retryable quarantined events.
     */
    async drainQuarantine() {
        console.log('[RECOVERY] Draining Quarantine...');
        const items = await quarantineStore.list();
        let drained = 0;
        let failed = 0;

        for (const item of items) {
            if (!item.retryable || item.resolution_status !== 'PENDING') continue;

            const result = await FederatedStateApplier.apply(item.envelope, { force: true });
            if (result.status === 'APPLIED') {
                await quarantineStore.remove(item.event_id);
                drained++;
            } else {
                failed++;
            }
        }

        return { drained, failed };
    }

    /**
     * Performs a drift consistency check and returns results.
     */
    async checkConsistency(remoteDigest) {
        const drift = driftInspector.inspectDrift(remoteDigest);
        if (drift.has_drift) {
            console.warn('[RECOVERY] DRIFT DETECTED!', drift);
            await convergenceLedger.recordDriftDetected(drift);
        }
        return drift;
    }
}

module.exports = new RegionalRecoveryService();
