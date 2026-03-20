// ppos-shared-infra/packages/governance/resourceUsageReconciler.js
const Keys = require('./resourceKeys');
const redis = require('../data/redis');
const featureFlagService = require('./FeatureFlagService');

/**
 * ResourceUsageReconciler (Phase 20.B.5)
 * Periodically detects and repairs capacity drift and expired leases.
 */
class ResourceUsageReconciler {
    /**
     * Run a full reconciliation cycle
     */
    static async run() {
        process.stdout.write('[RESOURCE-RECONCILER] Starting cycle...\n');
        
        try {
            // 1. Repair Concurrency Drift via active leases
            await this.recalculateAllConcurrency();
            
            // 2. Materialize usage snapshots to MySQL (Phase 22.E.2) - Guarded by Feature Flag (22.G)
            if (await featureFlagService.isEnabled('MATERIALIZATION_ENABLED')) {
                await this.syncSnapshotsToDb();
            }
            
            process.stdout.write('[RESOURCE-RECONCILER] Cycle completed successfully.\n');
        } catch (err) {
            console.error('[RESOURCE-RECONCILER] Critical failure during cycle:', err.message);
        }
    }

    /**
     * Repositories of active capacity.
     */
    static async recalculateAllConcurrency() {
        // Phase 22.E.1: Use the optimized set instead of SCAN
        const activeTenants = await redis.smembers('ppos:active_tenants');
        if (activeTenants.length === 0) return;

        const tenantActualConcurrency = {};

        // 1. Scan LEASES to find current REALITY
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'ppos:job:*:capacity_lease', 'COUNT', 200);
            cursor = nextCursor;

            for (const leaseKey of keys) {
                const lease = await redis.hgetall(leaseKey);
                if (lease && lease.tenantId) {
                    tenantActualConcurrency[lease.tenantId] = (tenantActualConcurrency[lease.tenantId] || 0) + 1;
                }
            }
        } while (cursor !== '0');

        // 2. Reconcile with COUNTERS
        for (const tenantId of activeTenants) {
            const counterKey = Keys.concurrency(tenantId);
            const actual = tenantActualConcurrency[tenantId] || 0;
            const current = parseInt(await redis.get(counterKey)) || 0;

            if (current !== actual) {
                process.stdout.write(`[RECONCILER] Repairing drift for ${tenantId}: ${current} -> ${actual}\n`);
                await redis.set(counterKey, actual);
            }

            // If a tenant is totally idle, we can remove it from 'ppos:active_tenants' for next cycle
            if (actual === 0 && current === 0) {
                const jpm = await redis.get(Keys.jobsWindow(tenantId, 'minute', Date.now()));
                if (!jpm) await redis.srem('ppos:active_tenants', tenantId);
            }
        }
    }

    /**
     * Materializes Redis hot counters into MySQL for long-term reporting (Phase 22.E.2)
     */
    static async syncSnapshotsToDb() {
        const activeTenants = await redis.smembers('ppos:active_tenants');
        const now = new Date();
        const db = require('../data/db');

        for (const tenantId of activeTenants) {
            // We sync the 'hour' window specifically
            const hourKey = Keys.jobsWindow(tenantId, 'hour', now);
            const jobsHour = parseInt(await redis.get(hourKey)) || 0;
            const costHour = parseFloat(await redis.get(Keys.aiBudget(tenantId, 'cost', 'hour', now))) || 0;
            const tokensHour = parseInt(await redis.get(Keys.aiBudget(tenantId, 'tokens', 'hour', now))) || 0;

            if (jobsHour === 0 && costHour === 0) continue;

            const periodStart = new Date(now);
            periodStart.setMinutes(0, 0, 0);

            const sql = `
                INSERT INTO tenant_resource_usage (
                    id, tenant_id, period_type, period_start, jobs_enqueued, ai_tokens_used, ai_cost_used
                ) VALUES (?, ?, 'hour', ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    jobs_enqueued = VALUES(jobs_enqueued),
                    ai_tokens_used = VALUES(ai_tokens_used),
                    ai_cost_used = VALUES(ai_cost_used)
            `;

            await db.query(sql, [
                `${tenantId}_hour_${periodStart.getTime()}`,
                tenantId,
                periodStart,
                jobsHour,
                tokensHour,
                costHour
            ]);
        }
    }
}

module.exports = ResourceUsageReconciler;
