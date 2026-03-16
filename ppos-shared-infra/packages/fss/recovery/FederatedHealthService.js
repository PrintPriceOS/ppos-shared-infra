/**
 * PrintPrice OS — Federated Health Service
 * 
 * Aggregates regional metrics for visibility in the Control Plane.
 */
class FederatedHealthService {
    constructor(dependencies) {
        this.redis = dependencies.redis;
        this.checkpointStore = dependencies.checkpointStore;
        this.inboxStore = dependencies.inboxStore;
        this.regionId = process.env.PPOS_REGION_ID || 'unknown-region';
    }

    /**
     * Get a consolidated health report for the region.
     */
    async getHealthReport() {
        const diagnostics = {
            region: this.regionId,
            status: 'HEALTHY',
            timestamp: new Date().toISOString(),
            metrics: {}
        };

        try {
            // 1. Quaratine stats
            const quarantineCount = await this.redis.get(`ppos:fss:quarantine:count:${this.regionId}`) || 0;
            diagnostics.metrics.quarantine_backlog = parseInt(quarantineCount);

            // 2. Convergence version
            const currentVersion = await this.redis.get(`ppos:fss:version:${this.regionId}`) || 0;
            diagnostics.metrics.last_applied_version = parseInt(currentVersion);

            // 3. Replay Lag (Conceptual check against authority version if available)
            const authorityVersion = await this.redis.get('ppos:fss:authority:version') || currentVersion;
            diagnostics.metrics.replay_lag = Math.max(0, parseInt(authorityVersion) - parseInt(currentVersion));

            // 4. Last Checkpoint
            const domains = ['tenant', 'policy', 'printer'];
            diagnostics.checkpoints = {};
            for (const domain of domains) {
                const cp = await this.checkpointStore.getCheckpoint(this.regionId, domain);
                if (cp) {
                    diagnostics.checkpoints[domain] = cp.checkpoint_at;
                }
            }

            // Status Logic
            if (diagnostics.metrics.quarantine_backlog > 10 || diagnostics.metrics.replay_lag > 50) {
                diagnostics.status = 'DEGRADED';
            }
            if (diagnostics.metrics.quarantine_backlog > 50) {
                diagnostics.status = 'CRITICAL';
            }

        } catch (e) {
            diagnostics.status = 'ERROR';
            diagnostics.error = e.message;
        }

        return diagnostics;
    }
}

module.exports = FederatedHealthService;
