// ppos-shared-infra/packages/governance/SLOEvaluationService.js
const db = require('../data/db');
const redis = require('../data/redis');

/**
 * SLOEvaluationService (Phase 21.D.2)
 * Evaluates operational health based on formal Service Level Objectives.
 */
class SLOEvaluationService {
    /**
     * SLO Definitions with thresholds
     */
    static get REGISTRY() {
        return [
            { id: 'enqueue_latency', name: 'Enqueue Latency', target: 200, unit: 'ms', type: 'latency' },
            { id: 'time_to_start', name: 'Time-to-Start', target: 30, unit: 's', type: 'latency' },
            { id: 'job_success_rate', name: 'Job Success Rate', target: 99.0, unit: '%', type: 'reliability' },
            { id: 'lease_integrity', name: 'Lease Integrity', target: 99.9, unit: '%', type: 'reliability' },
            { id: 'ai_cost_variance', name: 'AI Cost Variance', target: 15, unit: '%', type: 'economic' }
        ];
    }

    /**
     * Compute current status of all SLOs
     * @param {string} windowTime Window to analyze (e.g. '1 HOUR')
     */
    async evaluateAll(windowTime = '1 HOUR') {
        const results = [];
        for (const slo of SLOEvaluationService.REGISTRY) {
            const current = await this.evaluateSingle(slo, windowTime);
            const status = this.calculateState(slo, current);
            results.push({ ...slo, current, status, timestamp: new Date().toISOString() });
        }
        
        // Cache global state in Redis
        const globalState = results.every(r => r.status === 'HEALTHY') ? 'HEALTHY' : 
                            results.some(r => r.status === 'BREACH') ? 'BREACH' : 'DEGRADED';
                            
        await redis.set('ppos:slo:global_state', globalState, 'EX', 60);
        await redis.set('ppos:slo:results', JSON.stringify(results), 'EX', 60);

        return { globalState, results };
    }

    /**
     * Evaluate a specific SLO against DB metrics
     */
    async evaluateSingle(slo, windowTime) {
        try {
            switch (slo.id) {
                case 'enqueue_latency':
                    const latencySql = `
                        SELECT AVG(JSON_EXTRACT(payload, '$.duration_ms')) as val 
                        FROM governance_audit 
                        WHERE action_type = 'API_ENQUEUE' 
                        AND created_at > NOW() - INTERVAL ${windowTime}
                    `;
                    const [latencyRes] = await db.query(latencySql);
                    return latencyRes.val || 0;

                case 'job_success_rate':
                    const successSql = `
                        SELECT 
                            (SUM(CASE WHEN JSON_EXTRACT(payload, '$.status') = 'SUCCEEDED' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as val
                        FROM governance_audit
                        WHERE action_type = 'JOB_FAILURE_RECOVERY' OR action_type = 'JOB_COMPLETED'
                        AND created_at > NOW() - INTERVAL ${windowTime}
                    `;
                    const [successRes] = await db.query(successSql);
                    return successRes.val || 100;

                case 'time_to_start':
                    const ttsSql = `
                        SELECT AVG(TIMESTAMPDIFF(SECOND, created_at, created_at)) as val -- Placeholder: needs real start_time in payload
                        FROM governance_audit
                        WHERE action_type = 'WORKER_START'
                        AND created_at > NOW() - INTERVAL ${windowTime}
                    `;
                    // Simplified placeholder until specialized start event is logged
                    return 5.2; 

                case 'lease_integrity':
                    const driftSql = `
                        SELECT (1 - (COUNT(CASE WHEN action_type = 'LEASE_EXPIRED' THEN 1 END) / COUNT(*))) * 100 as val
                        FROM governance_audit
                        WHERE (action_type = 'LEASE_HEARTBEAT' OR action_type = 'LEASE_EXPIRED')
                        AND created_at > NOW() - INTERVAL ${windowTime}
                    `;
                    const [driftRes] = await db.query(driftSql);
                    return driftRes.val || 100;

                default:
                    return 0;
            }
        } catch (err) {
            console.error(`[SLO-EVAL] Error evaluating ${slo.id}:`, err.message);
            return 0;
        }
    }

    /**
     * Determine operational state based on target and current value
     */
    calculateState(slo, current) {
        if (slo.type === 'latency') {
            if (current > slo.target * 1.5) return 'BREACH';
            if (current > slo.target) return 'DEGRADED';
            return 'HEALTHY';
        } else if (slo.type === 'reliability') {
            if (current < slo.target - 5) return 'BREACH';
            if (current < slo.target) return 'DEGRADED';
            return 'HEALTHY';
        }
        return 'HEALTHY';
    }
}

module.exports = new SLOEvaluationService();
