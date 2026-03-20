/**
 * @ppos/shared-infra - RegionStalenessEvaluator
 * 
 * Monitors synchronization health and triggers failover modes.
 */
class RegionStalenessEvaluator {
    constructor(config = {}) {
        this.warningThreshold = config.warningThreshold || 300; // 5 mins
        this.staleThreshold = config.staleThreshold || 1800;   // 30 mins
        this.isolatedThreshold = config.isolatedThreshold || 7200; // 2 hours
    }

    /**
     * Evaluates the current state based on the last heartbeat.
     */
    evaluate(lastSyncAt) {
        if (!lastSyncAt) return 'UNKNOWN';

        const lag = (new Date() - new Date(lastSyncAt)) / 1000;

        if (lag < this.warningThreshold) return 'HEALTHY';
        if (lag < this.staleThreshold) return 'WARNING';
        if (lag < this.isolatedThreshold) return 'STALE';
        
        return 'ISOLATED';
    }

    /**
     * Determines if the region should enter degraded mode.
     */
    shouldEnterDegradedMode(status) {
        return ['STALE', 'ISOLATED'].includes(status);
    }
}

module.exports = RegionStalenessEvaluator;
