const db = require('./db');
const redis = require('./redis');
const Keys = require('../../ppos-shared-infra/packages/governance/resourceKeys');

class MetricsService {
    static async getGlobalOverview(range = '24h') {
        const interval = this.getInterval(range);
        
        const sql = `
            SELECT 
                COUNT(*) as total_jobs,
                SUM(CASE WHEN status = 'SUCCEEDED' THEN 1 ELSE 0 END) as successful_jobs,
                SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_jobs,
                COALESCE(SUM(m.hours_saved), 0) as total_hours_saved,
                COALESCE(SUM(m.value_generated), 0) as total_value_generated,
                COALESCE(AVG(m.risk_score_before), 0) as avg_risk_before,
                COALESCE(AVG(m.risk_score_after), 0) as avg_risk_after
            FROM jobs j
            LEFT JOIN metrics m ON m.job_id = j.id
            WHERE j.created_at >= NOW() - ${interval}
        `;
        
        const { rows } = await db.query(sql);
        const stats = rows[0] || {};
        
        const total = parseInt(stats.total_jobs || 0);
        const success = parseInt(stats.successful_jobs || 0);
        
        return {
            totalJobs: total,
            successRate: total > 0 ? (success / total) * 100 : 0,
            totalHoursSaved: parseFloat(stats.total_hours_saved),
            totalValueGenerated: parseFloat(stats.total_value_generated),
            avgRiskBefore: parseFloat(stats.avg_risk_before),
            avgRiskAfter: parseFloat(stats.avg_risk_after),
            deltaImprovementRate: stats.avg_risk_before > 0 ? ((stats.avg_risk_before - stats.avg_risk_after) / stats.avg_risk_before) * 100 : 0,
            avgLatencyMs: 0, // Placeholder needs runtime info
            queueBacklog: 0  // Placeholder needs queue size
        };
    }

    static async getRecentJobs(limit = 10) {
        const sql = `
            SELECT id, tenant_id, status, type, created_at, updated_at
            FROM jobs
            ORDER BY created_at DESC
            LIMIT ?
        `;
        const { rows } = await db.query(sql, [limit]);
        return rows;
    }

    static async getTenantsSummary() {
        // Assuming a tenants table exists with basic info
        const sql = `
            SELECT 
                tenant_id, 
                COUNT(*) as total_jobs,
                MAX(created_at) as last_activity
            FROM jobs
            GROUP BY tenant_id
            ORDER BY total_jobs DESC
            LIMIT 50
        `;
        const { rows } = await db.query(sql);
        return rows;
    }

    static async getGovernanceMetrics(range = '24h') {
        const interval = this.getInterval(range);
        
        // 1. Audit aggregates
        const auditSql = `
            SELECT 
                action_type,
                COUNT(*) as count
            FROM governance_audit
            WHERE created_at >= NOW() - ${interval}
            AND (action_type LIKE 'POLICY_ENFORCEMENT_%' OR action_type LIKE 'RESOURCE_GOVERNANCE_%')
            GROUP BY action_type
        `;
        const { rows: auditRows } = await db.query(auditSql);

        // 2. Policy state
        const policySql = `
            SELECT 
                COUNT(*) as active_count,
                COUNT(DISTINCT CASE WHEN scope_type = 'tenant' THEN scope_id END) as restricted_tenants
            FROM governance_policies
            WHERE status = 'active'
        `;
        const { rows: policyRows } = await db.query(policySql);

        // 3. Hot metrics from Redis (Phase 22.E.1 Optimized)
        let activeConcurrencySlots = 0;
        let aiStats = {
            totalTokens24h: 0,
            totalCost24h: 0,
            activeAIConcurrency: 0,
            degradedJobs: 0,
            deniedByBudget: 0
        };

        try {
            const activeTenants = await redis.smembers('ppos:active_tenants');
            const now = Date.now();

            for (const tenantId of activeTenants) {
                // Concurrency
                const cKey = Keys.concurrency(tenantId);
                const aicKey = Keys.aiConcurrency(tenantId);
                const [concurrency, aiConcurrency] = await Promise.all([
                    redis.get(cKey),
                    redis.get(aicKey)
                ]);
                activeConcurrencySlots += parseInt(concurrency || 0);
                aiStats.activeAIConcurrency += parseInt(aiConcurrency || 0);

                // AI Usage (Current Day)
                const costDayKey = Keys.aiBudget(tenantId, 'cost', 'day', now);
                const tokensDayKey = Keys.aiBudget(tenantId, 'tokens', 'day', now);
                const [cost, tokens] = await Promise.all([
                    redis.get(costDayKey),
                    redis.get(tokensDayKey)
                ]);
                aiStats.totalCost24h += parseFloat(cost || 0);
                aiStats.totalTokens24h += parseInt(tokens || 0);
            }
        } catch (e) { 
            console.error('Redis metrics error:', e.message); 
        }

        // 4. Scheduler Metrics (Phase 20.D.5)
        let schedulerStats = {
            selected: 0,
            skipped: 0,
            agingApplied: 0,
            starvationPrevented: 0
        };
        try {
            const dayKey = `ppos:metrics:scheduler:${new Date().toISOString().slice(0, 10)}`;
            const stats = await redis.hgetall(dayKey);
            if (stats) {
                schedulerStats.selected = parseInt(stats.dispatch_selected) || 0;
                schedulerStats.skipped = parseInt(stats.dispatch_skipped) || 0;
                schedulerStats.agingApplied = parseInt(stats.aging_applied) || 0;
                schedulerStats.starvationPrevented = parseInt(stats.starvation_prevented) || 0;
            }
        } catch (e) { console.error('Redis scheduler metrics error:', e.message); }

        const metrics = {
            blockedJobs: 0,
            quarantinedJobs: 0,
            throttledJobs: 0,
            deniedByQuota: 0,
            delayedJobs: 0,
            activePolicies: policyRows[0]?.active_count || 0,
            restrictedTenants: policyRows[0]?.restricted_tenants || 0,
            estimatedPreventedCost: 0,
            activeConcurrencySlots,
            schedulerStats,
            aiStats
        };

        auditRows.forEach(row => {
            if (row.action_type === 'POLICY_ENFORCEMENT_DENY') metrics.blockedJobs = row.count;
            if (row.action_type === 'POLICY_ENFORCEMENT_QUARANTINE') metrics.quarantinedJobs = row.count;
            if (row.action_type === 'POLICY_ENFORCEMENT_THROTTLE' || row.action_type === 'RESOURCE_GOVERNANCE_THROTTLE') {
                metrics.throttledJobs += row.count;
            }
            if (row.action_type === 'RESOURCE_GOVERNANCE_DENY') metrics.deniedByQuota = row.count;
            if (row.action_type === 'RESOURCE_GOVERNANCE_DELAY') metrics.delayedJobs = row.count;
            
            // AI Audit signals
            if (row.action_type === 'AI_BUDGET_DENY') metrics.aiStats.deniedByBudget += row.count;
            if (row.action_type === 'AI_BUDGET_DEGRADE') metrics.aiStats.degradedJobs += row.count;
        });

        // Heuristic: Estimated Prevented ROI = Blocked Jobs * $5.00 (avg execution cost)
        metrics.estimatedPreventedCost = (metrics.blockedJobs + metrics.deniedByQuota) * 5.00;

        return metrics;
    }

    static getInterval(range) {
        switch (range) {
            case '7d': return 'INTERVAL 7 DAY';
            case '30d': return 'INTERVAL 30 DAY';
            case '24h':
            default: return 'INTERVAL 1 DAY';
        }
    }
}

module.exports = MetricsService;
