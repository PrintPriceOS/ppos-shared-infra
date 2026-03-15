// scripts/ops/profile_baseline.js
const { db } = require('../../ppos-shared-infra');

async function profile() {
    console.log('--- PRINTPRICE OS PERFORMANCE PROFILER ---');
    console.log('Target: Baseline Establishment (22.A)');

    try {
        // 1. Enqueue Latency (API Performance)
        const enqueueSql = `
            SELECT 
                AVG(JSON_EXTRACT(payload, '$.duration_ms')) as avg_ms,
                MAX(JSON_EXTRACT(payload, '$.duration_ms')) as max_ms
            FROM governance_audit 
            WHERE action_type = 'API_ENQUEUE'
        `;
        const [enqueue] = await db.query(enqueueSql);
        console.log(`[LATENCY] Enqueue: Avg: ${Math.round(enqueue.avg_ms || 0)}ms | Max: ${Math.round(enqueue.max_ms || 0)}ms`);

        // 2. Wait Time / Time-to-Start (Scheduler Performance)
        // We use the gap between API_ENQUEUE and JOB_START for specific job IDs
        const waitTimeSql = `
            SELECT 
                target_id as jobId,
                MIN(CASE WHEN action_type = 'API_ENQUEUE' THEN created_at END) as enqueued_at,
                MIN(CASE WHEN action_type = 'WORKER_START' OR action_type = 'JOB_FAILURE_RECOVERY' THEN created_at END) as started_at
            FROM governance_audit
            GROUP BY target_id
            HAVING enqueued_at IS NOT NULL AND started_at IS NOT NULL
        `;
        // Note: This query is heavy, in a real system we'd use a more specialized metrics DB.
        const res = await db.query(waitTimeSql);
        const waitTimes = res.map(r => (new Date(r.started_at) - new Date(r.enqueued_at)) / 1000).filter(t => t >= 0);
        
        if (waitTimes.length > 0) {
            const avgWait = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
            const p95Wait = waitTimes.sort((a, b) => a - b)[Math.floor(waitTimes.length * 0.95)];
            console.log(`[LATENCY] Time-to-Start: Avg: ${avgWait.toFixed(2)}s | p95: ${p95Wait.toFixed(2)}s`);
        } else {
            console.log('[LATENCY] Time-to-Start: Insufficient data');
        }

        // 3. AI Budget Variance (Economic Performance)
        const aiVarianceSql = `
            SELECT 
                AVG(ABS(JSON_EXTRACT(payload, '$.actual_cost') - JSON_EXTRACT(payload, '$.estimated_cost')) / JSON_EXTRACT(payload, '$.estimated_cost')) * 100 as variance
            FROM governance_audit 
            WHERE action_type = 'AI_BUDGET_RECONCILE'
            AND JSON_EXTRACT(payload, '$.estimated_cost') > 0
        `;
        const [variance] = await db.query(aiVarianceSql);
        console.log(`[ECONOMICS] AI Cost Variance: ${parseFloat(variance.variance || 0).toFixed(2)}%`);

        // 4. Resilience Hits (Runtime Resilience)
        const resiliencySql = `
            SELECT action_type, COUNT(*) as count
            FROM governance_audit
            WHERE action_type IN ('CIRCUIT_BREAKER_TRANSITION', 'JOB_FAILURE_RECOVERY', 'AUTO_MITIGATION_APPLIED')
            GROUP BY action_type
        `;
        const resilience = await db.query(resiliencySql);
        console.log('[RESILIENCE] Events Logged:');
        resilience.forEach(r => console.log(` - ${r.action_type}: ${r.count}`));

    } catch (err) {
        console.error('[PROFILER-ERROR]', err.message);
    } finally {
        process.exit(0);
    }
}

profile();
