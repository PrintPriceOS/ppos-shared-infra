// ppos-shared-infra/packages/governance/governanceManager.js
require('dotenv').config();
const ResourceUsageReconciler = require('./resourceUsageReconciler');
const FairDispatchOrchestrator = require('./fairDispatchOrchestrator');
const sloEvaluationService = require('./SLOEvaluationService');

/**
 * GovernanceManager (Phase 20.D & 21.D)
 * Orchestrates background governance tasks:
 * 1. Weighted Fair Scheduling (Hot Loop)
 * 2. Resource Usage Reconciliation (Cold Loop)
 * 3. SLO Monitoring & Auto-Mitigation (Health Loop)
 */
async function main() {
    process.env.WORKER_POOL = 'POOL_D';
    console.log('--- PRINTPRICE OS GOVERNANCE MANAGER ---');
    console.log(`[BOOT] Mode: ${process.env.NODE_ENV || 'development'} | Pool: ${process.env.WORKER_POOL}`);
    console.log('[BOOT] Initializing background orchestration loops (Fair Dispatch, Reconcile, SLO)...');

    // 1. Fair Dispatch Loop (Hot Loop)
    const DISPATCH_INTERVAL = process.env.GOVERNANCE_DISPATCH_MS || 10000;
    setInterval(async () => {
        try {
            await FairDispatchOrchestrator.run();
        } catch (err) {
            console.error('[GOVERNANCE-MANAGER][DISPATCH-ERROR]', err.message);
        }
    }, DISPATCH_INTERVAL);

    // 2. Resource Reconciliation Loop (Cold Loop)
    const RECONCILE_INTERVAL = process.env.GOVERNANCE_RECONCILE_MS || 60000;
    setInterval(async () => {
        try {
            await ResourceUsageReconciler.run();
        } catch (err) {
            console.error('[GOVERNANCE-MANAGER][RECONCILE-ERROR]', err.message);
        }
    }, RECONCILE_INTERVAL);

    // 3. SLO Monitoring & Auto-Mitigation (Health Loop)
    // Frequency: 1 minute
    setInterval(async () => {
        try {
            console.log('[GOVERNANCE-MANAGER] Running SLO Health Check...');
            const evaluation = await sloEvaluationService.evaluateAll();
            
            if (evaluation.globalState === 'BREACH' || evaluation.globalState === 'DEGRADED') {
                console.warn(`[SLO-HEALTH] Platform in ${evaluation.globalState} state. Checking mitigations...`);
                await applyAutoMitigations(evaluation);
            }
        } catch (err) {
            console.error('[GOVERNANCE-MANAGER][SLO-ERROR]', err.message);
        }
    }, 60000);

    console.log('[READY] Governance Manager active and monitoring platform health.');
}

/**
 * Basic Auto-Mitigation Engine (Phase 21.D.4)
 */
async function applyAutoMitigations(evaluation) {
    const { results } = evaluation;
    const redis = require('../data/redis');
    const db = require('../data/db');

    for (const res of results) {
        if (res.status === 'BREACH') {
            // Mitigation M1: Pool A Throttling
            if (res.id === 'time_to_start' || res.id === 'lease_integrity') {
                console.warn('[MITIGATION][M1] SLO BREACH detected. Throttling Pool A concurrency...');
                await redis.set('ppos:config:pool_a_multiplier', '0.5', 'EX', 300); // Reduce by 50% for 5 mins
                await logMitigation('POOL_A_THROTTLE', res.id, 'Reduced concurrency multiplier to 0.5');
            }

            // Mitigation M2: AI Economy Fallback
            if (res.id === 'ai_cost_variance') {
                console.warn('[MITIGATION][M2] AI Cost Variance BREACH. Enabling Economy Fallback...');
                await redis.set('ppos:config:ai_force_economy', 'true', 'EX', 600);
                await logMitigation('AI_ECONOMY_FALLBACK', res.id, 'Forced economy tier for non-priority tenants');
            }
            // Mitigation M3: Optimization Rollback (Phase 22.G)
            if (res.id === 'time_to_start' || res.id === 'error_rate') {
                const featureFlagService = require('./FeatureFlagService');
                console.warn(`[MITIGATION][M3] ${res.id} BREACH detected. Rolling back Phase 22 optimizations...`);
                
                if (await featureFlagService.isEnabled('WARM_POOL_ENABLED')) {
                    await featureFlagService.setFlag('WARM_POOL_ENABLED', false);
                    await logMitigation('OPTIMIZATION_ROLLBACK', 'WARM_POOL_ENABLED', 'Auto-disabled due to latency spike');
                }
                
                if (await featureFlagService.isEnabled('AI_CACHE_ENABLED')) {
                    await featureFlagService.setFlag('AI_CACHE_ENABLED', false);
                    await logMitigation('OPTIMIZATION_ROLLBACK', 'AI_CACHE_ENABLED', 'Auto-disabled due to error/cost spike');
                }
            }
        }
    }
}

async function logMitigation(type, cause, action) {
    const db = require('../data/db');
    const sql = `
        INSERT INTO governance_audit (
            operator_id, operator_role, action_type, target_type, target_id, reason, payload
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [
        'governance-manager',
        'system',
        'AUTO_MITIGATION_APPLIED',
        'slo-breach',
        cause,
        `Mitigation ${type} applied`,
        JSON.stringify({ action, timestamp: new Date().toISOString() })
    ]);
}

// Global handle for crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('[GOVERNANCE-MANAGER-CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

main().catch(err => {
    console.error('[GOVERNANCE-MANAGER-FATAL-STARTUP]', err);
    process.exit(1);
});
