// ppos-shared-infra/packages/governance/fairDispatchOrchestrator.js
const { preflightQueue, autofixQueue } = require('../data/queue');
const FairSchedulerService = require('./fairSchedulerService');
const db = require('../data/db');

/**
 * FairDispatchOrchestrator (Phase 20.D)
 * Background process that periodically re-ranks jobs in the waiting queues
 * to ensure weighted fairness and prevent starvation.
 */
class FairDispatchOrchestrator {
    /**
     * Run a re-ranking cycle for all managed queues
     */
    static async run() {
        console.log('[FAIR-DISPATCH] Starting orchestration cycle...');
        
        try {
            await this.orchestrateQueue('preflight-v2', preflightQueue);
            await this.orchestrateQueue('autofix-v2', autofixQueue);
            
            console.log('[FAIR-DISPATCH] Orchestration cycle completed.');
        } catch (err) {
            console.error('[FAIR-DISPATCH-ERROR] Orchestration failed:', err.message);
        }
    }

    /**
     * Re-rank the top 50 jobs in a specific BullMQ queue
     */
    static async orchestrateQueue(name, queue) {
        // 1. Get top 50 waiting jobs
        const jobs = await queue.getJobs(['waiting'], 0, 49, true);
        if (jobs.length === 0) return;

        console.log(`[FAIR-DISPATCH][${name}] Re-ranking ${jobs.length} candidate(s)...`);

        // 2. Score and Rank candidates
        const ranking = await FairSchedulerService.rankAndSelect(jobs);
        
        if (!ranking || !ranking.allTraces) return;

        // 3. Apply priorities in BullMQ
        let selectedCount = 0;
        let agingApplied = 0;
        let starvationPrevented = 0;
        const classWaitTimes = {}; // Track wait times per class for p95 baseline

        for (const trace of ranking.allTraces) {
            const job = jobs.find(j => j.id === trace.jobId);
            if (!job) continue;

            const newPriority = Math.max(1, 2000 - Math.floor(trace.dispatchScore));
            
            // Telemetry signals (Phase 22.B.2)
            if (trace.agingScore > 50) agingApplied++;
            if (trace.agingScore >= 300) starvationPrevented++; // Hit the cap (Rescue)

            const enqueuedAt = new Date(job.data.governance?.enqueuedAt || Date.now());
            const waitTime = (Date.now() - enqueuedAt.getTime()) / 1000;
            
            const pClass = trace.priorityClass || 'normal';
            if (!classWaitTimes[pClass]) classWaitTimes[pClass] = [];
            classWaitTimes[pClass].push(waitTime);

            // Update BullMQ priority
            await job.changePriority({ priority: newPriority }).catch(err => {
                console.error(`[FAIR-DISPATCH][${name}] Failed to update priority for job ${job.id}:`, err.message);
            });
        }

        // 4. Trace the decision for the winner
        if (ranking.winner) {
            selectedCount = 1;
            await this.logDispatchAudit(ranking.trace);
        }

        // 5. Update Hot Metrics in Redis (Enhanced for Phase 22.B)
        const redis = require('../data/redis');
        const dayKey = `ppos:metrics:scheduler:${new Date().toISOString().slice(0, 10)}`;
        const multi = redis.multi();
        
        multi.hincrby(dayKey, 'dispatch_cycles', 1);
        multi.hincrby(dayKey, 'dispatch_selected', selectedCount);
        multi.hincrby(dayKey, 'dispatch_candidates_total', jobs.length);
        multi.hincrby(dayKey, 'aging_applied', agingApplied);
        multi.hincrby(dayKey, 'starvation_prevented', starvationPrevented);

        // Store avg wait times per class
        for (const [pClass, times] of Object.entries(classWaitTimes)) {
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            multi.hset(dayKey, `avg_wait_s:${pClass}`, avg.toFixed(2));
        }

        multi.expire(dayKey, 86400 * 7);
        await multi.exec();
    }

    /**
     * Log the dispatcher's top decision for audit
     */
    static async logDispatchAudit(trace) {
        try {
            const sql = `
                INSERT INTO governance_audit (
                    operator_id, operator_role, action_type, target_type, target_id, reason, payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            await db.query(sql, [
                'fair-dispatcher',
                'system',
                'SCHEDULER_DISPATCH_RANKING',
                'job',
                trace.jobId,
                `Fair dispatch selection (score: ${trace.dispatchScore.toFixed(0)})`,
                JSON.stringify(trace)
            ]);
        } catch (err) {
            console.error('[FAIR-DISPATCH-AUDIT] Failed to log:', err.message);
        }
    }
}

module.exports = FairDispatchOrchestrator;
