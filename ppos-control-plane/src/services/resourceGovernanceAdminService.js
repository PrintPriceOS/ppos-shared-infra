// ppos-control-plane/src/services/resourceGovernanceAdminService.js
const db = require('./db');
const redis = require('./redis');
const Keys = require('../../ppos-shared-infra/packages/governance/resourceKeys');
const MetricsService = require('./metricsService');

/**
 * ResourceGovernanceAdminService (Phase 20.F)
 * Provides detailed resource usage and capacity analytics for the Control Plane.
 */
class ResourceGovernanceAdminService {
    /**
     * Get global resource governance overview
     */
    static async getGlobalOverview() {
        // 1. Get Base Metrics (Throttled, Denied, Delayed from Audit Logs)
        const baseMetrics = await MetricsService.getGovernanceMetrics('24h');
        
        // 2. Get Hot Operational Stats from Redis
        const keys = await redis.keys('ppos:tenant:*:concurrency:active');
        let totalActiveConcurrency = 0;
        const tenantConcurrency = {};

        for (const key of keys) {
            const tenantId = key.split(':')[2];
            const val = await redis.get(key);
            const count = parseInt(val || 0);
            totalActiveConcurrency += count;
            tenantConcurrency[tenantId] = count;
        }

        // 3. Scan for active leases (Health Panel)
        let leaseCount = 0;
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'ppos:job:*:capacity_lease', 'COUNT', 100);
            cursor = nextCursor;
            leaseCount += keys.length;
        } while (cursor !== '0');

        return {
            ...baseMetrics,
            totalActiveConcurrency,
            totalActiveLeases: leaseCount,
            leaseDrift: totalActiveConcurrency - leaseCount, // Important health metric
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get list of tenants with their current resource usage
     */
    static async getTenantsUsage() {
        // 1. Fetch all tenants with configured limits from DB
        const sql = `
            SELECT t.*, 
                   (SELECT COUNT(*) FROM jobs WHERE tenant_id = t.tenant_id AND status = 'QUEUED') as db_queue_depth
            FROM tenant_resource_limits t
            WHERE is_enabled = 1
        `;
        const { rows: tenants } = await db.query(sql);

        const results = [];
        for (const t of tenants) {
            const tenantId = t.tenant_id;
            
            // 2. Fetch Hot State from Redis
            const now = Date.now();
            const minuteKey = Keys.jobsWindow(tenantId, 'minute', now);
            const concurrencyKey = Keys.concurrency(tenantId);
            const depthKey = Keys.queueDepth(tenantId, 'default');

            const [jpm, concurrency, redisDepth] = await Promise.all([
                redis.get(minuteKey),
                redis.get(concurrencyKey),
                redis.get(depthKey)
            ]);

            results.push({
                tenantId,
                planTier: t.plan_tier,
                priorityClass: t.priority_class,
                limits: {
                    maxConcurrency: t.max_concurrent_jobs,
                    maxJpm: t.max_jobs_per_minute,
                    maxDepth: t.max_queue_depth
                },
                usage: {
                    activeConcurrency: parseInt(concurrency || 0),
                    jobsThisMinute: parseInt(jpm || 0),
                    queueDepth: parseInt(redisDepth || 0),
                    dbQueueDepth: t.db_queue_depth
                },
                saturation: {
                    concurrency: (parseInt(concurrency || 0) / t.max_concurrent_jobs) * 100,
                    throughput: (parseInt(jpm || 0) / t.max_jobs_per_minute) * 100,
                    depth: (parseInt(redisDepth || 0) / t.max_queue_depth) * 100
                }
            });
        }

        return results;
    }

    /**
     * Get detailed resource analytics for a specific tenant
     */
    static async getTenantDetail(tenantId) {
        // 1. Get Limits and Overrides
        const sql = `SELECT * FROM tenant_resource_limits WHERE tenant_id = ?`;
        const overrideSql = `SELECT * FROM tenant_resource_overrides WHERE tenant_id = ? AND expires_at > NOW()`;
        
        const [{ rows: limits }, { rows: overrides }] = await Promise.all([
            db.query(sql, [tenantId]),
            db.query(overrideSql, [tenantId])
        ]);

        if (limits.length === 0) throw new Error('Tenant configuration not found');

        // 2. Get Recent Resource Events (last 50)
        const auditSql = `
            SELECT * FROM governance_audit 
            WHERE target_id = ? AND action_type LIKE 'RESOURCE_GOVERNANCE_%'
            ORDER BY created_at DESC LIMIT 50
        `;
        const { rows: events } = await db.query(auditSql, [tenantId]);

        // 3. Get Active Leases for this tenant
        const activeLeases = [];
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'ppos:job:*:capacity_lease', 'COUNT', 100);
            cursor = nextCursor;
            for (const key of keys) {
                const lease = await redis.hgetall(key);
                if (lease && lease.tenantId === tenantId) {
                    activeLeases.push({
                        jobId: lease.jobId,
                        reservedAt: lease.reservedAt,
                        ttl: lease.ttl
                    });
                }
            }
        } while (cursor !== '0');

        return {
            tenantId,
            config: limits[0],
            overrides,
            usage: await this.getTenantHotUsage(tenantId),
            recentEvents: events,
            activeLeases,
            summary: {
                totalEvents24h: events.length,
                isSaturated: false // Logic to calculate baseline
            }
        };
    }

    static async getTenantHotUsage(tenantId) {
        const now = Date.now();
        const minuteKey = Keys.jobsWindow(tenantId, 'minute', now);
        const hourKey = Keys.jobsWindow(tenantId, 'hour', now);
        const concurrencyKey = Keys.concurrency(tenantId);
        
        const [jpm, jph, concurrency] = await Promise.all([
            redis.get(minuteKey),
            redis.get(hourKey),
            redis.get(concurrencyKey)
        ]);

        return {
            jobsThisMinute: parseInt(jpm || 0),
            jobsThisHour: parseInt(jph || 0),
            activeConcurrency: parseInt(concurrency || 0)
        };
    }
}

module.exports = ResourceGovernanceAdminService;
